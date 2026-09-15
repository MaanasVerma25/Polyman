from flask import Flask, request, jsonify
from config import Config
from auth import init_auth, users, bcrypt, generate_token, jwt_required
from estimation import estimate_budget

app = Flask(__name__)
app.config.from_object(Config)

init_auth(app)

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'message': 'Username and password are required!'}), 400

    if username in users:
        return jsonify({'message': 'User already exists.'}), 409

    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    users[username] = {'password_hash': hashed_password, 'id': username}

    return jsonify({'message': 'User registered successfully.'}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'message': 'Username and password are required!'}), 400

    user_data = users.get(username)
    if not user_data or not bcrypt.check_password_hash(user_data['password_hash'], password):
        return jsonify({'message': 'Invalid credentials.'}), 401

    token = generate_token(user_data['id'])
    return jsonify({'message': 'Logged in successfully.', 'token': token}), 200

@app.route('/estimate', methods=['POST'])
@jwt_required
def estimate_project_budget():
    data = request.get_json()
    if not data:
        return jsonify({'message': 'Project details are required.'}), 400

    try:
        estimated_cost = estimate_budget(data)
        return jsonify({'estimated_budget': estimated_cost, 'currency': 'USD'}), 200
    except ValueError as e:
        return jsonify({'message': str(e)}), 400
    except Exception as e:
        return jsonify({'message': 'An error occurred during estimation.', 'error': str(e)}), 500

@app.route('/protected', methods=['GET'])
@jwt_required
def protected_route():
    return jsonify({'message': f'Hello, {request.g.user}! You accessed a protected route.'}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)
