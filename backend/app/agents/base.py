import json
import logging
from typing import Dict, Any, Optional
import aiosqlite
from ..core.config import settings
from ..core.events import event_manager
from ..engine.llm import llm_gateway

logger = logging.getLogger("polyman.agent")

class BaseAgent:
    def __init__(
        self,
        role: str,
        name: str,
        system_prompt: str,
        default_provider: str = "gemini",
        default_model: str = "gemini-2.0-flash",
        avatar: str = "Bot",
        color: str = "#6366f1"
    ):
        self.role = role
        self.name = name
        self.system_prompt = system_prompt
        self.default_provider = default_provider
        self.default_model = default_model
        self.avatar = avatar
        self.color = color

    async def log_event(self, run_id: str, node_id: Optional[str], event_type: str, content: str):
        # Broadcast via WebSocket
        await event_manager.broadcast(run_id, f"AGENT_{event_type.upper()}", {
            "node_id": node_id,
            "agent_role": self.role,
            "agent_name": self.name,
            "event_type": event_type,
            "content": content
        })

        # Save to database
        try:
            async with aiosqlite.connect(settings.db_path) as db:
                await db.execute("""
                    INSERT INTO agent_logs (run_id, node_id, agent_role, event_type, content)
                    VALUES (?, ?, ?, ?, ?)
                """, (run_id, node_id, self.role, event_type, content))
                await db.commit()
        except Exception as e:
            logger.error(f"Failed to persist agent log: {e}")

    async def execute_node(
        self,
        project_path: str,
        run_id: str,
        node_id: str,
        task_prompt: str,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Override in subclasses for role-specific execution."""
        raise NotImplementedError
