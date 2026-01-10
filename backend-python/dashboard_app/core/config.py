
import os
from functools import lru_cache
from pydantic import BaseModel

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

@lru_cache()
def get_settings():
    return Settings(
        ENV=os.getenv("ENV", "production"),
        DEBUG=os.getenv("DEBUG_MODE", "false").lower() == "true",
        PORT=int(os.getenv("PORT", 5000)),
        HOST=os.getenv("HOST", "0.0.0.0"),
        JWT_SECRET=os.getenv("JWT_SECRET", "default_secret"),
        SUPABASE_JWT_SECRET=os.getenv("SUPABASE_JWT_SECRET", ""),
        SUPABASE_URL=os.getenv("SUPABASE_URL", ""),
        SUPABASE_KEY=os.getenv("SUPABASE_KEY", ""),
    )
