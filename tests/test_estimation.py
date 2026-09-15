import pytest
from estimation import estimate_budget

# Unit tests for the estimate_budget function
def test_estimate_budget_small_low_complexity():
    details = {
        'scope': 'small',
        'complexity': 'low',
        'duration_weeks': 2,
        'resources_needed': 1
    }
    # (1500 * 2 * 0.7 * 0.8) + (1 * 1500 * 0.2) = 1680 + 300 = 1980
    assert estimate_budget(details) == 1980.00

def test_estimate_budget_medium_medium_complexity():
    details = {
        'scope': 'medium',
        'complexity': 'medium',
        'duration_weeks': 4,
        'resources_needed': 2
    }
    # (1500 * 4 * 1.0 * 1.0) + (2 * 1500 * 0.2) = 6000 + 600 = 6600
    assert estimate_budget(details) == 6600.00

def test_estimate_budget_large_high_complexity():
    details = {
        'scope': 'large',
        'complexity': 'high',
        'duration_weeks': 8,
        'resources_needed': 3
    }
    # (1500 * 8 * 1.3 * 1.5) + (3 * 1500 * 0.2) = 23400 + 900 = 24300
    assert estimate_budget(details) == 24300.00

def test_estimate_budget_enterprise_very_high_complexity_many_resources():
    details = {
        'scope': 'enterprise',
        'complexity': 'very_high',
        'duration_weeks': 12,
        'resources_needed': 5
    }
    # (1500 * 12 * 1.8 * 2.5) + (5 * 1500 * 0.2) = 81000 + 1500 = 82500
    assert estimate_budget(details) == 82500.00

def test_estimate_budget_default_values():
    details = {}
    # (1500 * 4 * 1.0 * 1.0) + (1 * 1500 * 0.2) = 6000 + 300 = 6300
    assert estimate_budget(details) == 6300.00

def test_estimate_budget_invalid_duration_zero():
    details = {'duration_weeks': 0}
    with pytest.raises(ValueError, match="Duration must be a positive number of weeks."):
        estimate_budget(details)

def test_estimate_budget_invalid_duration_negative():
    details = {'duration_weeks': -5}
    with pytest.raises(ValueError, match="Duration must be a positive number of weeks."):
        estimate_budget(details)

def test_estimate_budget_invalid_resources_zero():
    details = {'resources_needed': 0}
    with pytest.raises(ValueError, match="Resources needed must be a positive integer."):
        estimate_budget(details)

def test_estimate_budget_invalid_resources_negative():
    details = {'resources_needed': -2}
    with pytest.raises(ValueError, match="Resources needed must be a positive integer."):
        estimate_budget(details)

# Integration tests for the /estimate API endpoint
def test_api_estimate_success(client, auth_headers):
    project_details = {
        'scope': 'medium',
        'complexity': 'high',
        'duration_weeks': 6,
        'resources_needed': 2
    }
    response = client.post('/estimate', json=project_details, headers=auth_headers)
    assert response.status_code == 200
    assert 'estimated_budget' in response.json
    # (1500 * 6 * 1.3 * 1.0) + (2 * 1500 * 0.2) = 11700 + 600 = 12300
    assert response.json['estimated_budget'] == 12300.00
    assert response.json['currency'] == 'USD'

def test_api_estimate_no_auth(client):
    project_details = {
        'scope': 'medium',
        'complexity': 'high',
        'duration_weeks': 6,
        'resources_needed': 2
    }
    response = client.post('/estimate', json=project_details)
    assert response.status_code == 401
    assert response.json['message'] == 'Token is missing!'

def test_api_estimate_invalid_input(client, auth_headers):
    project_details = {
        'scope': 'medium',
        'complexity': 'high',
        'duration_weeks': -5, # Invalid duration
        'resources_needed': 2
    }
    response = client.post('/estimate', json=project_details, headers=auth_headers)
    assert response.status_code == 400
    assert response.json['message'] == 'Duration must be a positive number of weeks.'

def test_api_estimate_empty_body(client, auth_headers):
    response = client.post('/estimate', json={}, headers=auth_headers)
    assert response.status_code == 200 # Default values are used
    assert 'estimated_budget' in response.json
    assert response.json['estimated_budget'] == 6300.00 # Default calculation

def test_api_estimate_no_json_body(client, auth_headers):
    response = client.post('/estimate', headers=auth_headers)
    assert response.status_code == 400
    assert response.json['message'] == 'Project details are required.'
