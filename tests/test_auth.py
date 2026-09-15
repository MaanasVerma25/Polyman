import pytest
from auth import users, bcrypt

def test_register_success(client):
    response = client.post('/register', json={'username': 'testuser', 'password': 'password123'})
    assert response.status_code == 201
    assert response.json['message'] == 'User registered successfully.'
    assert 'testuser' in users
    assert bcrypt.check_password_hash(users['testuser']['password_hash'], 'password123')

def test_register_missing_fields(client):
    response = client.post('/register', json={'username': 'testuser'})
    assert response.status_code == 400
    assert response.json['message'] == 'Username and password are required!'

def test_register_user_exists(client, register_test_user):
    register_test_user('existinguser', 'password123')
    response = client.post('/register', json={'username': 'existinguser', 'password': 'newpassword'})
    assert response.status_code == 409
    assert response.json['message'] == 'User already exists.'

def test_login_success(client, register_test_user):
    register_test_user('testuser', 'password123')
    response = client.post('/login', json={'username': 'testuser', 'password': 'password123'})
    assert response.status_code == 200
    assert 'token' in response.json
    assert response.json['message'] == 'Logged in successfully.'

def test_login_invalid_credentials(client, register_test_user):
    register_test_user('testuser', 'password123')
    response = client.post('/login', json={'username': 'testuser', 'password': 'wrongpassword'})
    assert response.status_code == 401
    assert response.json['message'] == 'Invalid credentials.'

def test_login_user_not_found(client):
    response = client.post('/login', json={'username': 'nonexistent', 'password': 'password123'})
    assert response.status_code == 401
    assert response.json['message'] == 'Invalid credentials.'

def test_login_missing_fields(client):
    response = client.post('/login', json={'username': 'testuser'})
    assert response.status_code == 400
    assert response.json['message'] == 'Username and password are required!'

def test_protected_route_no_token(client):
    response = client.get('/protected')
    assert response.status_code == 401
    assert response.json['message'] == 'Token is missing!'

def test_protected_route_invalid_token(client):
    response = client.get('/protected', headers={'Authorization': 'Bearer invalid_token'})
    assert response.status_code == 401
    assert 'Invalid token' in response.json['message']

def test_protected_route_expired_token(client, login_test_user):
    # The JWT_ACCESS_TOKEN_EXPIRES_SECONDS is set to 1 in conftest for testing
    token = login_test_user('expiringuser', 'password123')
    import time
    time.sleep(1.1) # Wait for token to expire
    response = client.get('/protected', headers={'Authorization': f'Bearer {token}'})
    assert response.status_code == 401
    assert 'Signature expired' in response.json['message']

def test_protected_route_success(client, auth_headers):
    response = client.get('/protected', headers=auth_headers)
    assert response.status_code == 200
    assert 'Hello, testuser!' in response.json['message']
