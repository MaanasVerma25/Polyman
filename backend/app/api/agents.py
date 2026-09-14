import logging
from typing import List
from fastapi import APIRouter, HTTPException
from ..core.database import db_get_agents, db_create_agent, db_delete_agent
from ..models.agent import AgentCreate, AgentUpdate, AgentResponse

router = APIRouter(prefix="/api/agents", tags=["agents"])
logger = logging.getLogger("polyman.api.agents")

@router.get("", response_model=List[AgentResponse])
async def get_all_agents():
    agents = await db_get_agents()
    return [AgentResponse(**a) for a in agents]

@router.post("", response_model=AgentResponse)
async def create_custom_agent(payload: AgentCreate):
    try:
        agent = await db_create_agent(payload.model_dump())
        return AgentResponse(**agent)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to create agent: {e}")

@router.delete("/{agent_id}")
async def delete_custom_agent(agent_id: str):
    try:
        await db_delete_agent(agent_id)
        return {"status": "deleted", "id": agent_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
