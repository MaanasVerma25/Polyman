import json
import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from ..core.config import settings
from ..core.events import event_manager
from ..core.database import db_get_runs, db_get_run_detail
from ..engine.orchestrator import orchestrator, ACTIVE_EXECUTORS
from ..engine.dag import DAGExecutor
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
    return await db_get_runs(limit=limit)

@router.get("/{run_id}", response_model=dict)
async def get_run(run_id: str):
    run_data = await db_get_run_detail(run_id)
    if not run_data:
        raise HTTPException(status_code=404, detail="Run not found")
    return run_data

@router.post("/{run_id}/execute")
async def execute_run(run_id: str):
    """
    Execute pending DAG nodes for a run. Supports serverless slicing with a 45s safety budget.
    """
    run_data = await db_get_run_detail(run_id)
    if not run_data:
        raise HTTPException(status_code=404, detail="Run not found")

    current_status = run_data.get("status")
    if current_status in ("completed", "failed", "cancelled"):
        return {"status": current_status, "continue": False}

    nodes = run_data.get("nodes", [])
    task_prompt = run_data.get("task_prompt", "")
    project_path = run_data.get("project_id") or settings.workspace_dir

    executor = ACTIVE_EXECUTORS.get(run_id)
    if not executor:
        executor = DAGExecutor(run_id, project_path)
        ACTIVE_EXECUTORS[run_id] = executor

    result = {"continue": False}
    try:
        result = await executor.execute_dag(nodes, task_prompt, max_duration=45.0)
        return result
    finally:
        # If execution finished, remove from active executors
        if not result.get("continue", False):
            ACTIVE_EXECUTORS.pop(run_id, None)

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
