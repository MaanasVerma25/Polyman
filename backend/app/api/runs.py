import json
import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
import aiosqlite
from ..core.config import settings
from ..core.events import event_manager
from ..engine.orchestrator import orchestrator, ACTIVE_EXECUTORS
from ..models.run import RunCreate, RunResponse, DAGNodeResponse, AgentLogResponse

router = APIRouter(prefix="/api/runs", tags=["runs"])
logger = logging.getLogger("polyman.api.runs")

@router.post("", response_model=dict)
async def create_run(req: RunCreate):
    res = await orchestrator.create_and_start_run(
        task_prompt=req.task_prompt,
        project_path=req.project_path,
        selected_agents=req.selected_agents
    )
    return res

@router.get("", response_model=List[dict])
async def list_runs(limit: int = 20):
    async with aiosqlite.connect(settings.db_path) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM runs ORDER BY created_at DESC LIMIT ?", (limit,)
        ) as cursor:
            rows = await cursor.fetchall()
            return [dict(r) for r in rows]

@router.get("/{run_id}", response_model=dict)
async def get_run(run_id: str):
    async with aiosqlite.connect(settings.db_path) as db:
        db.row_factory = aiosqlite.Row
        
        # Fetch run
        async with db.execute("SELECT * FROM runs WHERE id = ?", (run_id,)) as cursor:
            run_row = await cursor.fetchone()
            if not run_row:
                raise HTTPException(status_code=404, detail="Run not found")
            run_data = dict(run_row)

        # Fetch nodes
        async with db.execute(
            "SELECT * FROM dag_nodes WHERE run_id = ? ORDER BY started_at ASC, id ASC", (run_id,)
        ) as cursor:
            node_rows = await cursor.fetchall()
            nodes = []
            for n in node_rows:
                nd = dict(n)
                nd["dependencies"] = json.loads(nd["dependencies"]) if nd["dependencies"] else []
                nd["input_data"] = json.loads(nd["input_data"]) if nd["input_data"] else None
                nd["output_data"] = json.loads(nd["output_data"]) if nd["output_data"] else None
                nodes.append(nd)
            run_data["nodes"] = nodes

        # Fetch logs
        async with db.execute(
            "SELECT * FROM agent_logs WHERE run_id = ? ORDER BY id ASC", (run_id,)
        ) as cursor:
            log_rows = await cursor.fetchall()
            run_data["logs"] = [dict(l) for l in log_rows]

        return run_data

@router.post("/{run_id}/pause")
async def pause_run(run_id: str):
    executor = ACTIVE_EXECUTORS.get(run_id)
    if not executor:
        raise HTTPException(status_code=404, detail="Active execution not found")
    executor.pause()
    await event_manager.broadcast(run_id, "RUN_PAUSED", {"run_id": run_id})
    return {"status": "paused"}

@router.post("/{run_id}/resume")
async def resume_run(run_id: str):
    executor = ACTIVE_EXECUTORS.get(run_id)
    if not executor:
        raise HTTPException(status_code=404, detail="Active execution not found")
    executor.resume()
    await event_manager.broadcast(run_id, "RUN_RESUMED", {"run_id": run_id})
    return {"status": "resumed"}

@router.post("/{run_id}/cancel")
async def cancel_run(run_id: str):
    executor = ACTIVE_EXECUTORS.get(run_id)
    if not executor:
        raise HTTPException(status_code=404, detail="Active execution not found")
    executor.cancel()
    await event_manager.broadcast(run_id, "RUN_CANCELLED", {"run_id": run_id})
    return {"status": "cancelled"}

@router.websocket("/ws/{run_id}")
async def websocket_endpoint(websocket: WebSocket, run_id: str):
    await event_manager.connect(websocket, run_id)
    try:
        while True:
            # Keep-alive receive
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        event_manager.disconnect(websocket, run_id)
    except Exception as e:
        logger.warning(f"WebSocket error: {e}")
        event_manager.disconnect(websocket, run_id)
