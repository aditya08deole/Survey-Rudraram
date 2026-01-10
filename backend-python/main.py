"""
Rudraram Survey - FastAPI Backend Entry Point
Refactored to use modular routers and services
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
import os
import logging
from dotenv import load_dotenv
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Import routers
from dashboard_app.api.v1.auth import router as auth_router
from dashboard_app.api.v1.survey import router as survey_router
from dashboard_app.api.v1.database import router as db_router

# Load environment
env_file = ".env.development" if os.getenv("ENV") != "production" else ".env.production"
load_dotenv(env_file)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

# Initialize FastAPI app
app = FastAPI(
    title="Rudraram Survey API",
    description="Water Infrastructure Mapping Dashboard API",
    version="3.0.0"
)

# Add rate limit exceeded handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS configuration
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/api")
app.include_router(survey_router, prefix="/api")
app.include_router(db_router) # db_router already has /api/db prefix

# Frontend configuration
FRONTEND_BUILD_DIR = Path(__file__).parent.parent / "frontend" / "build"

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "3.0.0"}

# Serve Frontend
if FRONTEND_BUILD_DIR.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_BUILD_DIR), html=True), name="static")
    
    @app.exception_handler(404)
    async def not_found_handler(request: Request, exc):
        # Fallback to index.html for React SPA routing
        return FileResponse(FRONTEND_BUILD_DIR / "index.html")
else:
    logger.warning(f"Frontend build directory not found at {FRONTEND_BUILD_DIR}")
    @app.get("/")
    async def root():
        return {"message": "API is running. Frontend build not found."}
