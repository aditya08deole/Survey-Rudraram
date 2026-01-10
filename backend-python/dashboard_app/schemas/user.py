from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any

class UserBase(BaseModel):
    email: EmailStr
    username: Optional[str] = None
    role: str = "user"

class User(UserBase):
    id: str
    
    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    username: str

class TokenData(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    exp: Optional[int] = None
