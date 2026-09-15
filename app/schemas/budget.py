from pydantic import BaseModel, Field
from typing import Literal

class BudgetRequest(BaseModel):
    project_scope: Literal["small", "medium", "large"] = Field(..., description="Overall scope of the project")
    complexity: Literal["low", "medium", "high"] = Field(..., description="Technical complexity of the project")
    duration_months: int = Field(..., gt=0, description="Expected duration of the project in months")
    team_size: int = Field(..., gt=0, description="Number of team members allocated to the project")

class BudgetResponse(BaseModel):
    estimated_budget: float = Field(..., description="The calculated estimated budget in USD")
