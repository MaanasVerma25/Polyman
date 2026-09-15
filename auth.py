import jwt
import datetime
from functools import wraps
from flask import request, jsonify, g
from flask_bcrypt import Bcrypt
from config import Config

bcrypt = Bcrypt()

# In-memory user store for demonstration purposes
# In a real application, this would be a database
users = {}

def init_auth(app):
    bcrypt.init_app(app)

def generate_token(user_id):
    try:
        payload = {
            'exp': datetime.datetime.utcnow() + datetime.timedelta(seconds=Config.JWT_ACCESS_TOKEN_EXPIRES_SECONDS),
            'iat': datetime.datetime.utcnow(),
            'sub': user_id
        }
        return jwt.encode(
            payload,
            Config.JWT_SECRET_KEY,
            algorithm='HS256'
        )
    except Exception as e:
        return str(e)

def decode_token(token):
    try:
        payload = jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=['HS256'])
        return payload['sub']
    except jwt.ExpiredSignatureError:
        return 'Signature expired. Please log in again.'
    except jwt.InvalidTokenError:
        return 'Invalid token. Please log in again.'

def jwt_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]

        if not token:
            return jsonify({'message': 'Token is missing!'}), 401

        user_id = decode_token(token)

        if isinstance(user_id, str) and ('expired' in user_id or 'Invalid' in user_id):
            return jsonify({'message': user_id}), 401

        # In a real app, you'd fetch the user from a DB here
        # For this example, we just check if the user_id exists in our in-memory store
        if user_id not in users:
            return jsonify({'message': 'User not found.'}), 401

        g.user = user_id # Make user_id available in the request context
        return f(*args, **kwargs)

    return decorated
