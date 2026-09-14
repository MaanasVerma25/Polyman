import os
from pathlib import Path
from pydantic import BaseModel, Field

# Root directory of workspace
WORKSPACE_DIR = Path(__file__).resolve().parent.parent.parent.parent
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseModel):
    app_name: str = "Polyman"
    app_version: str = "1.0.0"
    debug: bool = True
    
    # Workspace & Storage (override via env for production deployments)
    workspace_dir: str = Field(default_factory=lambda: os.getenv("WORKSPACE_DIR", str(WORKSPACE_DIR)))
    db_path: str = Field(default_factory=lambda: os.getenv("DB_PATH", str(BACKEND_DIR / "polyman.db")))
    
    # LLM Settings (Stored in memory / config or overridden via DB/UI)
    openai_api_key: str = Field(default_factory=lambda: os.getenv("OPENAI_API_KEY", ""))
    anthropic_api_key: str = Field(default_factory=lambda: os.getenv("ANTHROPIC_API_KEY", ""))
    gemini_api_key: str = Field(default_factory=lambda: os.getenv("GEMINI_API_KEY", ""))
    ollama_base_url: str = Field(default_factory=lambda: os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"))

    # Default model choices per agent
    agent_models: dict = {
        "orchestrator": {"provider": "gemini", "model": "gemini-2.0-flash"},
        "architect": {"provider": "gemini", "model": "gemini-2.0-flash"},
        "sde": {"provider": "anthropic", "model": "claude-3-7-sonnet"},
        "lawyer": {"provider": "openai", "model": "gpt-4o"},
        "auditor": {"provider": "gemini", "model": "gemini-2.0-flash"},
        "accountant": {"provider": "openai", "model": "gpt-4o-mini"}
    }

settings = Settings()
