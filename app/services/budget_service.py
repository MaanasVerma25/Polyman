from app.schemas.budget import BudgetRequest

async def estimate_budget(request: BudgetRequest) -> float:
    """
    Estimates the project budget based on the provided request parameters.
    This is a simplified estimation model for demonstration purposes.
    """
    base_cost_per_month = 5000.0  # Base cost per team member per month

    # Adjust based on project scope
    scope_multiplier = {
        "small": 1.0,
        "medium": 1.5,
        "large": 2.0
    }[request.project_scope]

    # Adjust based on complexity
    complexity_multiplier = {
        "low": 1.0,
        "medium": 1.3,
        "high": 1.7
    }[request.complexity]

    # Calculate raw cost
    raw_cost = (base_cost_per_month * request.team_size * request.duration_months)

    # Apply multipliers
    estimated_budget = raw_cost * scope_multiplier * complexity_multiplier

    # Add a small contingency
    contingency_factor = 1.10 # 10% contingency
    estimated_budget *= contingency_factor

    return round(estimated_budget, 2)
