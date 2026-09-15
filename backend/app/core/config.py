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

def _default_gemini_keys() -> list:
    keys = []
    raw = os.getenv("GEMINI_API_KEYS", "")
    if raw:
        for k in raw.split(","):
            k = k.strip()
            if k and k not in keys:
                keys.append(k)
    single = os.getenv("GEMINI_API_KEY", "").strip()
    if single and single not in keys:
        keys.insert(0, single)
    return keys

def _default_gemini_agent_keys() -> dict:
    mapping = {}
    known_roles = ["orchestrator", "architect", "sde", "lawyer", "auditor", "accountant"]
    for role in known_roles:
        val = os.getenv(f"GEMINI_API_KEY_{role.upper()}", "").strip()
        if val:
            mapping[role] = val
    all_keys = _default_gemini_keys()
    if all_keys:
        for idx, role in enumerate(known_roles):
            if role not in mapping:
                mapping[role] = all_keys[idx % len(all_keys)]
    return mapping

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
    gemini_api_keys: list = Field(default_factory=_default_gemini_keys)
    gemini_agent_keys: dict = Field(default_factory=_default_gemini_agent_keys)
    groq_api_key: str = Field(default_factory=lambda: os.getenv("GROQ_API_KEY", ""))
    ollama_base_url: str = Field(default_factory=lambda: os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"))

    # Multi-agent model choices: partitioned across Gemini multi-key pool and Groq for parallel throughput
    agent_models: dict = {
        "orchestrator": {"provider": "gemini", "model": "gemini-2.5-flash"},
        "architect": {"provider": "groq", "model": "groq/compound"},
        "sde": {"provider": "gemini", "model": "gemini-2.5-flash"},
        "lawyer": {"provider": "gemini", "model": "gemini-2.5-flash"},
        "auditor": {"provider": "groq", "model": "groq/compound"},
        "accountant": {"provider": "gemini", "model": "gemini-2.5-flash"}
    }

settings = Settings()
