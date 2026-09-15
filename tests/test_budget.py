import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.auth_service import fake_users_db # Import to clear db for tests
from app.services.budget_service import estimate_budget

client = TestClient(app)

@pytest.fixture(autouse=True)
def clear_fake_db():
    # Clear the in-memory database before each test
    fake_users_db.clear()
    yield

@pytest.fixture
def auth_token():
    # Register a user
    client.post(
        "/auth/register",
        json={
            "username": "testuser",
            "password": "testpassword"
        }
    )
    # Log in and get a token
    response = client.post(
        "/auth/token",
        data={
            "username": "testuser",
            "password": "testpassword"
        }
    )
    return response.json()["access_token"]


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "project_scope, complexity, duration_months, team_size, expected_min, expected_max",
    [
        ("small", "low", 1, 1, 5500, 5500), # 5000 * 1 * 1 * 1 * 1.1 = 5500
        ("medium", "medium", 3, 2, 44550, 44550), # 5000 * 2 * 3 * 1.5 * 1.3 * 1.1 = 44550
        ("large", "high", 6, 5, 561000, 561000), # 5000 * 5 * 6 * 2 * 1.7 * 1.1 = 561000
        ("small", "high", 2, 1, 18700, 18700), # 5000 * 1 * 2 * 1 * 1.7 * 1.1 = 18700
        ("large", "low", 4, 3, 132000, 132000) # 5000 * 3 * 4 * 2 * 1 * 1.1 = 132000
    ],
)
async def test_estimate_budget_logic(
    project_scope: str,
    complexity: str,
    duration_months: int,
    team_size: int,
    expected_min: float,
    expected_max: float
):
    from app.schemas.budget import BudgetRequest
    request = BudgetRequest(
        project_scope=project_scope,
        complexity=complexity,
        duration_months=duration_months,
        team_size=team_size
    )
    estimated_budget = await estimate_budget(request)
    assert expected_min <= estimated_budget <= expected_max

def test_estimate_budget_endpoint_success(auth_token):
    response = client.post(
        "/budget/estimate",
        headers={
            "Authorization": f"Bearer {auth_token}"
        },
        json={
            "project_scope": "medium",
            "complexity": "medium",
            "duration_months": 3,
            "team_size": 2
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "estimated_budget" in data
    assert isinstance(data["estimated_budget"], float)
    # Based on the logic: 5000 * 2 * 3 * 1.5 * 1.3 * 1.1 = 44550.0
    assert data["estimated_budget"] == 44550.0

def test_estimate_budget_endpoint_unauthorized():
    response = client.post(
        "/budget/estimate",
        json={
            "project_scope": "small",
            "complexity": "low",
            "duration_months": 1,
            "team_size": 1
        }
    )
    assert response.status_code == 401
    assert response.json() == {"detail": "Not authenticated"}

def test_estimate_budget_endpoint_invalid_input(auth_token):
    response = client.post(
        "/budget/estimate",
        headers={
            "Authorization": f"Bearer {auth_token}"
        },
        json={
            "project_scope": "invalid_scope", # Invalid enum value
            "complexity": "low",
            "duration_months": 1,
            "team_size": 1
        }
    )
    assert response.status_code == 422 # Unprocessable Entity for validation errors
    assert "detail" in response.json()
    assert any("project_scope" in error["loc"] for error in response.json()["detail"])

    response = client.post(
        "/budget/estimate",
        headers={
            "Authorization": f"Bearer {auth_token}"
        },
        json={
            "project_scope": "small",
            "complexity": "low",
            "duration_months": 0, # Must be > 0
            "team_size": 1
        }
    )
    assert response.status_code == 422
    assert any("duration_months" in error["loc"] for error in response.json()["detail"])
