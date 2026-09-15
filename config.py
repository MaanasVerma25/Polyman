import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'a_very_secret_key_for_flask')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'a_very_secret_key_for_jwt')
    JWT_ACCESS_TOKEN_EXPIRES_SECONDS = int(os.environ.get('JWT_ACCESS_TOKEN_EXPIRES_SECONDS', 900)) # 15 minutes
    BCRYPT_LOG_ROUNDS = int(os.environ.get('BCRYPT_LOG_ROUNDS', 12))
