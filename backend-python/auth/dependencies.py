"""
Authentication Middleware and Dependencies

Provides FastAPI dependencies for protecting routes with JWT authentication.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from .jwt_handler import verify_token

# Security scheme for bearer token
security = HTTPBearer()


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    Extract and verify user from JWT token.
    
    Args:
        credentials: HTTP Authorization header with bearer token
    
    Returns:
        dict: User data from token
    
    Raises:
        HTTPException: If token is invalid or expired
    """
    token = credentials.credentials
    payload = verify_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return payload


def get_current_active_user(current_user: dict = Depends(get_current_user)) -> dict:
    """
    Get current active user (can add additional checks here).
    
    Args:
        current_user: User data from get_current_user
    
    Returns:
        dict: Active user data
    """
    # Add additional checks here (e.g., user is active, not banned, etc.)
    return current_user


def require_role(required_role: str):
    """
    Dependency factory for role-based access control.
    
    Args:
        required_role: Role required to access the endpoint
    
    Returns:
        Callable: Dependency function
    """
    def role_checker(current_user: dict = Depends(get_current_user)) -> dict:
        user_role = current_user.get("role", "user")
        if user_role != required_role and user_role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required role: {required_role}"
            )
        return current_user
    return role_checker


# Common role dependencies
require_admin = require_role("admin")
require_manager = require_role("manager")
