
import os
from functools import lru_cache
from pydantic import BaseModel, field_validator
import sys

class Settings(BaseModel):
    ENV: str = "production"
    DEBUG: bool = False
    PORT: int = 5000
    HOST: str = "0.0.0.0"
    
    # Auth
    JWT_SECRET: str
    SUPABASE_JWT_SECRET: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Database
    SUPABASE_URL: str
    SUPABASE_KEY: str

    @field_validator('JWT_SECRET')
    @classmethod
    def validate_jwt_secret(cls, v):
        """Ensure JWT_SECRET is properly set and not using defaults"""
        if not v or v in ['default_secret', 'your-secret-key-change-in-production', 'changeme']:
            print("\n" + "="*60)
            print("❌ CRITICAL ERROR: JWT_SECRET not properly configured!")
            print("="*60)
            print("Please set a strong JWT_SECRET in your environment variables.")
            print("Example: JWT_SECRET=$(openssl rand -hex 32)")
            print("="*60 + "\n")
            sys.exit(1)
        if len(v) < 32:
            print("⚠️  WARNING: JWT_SECRET should be at least 32 characters long")
        return v

    @field_validator('SUPABASE_URL', 'SUPABASE_KEY')
    @classmethod
    def validate_supabase(cls, v, info):
        """Ensure Supabase credentials are set"""
        if not v:
            print(f"⚠️  WARNING: {info.field_name} not set. Database features will not work.")
        return v

@lru_cache()
def get_settings():
    return Settings(
        ENV=os.getenv("ENV", "production"),
        DEBUG=os.getenv("DEBUG_MODE", "false").lower() == "true",
        PORT=int(os.getenv("PORT", 5000)),
        HOST=os.getenv("HOST", "0.0.0.0"),
        JWT_SECRET=os.getenv("JWT_SECRET", ""),  # No default - will fail validation
        SUPABASE_JWT_SECRET=os.getenv("SUPABASE_JWT_SECRET", ""),
        SUPABASE_URL=os.getenv("SUPABASE_URL", ""),
        SUPABASE_KEY=os.getenv("SUPABASE_KEY", ""),
    )
