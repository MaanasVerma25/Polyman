import pytest
from app import app as flask_app, users, bcrypt
from config import Config
from auth import generate_token

@pytest.fixture
def app():
    flask_app.config.update({
        "TESTING": True,
        "SECRET_KEY": "test_secret_key",
        "JWT_SECRET_KEY": "test_jwt_secret_key",
        "JWT_ACCESS_TOKEN_EXPIRES_SECONDS": 1 # Short expiry for tests
    })
    # Clear users for each test run
    users.clear()
    yield flask_app

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def register_test_user(client):
    def _register_user(username, password):
        return client.post('/register', json={'username': username, 'password': password})
    return _register_user

@pytest.fixture
def login_test_user(client, register_test_user):
    def _login_user(username, password):
        register_test_user(username, password)
        response = client.post('/login', json={'username': username, 'password': password})
        return response.json['token']
    return _login_user

@pytest.fixture
def auth_headers(login_test_user):
    token = login_test_user('testuser', 'password123')
    return {'Authorization': f'Bearer {token}'}
