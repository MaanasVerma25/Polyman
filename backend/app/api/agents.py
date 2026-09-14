import json
import uuid
from typing import List
from fastapi import APIRouter, HTTPException
import aiosqlite
from ..core.config import settings
from ..models.agent import AgentCreate, AgentUpdate, AgentResponse

router = APIRouter(prefix="/api/agents", tags=["agents"])

@router.get("", response_model=List[AgentResponse])
async def get_all_agents():
    async with aiosqlite.connect(settings.db_path) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM custom_agents ORDER BY is_builtin DESC, name ASC") as cursor:
            rows = await cursor.fetchall()
            results = []
            for r in rows:
                item = dict(r)
                item["tools"] = json.loads(item["tools"]) if item["tools"] else []
                item["is_builtin"] = bool(item["is_builtin"])
                results.append(AgentResponse(**item))
            return results

@router.post("", response_model=AgentResponse)
async def create_custom_agent(payload: AgentCreate):
    agent_id = f"agent-{uuid.uuid4().hex[:8]}"
    async with aiosqlite.connect(settings.db_path) as db:
        try:
            await db.execute("""
                INSERT INTO custom_agents (
                    id, role, name, avatar, color, description, system_prompt,
                    default_provider, default_model, tools, is_builtin
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
            """, (
                agent_id, payload.role.lower(), payload.name, payload.avatar,
                payload.color, payload.description, payload.system_prompt,
                payload.default_provider, payload.default_model,
                json.dumps(payload.tools)
            ))
            await db.commit()
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to create agent: {e}")

    return AgentResponse(id=agent_id, is_builtin=False, **payload.model_dump())

@router.delete("/{agent_id}")
async def delete_custom_agent(agent_id: str):
    async with aiosqlite.connect(settings.db_path) as db:
        # Prevent deletion of builtin agents
        async with db.execute("SELECT is_builtin FROM custom_agents WHERE id = ?", (agent_id,)) as cursor:
            row = await cursor.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Agent not found")
            if row[0] == 1:
                raise HTTPException(status_code=400, detail="Cannot delete built-in agent")

        await db.execute("DELETE FROM custom_agents WHERE id = ?", (agent_id,))
        await db.commit()
    return {"status": "deleted", "id": agent_id}
