from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, EmailStr
from typing import Optional
import os
import logging
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.auth.jwt_handler import (
    create_user_token,
    verify_password,
    get_password_hash
)
from app.auth.permissions import get_current_user

logger = logging.getLogger(__name__)
limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Request/Response models
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    username: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

# Temporary in-memory user store
# In production, this will be in Supabase database
users_db = {
    "admin@example.com": {
        "id": "1",
        "username": "admin",
        "email": "admin@example.com",
        # Password: "admin123"
        "hashed_password": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5aeB6xYJ9T.8K",
        "role": "admin"
    }
}

@router.post("/login", response_model=TokenResponse)
@limiter.limit(f"{os.getenv('RATE_LIMIT_PER_MINUTE', '10')}/minute")
async def login(request: Request, credentials: LoginRequest):
    """
    Authenticate user and return JWT token
    """
    user = users_db.get(credentials.email)
    
    if not user or not verify_password(credentials.password, user["hashed_password"]):
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password"
        )
    
    # Create access token
    token = create_user_token(
        user_id=user["id"],
        username=user["username"],
        email=user["email"],
        role=user["role"]
    )
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "role": user["role"]
        }
    }

@router.post("/signup", response_model=TokenResponse)
@limiter.limit("5/hour")
async def signup(request: Request, user_data: SignupRequest):
    """
    Register new user
    """
    if user_data.email in users_db:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    user_id = str(len(users_db) + 1)
    users_db[user_data.email] = {
        "id": user_id,
        "username": user_data.username,
        "email": user_data.email,
        "hashed_password": get_password_hash(user_data.password),
        "role": "user"
    }
    
    # Create access token
    token = create_user_token(
        user_id=user_id,
        username=user_data.username,
        email=user_data.email,
        role="user"
    )
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "username": user_data.username,
            "email": user_data.email,
            "role": "user"
        }
    }

@router.get("/me")
@limiter.limit("30/minute")
async def get_current_user_info(request: Request, current_user: dict = Depends(get_current_user)):
    """
    Get current authenticated user information
    """
    return current_user

@router.post("/logout")
async def logout():
    """
    Logout endpoint (client-side token removal)
    """
    return {"message": "Successfully logged out"}
