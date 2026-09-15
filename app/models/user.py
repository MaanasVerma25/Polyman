from pydantic import BaseModel

# This model represents the structure of a user in our 'database'
# For a real application, this would typically interact with a database ORM (e.g., SQLAlchemy, Tortoise ORM)
class UserInDB(BaseModel):
    username: str
    hashed_password: str
