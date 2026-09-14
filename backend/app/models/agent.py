from pydantic import BaseModel, Field
from typing import List, Optional

class AgentBase(BaseModel):
    role: str
    name: str
    avatar: str
    color: str
    description: str
    system_prompt: str
    default_provider: str = "gemini"
    default_model: str = "gemini-2.0-flash"
    tools: List[str] = Field(default_factory=list)
    is_builtin: bool = False

class AgentCreate(AgentBase):
    pass

class AgentUpdate(BaseModel):
    name: Optional[str] = None
    avatar: Optional[str] = None
    color: Optional[str] = None
    description: Optional[str] = None
    system_prompt: Optional[str] = None
    default_provider: Optional[str] = None
    default_model: Optional[str] = None
    tools: Optional[List[str]] = None

class AgentResponse(AgentBase):
    id: str
