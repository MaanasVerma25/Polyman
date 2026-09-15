from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import get_current_user
from app.schemas.auth import TokenData
from app.schemas.budget import BudgetRequest, BudgetResponse
from app.services import budget_service

router = APIRouter(prefix="/budget", tags=["Budget Estimation"])

@router.post("/estimate", response_model=BudgetResponse, summary="Estimate project budget")
async def get_budget_estimate(
    request: BudgetRequest,
    current_user: TokenData = Depends(get_current_user) # Protect this endpoint with JWT
):
    """
    Estimates the budget for a project based on its scope, complexity, duration, and team size.
    Requires a valid JWT access token.
    """
    # For demonstration, we just use current_user to ensure authentication.
    # In a real app, you might log the user who made the request or check their permissions.
    print(f"User '{current_user.username}' requested a budget estimate.")

    estimated_budget = await budget_service.estimate_budget(request)
    return BudgetResponse(estimated_budget=estimated_budget)
