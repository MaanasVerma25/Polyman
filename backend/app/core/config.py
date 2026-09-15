import os
from pathlib import Path
from pydantic import BaseModel, Field

# Root directory of workspace
WORKSPACE_DIR = Path(__file__).resolve().parent.parent.parent.parent
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent

# Load local .env if present
for possible_env in [BACKEND_DIR / ".env", WORKSPACE_DIR / ".env"]:
    if possible_env.exists():
        try:
            with open(possible_env, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))
        except Exception:
            pass

def _default_workspace_dir() -> str:
    env_dir = os.getenv("WORKSPACE_DIR")
    if env_dir:
        return env_dir
    if os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME"):
        return "/tmp/workspace"
    return str(WORKSPACE_DIR)

def _default_db_path() -> str:
    env_db = os.getenv("DB_PATH")
    if env_db:
        return env_db
    if os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME"):
        return "/tmp/polyman.db"
    return str(BACKEND_DIR / "polyman.db")

class Settings(BaseModel):
    app_name: str = "Polyman"
    app_version: str = "1.0.0"
    debug: bool = True
    
    # Workspace & Storage (override via env for production deployments)
    workspace_dir: str = Field(default_factory=_default_workspace_dir)
    db_path: str = Field(default_factory=_default_db_path)
    
    # Supabase Configuration
    supabase_url: str = Field(default_factory=lambda: os.getenv("SUPABASE_URL", ""))
    supabase_key: str = Field(default_factory=lambda: os.getenv("SUPABASE_SERVICE_ROLE_KEY", os.getenv("SUPABASE_KEY", "")))

    @property
    def clean_supabase_url(self) -> str:
        url = (self.supabase_url or "").strip()
        if not url:
            return ""
        if "/rest/v1" in url:
            url = url.split("/rest/v1")[0]
        return url.rstrip("/")

    # LLM Settings (Stored in memory / config or overridden via DB/UI)
    openai_api_key: str = Field(default_factory=lambda: os.getenv("OPENAI_API_KEY", ""))
    anthropic_api_key: str = Field(default_factory=lambda: os.getenv("ANTHROPIC_API_KEY", ""))
    gemini_api_key: str = Field(default_factory=lambda: os.getenv("GEMINI_API_KEY", ""))
    ollama_base_url: str = Field(default_factory=lambda: os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"))

    # Default model choices per agent (all configured to Gemini)
    agent_models: dict = {
        "orchestrator": {"provider": "gemini", "model": "gemini-2.5-flash"},
        "architect": {"provider": "gemini", "model": "gemini-2.5-flash"},
        "sde": {"provider": "gemini", "model": "gemini-2.5-flash"},
        "lawyer": {"provider": "gemini", "model": "gemini-2.5-flash"},
        "auditor": {"provider": "gemini", "model": "gemini-2.5-flash"},
        "accountant": {"provider": "gemini", "model": "gemini-2.5-flash"}
    }

settings = Settings()
