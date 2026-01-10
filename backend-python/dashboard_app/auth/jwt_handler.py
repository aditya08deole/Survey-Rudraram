"""
JWT Authentication Handler

Manages JSON Web Token generation, verification, and user authentication.
Implements secure password hashing with bcrypt.
"""

from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
import os

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRATION_MINUTES", "30"))


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against a hashed password.
    
    Args:
        plain_password: Password to verify
        hashed_password: Hashed password from database
    
    Returns:
        bool: True if password matches, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Hash a password using bcrypt.
    
    Args:
        password: Plain text password
    
    Returns:
        str: Hashed password
    """
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token.
    
    Args:
        data: Dictionary of claims to include in token
        expires_delta: Optional custom expiration time
    
    Returns:
        str: Encoded JWT token
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    return encoded_jwt


def verify_token(token: str) -> Optional[dict]:
    """
    Verify and decode a JWT token.
    
    Args:
        token: JWT token to verify
    
    Returns:
        dict: Decoded token payload, or None if invalid
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


def decode_token(token: str) -> dict:
    """
    Decode a JWT token without verification (for debugging).
    
    Args:
        token: JWT token to decode
    
    Returns:
        dict: Decoded token payload
    """
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM], options={"verify_signature": False})
    except JWTError as e:
        raise ValueError(f"Invalid token: {e}")


def get_token_expiry(token: str) -> Optional[datetime]:
    """
    Get the expiration time from a token.
    
    Args:
        token: JWT token
    
    Returns:
        datetime: Expiration timestamp, or None if invalid
    """
    payload = verify_token(token)
    if payload and "exp" in payload:
        return datetime.fromtimestamp(payload["exp"])
    return None


def is_token_expired(token: str) -> bool:
    """
    Check if a token is expired.
    
    Args:
        token: JWT token to check
    
    Returns:
        bool: True if expired, False otherwise
    """
    expiry = get_token_expiry(token)
    if expiry:
        return datetime.utcnow() > expiry
    return True


# Example user authentication function
def authenticate_user(username: str, password: str, user_db: dict) -> Optional[dict]:
    """
    Authenticate a user with username and password.
    
    Args:
        username: Username to authenticate
        password: Plain text password
        user_db: Dictionary of users (in production, use database)
    
    Returns:
        dict: User data if authenticated, None otherwise
    """
    user = user_db.get(username)
    if not user:
        return None
    if not verify_password(password, user["hashed_password"]):
        return None
    return user


# Helper function to create user token
def create_user_token(user_id: str, username: str, email: str, role: str = "user") -> str:
    """
    Create a JWT token for a user.
    
    Args:
        user_id: Unique user ID
        username: Username
        email: User email
        role: User role (default: "user")
    
    Returns:
        str: JWT access token
    """
    token_data = {
        "sub": user_id,
        "username": username,
        "email": email,
        "role": role
    }
    return create_access_token(token_data)
