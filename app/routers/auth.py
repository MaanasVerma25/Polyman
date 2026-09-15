from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from app.core.config import settings
from app.core.security import create_access_token
from app.schemas.auth import Token, UserCreate
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", summary="Register a new user")
async def register_user(user_in: UserCreate):
    user = await auth_service.get_user(user_in.username)
    if user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already registered")
    await auth_service.create_user(user_in)
    return {"message": "User registered successfully"}

@router.post("/token", response_model=Token, summary="Authenticate and get JWT token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await auth_service.authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}
