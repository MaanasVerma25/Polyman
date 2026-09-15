import asyncio
import json
import logging
from typing import Dict, Any, List, Optional
from ..core.config import settings
from ..core.events import event_manager
from ..core.database import db_update_dag_node, db_update_run
from ..agents import get_agent_for_role

logger = logging.getLogger("polyman.engine.dag")

class DAGExecutor:
    def __init__(self, run_id: str, project_path: str):
        self.run_id = run_id
        self.project_path = project_path
        self._is_paused = False
        self._is_cancelled = False

    def pause(self):
        self._is_paused = True

    def resume(self):
        self._is_paused = False

    def cancel(self):
        self._is_cancelled = True

    async def execute_dag(
        self,
        nodes: List[Dict[str, Any]],
        task_prompt: str,
        max_duration: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Execute DAG nodes honoring dependency constraints, concurrency, and optional timeout limits.
        """
        import time
        start_time = time.time()

        node_map = {n["id"]: n for n in nodes}
        completed_nodes = {n["id"] for n in nodes if n.get("status") == "completed"}
        failed_nodes = {n["id"] for n in nodes if n.get("status") in ("failed", "skipped")}
        node_outputs = {
            n["agent_role"]: n.get("output_data")
            for n in nodes
            if n.get("status") == "completed" and n.get("output_data")
        }

        # If already all completed
        if len(completed_nodes) + len(failed_nodes) >= len(nodes):
            final_status = "completed" if not failed_nodes else "completed_with_warnings"
            await self._update_run_status(final_status)
            return {
                "status": final_status,
                "continue": False,
                "completed_nodes": list(completed_nodes),
                "outputs": node_outputs
            }

        await event_manager.broadcast(self.run_id, "RUN_STARTED", {
            "run_id": self.run_id,
            "total_nodes": len(nodes)
        })

        while len(completed_nodes) + len(failed_nodes) < len(nodes):
            if self._is_cancelled:
                logger.info(f"Run {self.run_id} cancelled by user.")
                await self._update_run_status("cancelled")
                return {"status": "cancelled", "continue": False}

            while self._is_paused:
                await asyncio.sleep(0.5)

            # Check if duration budget reached (to prevent serverless 60s hard drop)
            if max_duration and (time.time() - start_time) >= max_duration:
                logger.info(f"Run {self.run_id} reached execution slice budget ({max_duration}s). Yielding chunk.")
                return {
                    "status": "running",
                    "continue": True,
                    "completed_nodes": list(completed_nodes),
                    "failed_nodes": list(failed_nodes),
                    "total": len(nodes)
                }

            # Find ready nodes: status is pending and all dependencies are completed
            ready_nodes = []
            for node_id, node in node_map.items():
                if node.get("status", "pending") in ("pending", None):
                    deps = node.get("dependencies", [])
                    if all(dep in completed_nodes for dep in deps):
                        ready_nodes.append(node)

            if not ready_nodes:
                # If no ready nodes and some nodes remain pending, check for deadlocks
                pending = [n for n in nodes if n.get("status", "pending") in ("pending", None)]
                if pending:
                    logger.warning(f"Unresolvable dependencies or failed parents for: {[n['id'] for n in pending]}")
                    for n in pending:
                        n["status"] = "skipped"
                        await self._update_node_status(n["id"], "skipped")
                        failed_nodes.add(n["id"])
                break

            # Execute ready nodes concurrently
            tasks = [
                self._execute_single_node(node, task_prompt, node_outputs)
                for node in ready_nodes
            ]
            results = await asyncio.gather(*tasks, return_exceptions=True)

            for node, res in zip(ready_nodes, results):
                if isinstance(res, Exception):
                    logger.error(f"Node {node['id']} failed with error: {res}")
                    node["status"] = "failed"
                    failed_nodes.add(node["id"])
                    await self._update_node_status(node["id"], "failed", output={"error": str(res)})
                elif isinstance(res, dict) and res.get("status") == "completed":
                    node["status"] = "completed"
                    completed_nodes.add(node["id"])
                    node_outputs[node["agent_role"]] = res
                    await self._update_node_status(node["id"], "completed", output=res)
                else:
                    node["status"] = "failed"
                    failed_nodes.add(node["id"])
                    await self._update_node_status(node["id"], "failed", output=res if isinstance(res, dict) else {"error": str(res)})

            # Broadcast DAG state update
            await event_manager.broadcast(self.run_id, "DAG_PROGRESS", {
                "completed": list(completed_nodes),
                "failed": list(failed_nodes),
                "total": len(nodes)
            })

        final_status = "completed" if not failed_nodes else "completed_with_warnings"
        await self._update_run_status(final_status)
        await event_manager.broadcast(self.run_id, "RUN_COMPLETED", {
            "status": final_status,
            "completed_nodes": len(completed_nodes),
            "failed_nodes": len(failed_nodes)
        })

        return {
            "status": final_status,
            "continue": False,
            "completed_nodes": list(completed_nodes),
            "outputs": node_outputs
        }

    async def _execute_single_node(
        self,
        node: Dict[str, Any],
        task_prompt: str,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        node_id = node["id"]
        role = node["agent_role"]
        node["status"] = "running"
        
        await self._update_node_status(node_id, "running")
        await event_manager.broadcast(self.run_id, "NODE_STARTED", {
            "node_id": node_id,
            "agent_role": role,
            "title": node.get("title", "")
        })

        agent = get_agent_for_role(role)
        try:
            output = await agent.execute_node(
                project_path=self.project_path,
                run_id=self.run_id,
                node_id=node_id,
                task_prompt=task_prompt,
                context=context
            )
            await event_manager.broadcast(self.run_id, "NODE_COMPLETED", {
                "node_id": node_id,
                "agent_role": role,
                "output": output
            })
            return output
        except Exception as e:
            logger.error(f"Agent execution failed for {role}: {e}")
            await event_manager.broadcast(self.run_id, "NODE_FAILED", {
                "node_id": node_id,
                "agent_role": role,
                "error": str(e)
            })
            raise

    async def _update_node_status(self, node_id: str, status: str, output: Optional[Dict] = None):
        try:
            await db_update_dag_node(node_id=node_id, status=status, output=output)
        except Exception as e:
            logger.error(f"Failed to update node status: {e}")

    async def _update_run_status(self, status: str):
        try:
            await db_update_run(run_id=self.run_id, status=status)
        except Exception as e:
            logger.error(f"Failed to update run status: {e}")
