from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class DAGNodeResponse(BaseModel):
    id: str
    run_id: str
    agent_role: str
    title: str
    description: Optional[str] = ""
    status: str # pending, running, completed, failed, skipped
    dependencies: List[str] = Field(default_factory=list)
    input_data: Optional[Dict[str, Any]] = None
    output_data: Optional[Dict[str, Any]] = None
    started_at: Optional[str] = None
    completed_at: Optional[str] = None

class AgentLogResponse(BaseModel):
    id: int
    run_id: str
    node_id: Optional[str] = None
    agent_role: str
    event_type: str
    content: str
    created_at: str

class RunCreate(BaseModel):
    task_prompt: str
    project_path: Optional[str] = None
    selected_agents: Optional[List[str]] = None

class RunResponse(BaseModel):
    id: str
    project_id: Optional[str] = None
    task_prompt: str
    status: str
    summary: Optional[str] = None
    created_at: str
    updated_at: str
    nodes: List[DAGNodeResponse] = Field(default_factory=list)
