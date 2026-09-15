def estimate_budget(project_details):
    """
    Estimates the budget for a project based on provided details.
    A simplified estimation model for demonstration purposes.
    """
    scope = project_details.get('scope', 'small').lower()
    complexity = project_details.get('complexity', 'medium').lower()
    duration_weeks = project_details.get('duration_weeks', 4)
    resources_needed = project_details.get('resources_needed', 1)

    # Base rates and factors
    base_weekly_rate = 1500 # e.g., cost per developer per week
    resource_overhead_factor = 0.2 # Additional cost per resource

    scope_factors = {
        'small': 0.8,
        'medium': 1.0,
        'large': 1.5,
        'enterprise': 2.5
    }

    complexity_factors = {
        'low': 0.7,
        'medium': 1.0,
        'high': 1.3,
        'very_high': 1.8
    }

    # Validate inputs
    if not isinstance(duration_weeks, (int, float)) or duration_weeks <= 0:
        raise ValueError("Duration must be a positive number of weeks.")
    if not isinstance(resources_needed, int) or resources_needed <= 0:
        raise ValueError("Resources needed must be a positive integer.")

    scope_factor = scope_factors.get(scope, 1.0)
    complexity_factor = complexity_factors.get(complexity, 1.0)

    # Simple estimation formula
    # (Base rate * duration * complexity * scope) + (resources * resource overhead)
    estimated_cost = (
        base_weekly_rate * duration_weeks * complexity_factor * scope_factor
    ) + (
        resources_needed * base_weekly_rate * resource_overhead_factor
    )

    return round(estimated_cost, 2)
