from typing import Dict, Any, Optional
from fastapi import APIRouter
from pydantic import BaseModel
from ..core.config import settings

router = APIRouter(prefix="/api/settings", tags=["settings"])

class SettingsUpdate(BaseModel):
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    gemini_api_key: Optional[str] = None
    ollama_base_url: Optional[str] = None
    agent_models: Optional[Dict[str, Dict[str, str]]] = None

@router.get("")
async def get_settings():
    def mask(key: str) -> str:
        if not key:
            return ""
        if len(key) <= 8:
            return "****"
        return f"{key[:4]}...{key[-4:]}"

    return {
        "workspace_dir": settings.workspace_dir,
        "openai_configured": bool(settings.openai_api_key),
        "anthropic_configured": bool(settings.anthropic_api_key),
        "gemini_configured": bool(settings.gemini_api_key),
        "ollama_base_url": settings.ollama_base_url,
        "keys_masked": {
            "openai": mask(settings.openai_api_key),
            "anthropic": mask(settings.anthropic_api_key),
            "gemini": mask(settings.gemini_api_key),
        },
        "agent_models": settings.agent_models
    }

@router.post("")
async def update_settings(payload: SettingsUpdate):
    if payload.openai_api_key is not None:
        settings.openai_api_key = payload.openai_api_key
    if payload.anthropic_api_key is not None:
        settings.anthropic_api_key = payload.anthropic_api_key
    if payload.gemini_api_key is not None:
        settings.gemini_api_key = payload.gemini_api_key
    if payload.ollama_base_url is not None:
        settings.ollama_base_url = payload.ollama_base_url
    if payload.agent_models is not None:
        settings.agent_models.update(payload.agent_models)

    return {"status": "updated"}
