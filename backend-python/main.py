"""
Rudraram Survey - Production-Grade FastAPI Backend Entry Point
Stabilized for Render Deployment
"""

import os
import logging
import json
from pathlib import Path
from typing import Dict, Any
from datetime import datetime
from supabase import create_client
from dashboard_app.core.config import get_settings

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from dotenv import load_dotenv
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Import routers from standardized package
from dashboard_app.api.v1.auth import router as auth_router
from dashboard_app.api.v1.survey import router as survey_router
from dashboard_app.api.v1.database import router as db_router
from dashboard_app.api.v1.device_images import router as device_images_router

# Environment & Constants
ENV = os.getenv("ENV", "production")
DEBUG = os.getenv("DEBUG_MODE", "false").lower() == "true"
PORT = int(os.getenv("PORT", 5000))
HOST = os.getenv("HOST", "0.0.0.0")

# Load environment-specific configuration
env_file = ".env.development" if ENV != "production" else ".env.production"
load_dotenv(env_file)

# Configuration for Logging
logging.basicConfig(
    level=logging.INFO if not DEBUG else logging.DEBUG,
    format='{"timestamp":"%(asctime)s", "level":"%(levelname)s", "name":"%(name)s", "message":"%(message)s"}'
)
logger = logging.getLogger("rudraram.main")

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

# Initialize FastAPI app
app = FastAPI(
    title="Rudraram Survey API",
    description="Production Water Infrastructure Mapping API",
    version="3.1.0",
    docs_url="/api/docs" if DEBUG else None,
    redoc_url="/api/redoc" if DEBUG else None
)

# Rate Limit Error Handler
app.state.limiter = limiter
@app.exception_handler(RateLimitExceeded)
async def custom_rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return _rate_limit_exceeded_handler(request, exc)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global server error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "error": str(exc) if DEBUG else "An unexpected error occurred."}
    )

# CORS Configuration - Security Critical!
# NEVER use wildcard ["*"] in production
allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "")
if allowed_origins_str:
    allowed_origins = [origin.strip() for origin in allowed_origins_str.split(",") if origin.strip()]
else:
    # Default origins for development - MUST be overridden in production
    if ENV == "production":
        logger.error("❌ CRITICAL: ALLOWED_ORIGINS not set in production! CORS will block all requests.")
        logger.error("Set ALLOWED_ORIGINS environment variable with comma-separated domains.")
        allowed_origins = []  # Block all in production if not configured
    else:
        logger.warning("⚠️  Using default development CORS origins. Set ALLOWED_ORIGINS for production!")
        allowed_origins = [
            "http://localhost:3000",
            "http://localhost:5173",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:5173"
        ]

logger.info(f"CORS allowed origins: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
)

# Include router paths
app.include_router(auth_router, prefix="/api")
app.include_router(survey_router, prefix="/api")
app.include_router(db_router) # Already has /api/db
app.include_router(device_images_router, prefix="/api")
from dashboard_app.api.v1.zones import router as zones_router
app.include_router(zones_router, prefix="/api")

# Directories
BASE_DIR = Path(__file__).parent
FRONTEND_BUILD_DIR = BASE_DIR.parent / "frontend" / "build"

@app.get("/", tags=["Health"])
async def health_check():
    """
    Root endpoint for health checks
    """
    try:
        # Check Supabase database connectivity with simple query
        settings = get_settings()
        supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        
        # Simple query to verify database connectivity - just check if users table exists
        response = supabase.table('users').select('id').limit(1).execute()
        
        return {
            "status": "healthy", 
            "service": "rudraram-backend",
            "version": "1.0.0",
            "timestamp": datetime.utcnow().isoformat(),
            "port": PORT
        }
    except Exception as e:
         return {
            "status": "degraded", 
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat(),
            "port": PORT
        }

# Frontend Serving Logic
# Middleware to force no-cache on root (index.html) to ensure updates are seen immediately
@app.middleware("http")
async def add_no_cache_header(request: Request, call_next):
    response = await call_next(request)
    if request.url.path == "/" or request.url.path == "/index.html":
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
    return response

if FRONTEND_BUILD_DIR.exists():
    logger.info(f"Serving frontend from {FRONTEND_BUILD_DIR}")
    app.mount("/", StaticFiles(directory=str(FRONTEND_BUILD_DIR), html=True), name="static")
    
    @app.exception_handler(404)
    async def spa_fallback_handler(request: Request, exc):
        if request.url.path.startswith("/api"):
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"detail": "API endpoint not found"}
            )
        # Prevent caching of index.html so updates are instant
        response = FileResponse(FRONTEND_BUILD_DIR / "index.html")
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
        return response
else:
    logger.warning(f"Frontend build directory not found at {FRONTEND_BUILD_DIR}. API only mode.")
    @app.get("/")
    async def root():
        return {"message": "Rudraram API is running. Build frontend to view dashboard."}

if __name__ == "__main__":
    import uvicorn
    logger.info(f"Starting server on {HOST}:{PORT}")
    uvicorn.run("main:app", host=HOST, port=PORT, reload=DEBUG)
