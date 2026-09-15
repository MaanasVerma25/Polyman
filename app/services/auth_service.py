from typing import Dict, Optional

from app.core.security import get_password_hash, verify_password
from app.models.user import UserInDB
from app.schemas.auth import UserCreate

# In-memory 'database' for demonstration purposes.
# In a real application, this would be replaced with a proper database (e.g., PostgreSQL, MongoDB).
fake_users_db: Dict[str, UserInDB] = {}

async def get_user(username: str) -> Optional[UserInDB]:
    user_data = fake_users_db.get(username)
    if user_data:
        return user_data
    return None

async def create_user(user_in: UserCreate) -> UserInDB:
    hashed_password = get_password_hash(user_in.password)
    user_db = UserInDB(username=user_in.username, hashed_password=hashed_password)
    fake_users_db[user_in.username] = user_db
    return user_db

async def authenticate_user(username: str, password: str) -> Optional[UserInDB]:
    user = await get_user(username)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user
