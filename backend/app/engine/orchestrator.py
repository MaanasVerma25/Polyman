import asyncio
import json
import logging
import os
import uuid
from typing import Dict, Any, List, Optional
from ..core.config import settings
from ..core.events import event_manager
from ..core.database import db_create_run, db_update_run, db_insert_dag_nodes
from ..engine.llm import llm_gateway
from .dag import DAGExecutor

logger = logging.getLogger("polyman.engine.orchestrator")

# Active executor instances in-memory to allow pause/resume/abort
ACTIVE_EXECUTORS: Dict[str, DAGExecutor] = {}

class Orchestrator:
    def __init__(self):
        self.system_prompt = (
            "You are the Chief Orchestrator for Polyman. Your responsibility is to analyze a project request, "
            "determine which specialized agents are required (such as architect, sde, lawyer, auditor, accountant), "
            "and generate a DAG (Directed Acyclic Graph) of tasks with dependencies.\n\n"
            "Output strictly valid JSON in the following format:\n"
            "{\n"
            '  "plan_summary": "High level strategy overview",\n'
            '  "nodes": [\n'
            '    {\n'
            '      "id": "node-1",\n'
            '      "agent_role": "architect",\n'
            '      "title": "System Architecture & API Design",\n'
            '      "description": "Establish component boundaries and data models",\n'
            '      "dependencies": []\n'
            '    },\n'
            '    {\n'
            '      "id": "node-2",\n'
            '      "agent_role": "sde",\n'
            '      "title": "Implement Core Logic",\n'
            '      "description": "Scaffold and write source files",\n'
            '      "dependencies": ["node-1"]\n'
            '    }\n'
            '  ]\n'
            "}"
        )

    async def create_and_start_run(
        self,
        task_prompt: str,
        project_path: Optional[str] = None,
        selected_agents: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        run_id = f"run-{uuid.uuid4().hex[:8]}"
        project_path = project_path or settings.workspace_dir

        logger.info(f"Initiating run {run_id} for prompt: {task_prompt[:60]} in {project_path}")

        # 1. Create run record in DB
        await db_create_run(
            run_id=run_id,
            project_id=project_path,
            task_prompt=task_prompt,
            summary='Analyzing requirements and generating DAG...',
            status='pending'
        )

        # 2. Decompose task into DAG nodes using Orchestrator LLM
        dag_data = await self._decompose_task(task_prompt, selected_agents)
        nodes = dag_data.get("nodes", [])
        summary = dag_data.get("plan_summary", f"Plan generated with {len(nodes)} agent tasks.")

        # Ensure unique node IDs per run and remap dependencies
        id_map = {}
        for idx, node in enumerate(nodes):
            old_id = node.get("id", f"node-{idx}")
            new_id = f"{run_id}-{old_id}"
            id_map[old_id] = new_id
            node["id"] = new_id
            node["status"] = "pending"

        for node in nodes:
            node["dependencies"] = [id_map.get(d, d) for d in node.get("dependencies", [])]

        # 3. Persist DAG nodes to DB
        await db_update_run(run_id=run_id, summary=summary, status='running')
        await db_insert_dag_nodes(run_id=run_id, nodes=nodes)

        # 4. Broadcast DAG creation
        await event_manager.broadcast(run_id, "DAG_CREATED", {
            "run_id": run_id,
            "summary": summary,
            "nodes": nodes
        })

        # 5. Launch autonomous execution
        executor = DAGExecutor(run_id, project_path)
        ACTIVE_EXECUTORS[run_id] = executor
        # On Vercel serverless functions, background tasks die when the HTTP response completes.
        # Execution is driven by client-directed chunking via POST /api/runs/{run_id}/execute.
        # For non-serverless environments (local dev / persistent servers), launch background task.
        if not os.getenv("VERCEL"):
            asyncio.create_task(self._run_wrapper(executor, nodes, task_prompt))

        return {
            "run_id": run_id,
            "status": "running",
            "summary": summary,
            "nodes": nodes
        }

    async def _decompose_task(self, task_prompt: str, selected_agents: Optional[List[str]]) -> Dict[str, Any]:
        filter_hint = f"Focus primarily on these subagents: {', '.join(selected_agents)}." if selected_agents else ""
        user_prompt = (
            f"Analyze the following user task and create a multi-agent execution DAG.\n"
            f"TASK: {task_prompt}\n"
            f"{filter_hint}\n"
            f"Ensure subagents include architect, sde, lawyer, auditor, accountant where relevant."
        )

        response_text = await llm_gateway.generate_response(
            system_prompt=self.system_prompt,
            user_prompt=user_prompt,
            provider="gemini",
            model="gemini-2.0-flash"
        )

        try:
            cleaned = response_text.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            data = json.loads(cleaned.strip())
            if "nodes" in data and len(data["nodes"]) > 0:
                return data
        except Exception as e:
            logger.warning(f"Failed to parse orchestrator DAG JSON: {e}. Using standard enterprise pipeline.")

        # Default fallback enterprise pipeline
        return {
            "plan_summary": f"Orchestrated 5-agent pipeline for '{task_prompt[:50]}...'",
            "nodes": [
                {
                    "id": f"node-arch-{uuid.uuid4().hex[:4]}",
                    "agent_role": "architect",
                    "title": "Architecture Blueprint & Specs",
                    "description": "Formulate component topology and ADR",
                    "dependencies": []
                },
                {
                    "id": f"node-sde-{uuid.uuid4().hex[:4]}",
                    "agent_role": "sde",
                    "title": "Code Synthesis & Test Suite",
                    "description": "Scaffold and implement project files",
                    "dependencies": [f"node-arch-{uuid.uuid4().hex[:4]}"]
                },
                {
                    "id": f"node-lawyer-{uuid.uuid4().hex[:4]}",
                    "agent_role": "lawyer",
                    "title": "Legal & Licensing Review",
                    "description": "Assess OSS licenses and draft compliance docs",
                    "dependencies": [f"node-arch-{uuid.uuid4().hex[:4]}"]
                },
                {
                    "id": f"node-acc-{uuid.uuid4().hex[:4]}",
                    "agent_role": "accountant",
                    "title": "FinOps & Cloud Cost Model",
                    "description": "Project server compute and API token economics",
                    "dependencies": [f"node-arch-{uuid.uuid4().hex[:4]}"]
                },
                {
                    "id": f"node-audit-{uuid.uuid4().hex[:4]}",
                    "agent_role": "auditor",
                    "title": "Security Sweep & Quality Gating",
                    "description": "OWASP vulnerability scan and code validation",
                    "dependencies": [f"node-sde-{uuid.uuid4().hex[:4]}", f"node-lawyer-{uuid.uuid4().hex[:4]}"]
                }
            ]
        }

    async def _run_wrapper(self, executor: DAGExecutor, nodes: List[Dict[str, Any]], task_prompt: str):
        try:
            await executor.execute_dag(nodes, task_prompt)
        except Exception as e:
            logger.error(f"Execution error on run {executor.run_id}: {e}")
        finally:
            ACTIVE_EXECUTORS.pop(executor.run_id, None)

orchestrator = Orchestrator()
