from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, EmailStr
from typing import Optional, List
import os
import logging
from slowapi import Limiter
from slowapi.util import get_remote_address

from dashboard_app.auth.jwt_handler import (
    create_user_token,
    verify_password,
    get_password_hash
)
from dashboard_app.auth.permissions import get_current_user, require_role
from dashboard_app.schemas.user import User, TokenResponse, LoginRequest, SignupRequest

logger = logging.getLogger(__name__)
limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/auth", tags=["Authentication"])

# ⚠️ CRITICAL SECURITY WARNING ⚠️
# This in-memory user store is TEMPORARY and INSECURE!
# TODO: Replace with Supabase Auth or proper database-backed authentication
# Current implementation:
#   - No password recovery
#   - No email verification  
#   - Data lost on restart
#   - Not suitable for production
# 
# Migration path:
#   Option 1: Use Supabase Auth (recommended)
#   Option 2: Create 'users' table with proper RLS policies
#
# For production deployment, you MUST implement proper auth!

users_db = {
    # Default admin - CHANGE PASSWORD IMMEDIATELY!
    # Password: admin123 (INSECURE - FOR DEVELOPMENT ONLY)
    "admin@example.com": {
        "id": "1",
        "username": "admin",
        "email": "admin@example.com",
        "hashed_password": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5aeB6xYJ9T.8K",
        "role": "admin"
    }
}

# Log security warning on module load
logger.warning("="*60)
logger.warning("⚠️  USING INSECURE IN-MEMORY AUTH - NOT FOR PRODUCTION!")
logger.warning("⚠️  Default admin password: admin123")
logger.warning("⚠️  Implement proper authentication before deploying!")
logger.warning("="*60)

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

@router.get("/me", response_model=User)
@limiter.limit("30/minute")
async def get_current_user_info(request: Request, current_user: User = Depends(get_current_user)):
    """
    Get current authenticated user information
    """
    return current_user

class InviteRequest(BaseModel):
    email: EmailStr
    username: str
    password: str
    role: str = "viewer"

@router.get("/users", response_model=List[User])
@limiter.limit("10/minute")
async def list_users(request: Request, admin: User = Depends(require_role(["admin"]))):
    """
    List all users in the project (Admin only)
    """
    return [
        User(
            id=u["id"], 
            username=u["username"], 
            email=u["email"], 
            role=u["role"]
        ) for u in users_db.values()
    ]

@router.post("/invite", response_model=User)
@limiter.limit("10/minute")
async def invite_user(request: Request, invite: InviteRequest, admin: User = Depends(require_role(["admin"]))):
    """
    Directly create a new user (Admin only).
    In a full system, this would send an email. For now, it registers them directly.
    """
    if invite.email in users_db:
        raise HTTPException(status_code=400, detail="User already exists")
    
    user_id = str(len(users_db) + 1)
    users_db[invite.email] = {
        "id": user_id,
        "username": invite.username,
        "email": invite.email,
        "hashed_password": get_password_hash(invite.password),
        "role": invite.role
    }
    
    return User(
        id=user_id,
        username=invite.username,
        email=invite.email,
        role=invite.role
    )

@router.post("/logout")
async def logout():
    """
    Logout endpoint (client-side token removal)
    """
    return {"message": "Successfully logged out"}
