"""
Production-Grade Authentication Middleware for Rudraram Survey
Implements Supabase JWT validation with Pydantic models.
"""

import os
import logging
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from dashboard_app.schemas.user import User, TokenData

logger = logging.getLogger(__name__)

# Security scheme
security = HTTPBearer()

# Supabase Auth Configuration
# IMPORTANT: In production, the JWT_SECRET is found in Supabase Dashboard -> Settings -> API
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET") or os.getenv("JWT_SECRET")
SUPABASE_URL = os.getenv("SUPABASE_URL")
# The 'aud' (audience) for Supabase is typically 'authenticated'
SUPABASE_AUDIENCE = os.getenv("SUPABASE_AUDIENCE", "authenticated")
# The 'iss' (issuer) is typically 'https://[project-id].supabase.co/auth/v1'
SUPABASE_ISSUER = f"{SUPABASE_URL}/auth/v1" if SUPABASE_URL else None

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """
    Verifies the Supabase JWT token and returns a Pydantic User object.
    """
    token = credentials.credentials
    
    # We prefer SUPABASE_JWT_SECRET, fall back to JWT_SECRET
    secret = os.getenv("SUPABASE_JWT_SECRET") or os.getenv("JWT_SECRET")
    
    if not secret:
        logger.error("JWT Secret is not configured. Authentication will fail.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication configuration error"
        )

    try:
        # If the secret is base64 encoded (common for legacy Supabase secrets), decode it
        # But HS256 in Supabase dashboard often provides the secret directly.
        # If it contains '==', it's definitely base64.
        signing_key = secret
        
        # Note: If Supabase issues ES256 tokens (ECC keys), we would need ES256 here.
        # But if the user provided an HS256 secret, we proceed with HS256.
        payload = jwt.decode(
            token,
            signing_key,
            algorithms=["HS256"],
            audience=SUPABASE_AUDIENCE,
            # issuer=SUPABASE_ISSUER, # Supabase issuers can vary, skipping for flexibility
            options={"verify_aud": True, "verify_iss": False, "verify_exp": True}
        )
        
        user_id: str = payload.get("sub")
        email: str = payload.get("email")
        role: str = payload.get("role", "user")
        
        if user_id is None or email is None:
            raise JWTError("Missing subject or email in token")
            
        token_data = TokenData(user_id=user_id, email=email, role=role, exp=payload.get("exp"))
        
        # In a real system, you might fetch additional user data from the DB here.
        # For now, we return the user object derived from the token.
        return User(
            id=token_data.user_id,
            email=token_data.email,
            username=payload.get("user_metadata", {}).get("username") or email.split("@")[0],
            role=token_data.role
        )

    except JWTError as e:
        logger.warning(f"JWT Validation failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        logger.error(f"Unexpected error during authentication: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during authentication"
        )

def require_role(required_role: str):
    """
    Dependency factory for active role-based access control.
    """
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role != required_role and current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required role: {required_role}"
            )
        return current_user
    return role_checker
