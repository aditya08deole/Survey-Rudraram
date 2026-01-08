"""
Rudraram Survey - FastAPI Backend
Excel-driven water infrastructure dashboard API
Serves both API endpoints and React frontend
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import pandas as pd
import requests
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import logging
from io import BytesIO
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Rudraram Survey API",
    description="Water Infrastructure Mapping Dashboard API",
    version="2.0.0"
)

# Get frontend build directory
FRONTEND_BUILD_DIR = Path(__file__).parent.parent / "frontend" / "build"

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
GITHUB_RAW_EXCEL_URL = "https://raw.githubusercontent.com/aditya08deole/Survey-Rudraram/main/backend/data/rudraram_survey.xlsx"
CACHE_DURATION_SECONDS = 60  # 60 seconds cache
SHEET_NAME = "All"

# In-memory cache
cache: Dict[str, Any] = {
    "data": None,
    "timestamp": None,
    "fetch_count": 0
}


def is_cache_valid() -> bool:
    """Check if cached data is still valid"""
    if cache["data"] is None or cache["timestamp"] is None:
        return False
    
    elapsed = datetime.now() - cache["timestamp"]
    return elapsed < timedelta(seconds=CACHE_DURATION_SECONDS)


def fetch_excel_from_github() -> pd.DataFrame:
    """
    Fetch Excel file from GitHub raw URL and parse with pandas
    
    Returns:
        DataFrame with survey data
    
    Raises:
        HTTPException: If fetch or parse fails
    """
    try:
        logger.info(f"Fetching Excel from GitHub: {GITHUB_RAW_EXCEL_URL}")
        
        # Fetch Excel file
        response = requests.get(GITHUB_RAW_EXCEL_URL, timeout=10)
        response.raise_for_status()
        
        # Parse Excel using pandas
        excel_data = BytesIO(response.content)
        df = pd.read_excel(excel_data, sheet_name=SHEET_NAME, engine='openpyxl')
        
        logger.info(f"Successfully fetched and parsed Excel. Rows: {len(df)}")
        cache["fetch_count"] += 1
        
        return df
        
    except requests.RequestException as e:
        logger.error(f"Failed to fetch Excel from GitHub: {e}")
        raise HTTPException(
            status_code=503,
            detail=f"Unable to fetch data from GitHub: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Failed to parse Excel: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse Excel data: {str(e)}"
        )


def normalize_survey_data(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    Convert DataFrame to normalized JSON format matching frontend expectations
    
    Args:
        df: Raw DataFrame from Excel
        
    Returns:
        List of device dictionaries with normalized keys
    """
    # Column mapping: Excel -> Frontend
    column_mapping = {
        'Survey Code': 'surveyCode',
        'Zone': 'zone',
        'Street Name': 'streetName',
        'Device Type': 'deviceType',
        'Status': 'status',
        'Houses Connected': 'housesConnected',
        'Daily Usage (hrs)': 'dailyUsage',
        'Pipe Size (inch)': 'pipeSize',
        'Motor HP': 'motorCapacity',
        'Notes': 'notes',
        'Lat': 'lat',
        'Long': 'long',
        'Images': 'images'
    }
    
    # Rename columns
    df_normalized = df.rename(columns=column_mapping)
    
    # Replace NaN with None (becomes null in JSON)
    df_normalized = df_normalized.where(pd.notna(df_normalized), None)
    
    # Convert numeric columns
    numeric_columns = ['housesConnected', 'dailyUsage', 'pipeSize', 'lat', 'long']
    for col in numeric_columns:
        if col in df_normalized.columns:
            df_normalized[col] = pd.to_numeric(df_normalized[col], errors='coerce')
    
    # Convert to list of dictionaries
    devices = df_normalized.to_dict('records')
    
    # Filter out devices without coordinates (if needed for map view)
    devices_with_coords = [d for d in devices if d.get('lat') and d.get('long')]
    
    logger.info(f"Normalized {len(devices)} devices, {len(devices_with_coords)} with coordinates")
    
    return devices


def get_survey_data() -> List[Dict[str, Any]]:
    """
    Get survey data with caching
    
    Returns:
        List of device dictionaries
    """
    # Check cache first
    if is_cache_valid():
        logger.info(f"Serving from cache (age: {(datetime.now() - cache['timestamp']).seconds}s)")
        return cache["data"]
    
    # Cache miss or expired - fetch fresh data
    logger.info("Cache miss or expired - fetching fresh data")
    df = fetch_excel_from_github()
    devices = normalize_survey_data(df)
    
    # Update cache
    cache["data"] = devices
    cache["timestamp"] = datetime.now()
    
    return devices


# API Endpoints

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "Rudraram Survey API",
        "status": "operational",
        "version": "2.0.0",
        "framework": "FastAPI",
        "cache_status": "valid" if is_cache_valid() else "expired",
        "total_fetches": cache["fetch_count"]
    }


@app.get("/api/survey-data")
async def get_all_survey_data():
    """
    Get all survey data from Excel
    
    Returns:
        JSON array of all devices
    """
    try:
        devices = get_survey_data()
        return JSONResponse(
            content=devices,
            headers={
                "Cache-Control": f"public, max-age={CACHE_DURATION_SECONDS}",
                "X-Total-Devices": str(len(devices)),
                "X-Cache-Status": "hit" if is_cache_valid() else "miss"
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in /api/survey-data: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/survey-data/stats")
async def get_survey_stats():
    """
    Get statistical summary of survey data
    
    Returns:
        Statistics about devices, zones, types, and status
    """
    try:
        devices = get_survey_data()
        
        # Calculate statistics
        total_devices = len(devices)
        devices_with_coords = sum(1 for d in devices if d.get('lat') and d.get('long'))
        
        # Group by zone
        zones = {}
        for device in devices:
            zone = device.get('zone', 'Unknown')
            zones[zone] = zones.get(zone, 0) + 1
        
        # Group by device type
        device_types = {}
        for device in devices:
            device_type = device.get('deviceType', 'Unknown')
            device_types[device_type] = device_types.get(device_type, 0) + 1
        
        # Group by status
        statuses = {}
        for device in devices:
            status = device.get('status', 'Unknown')
            statuses[status] = statuses.get(status, 0) + 1
        
        return {
            "total_devices": total_devices,
            "devices_with_coordinates": devices_with_coords,
            "by_zone": zones,
            "by_type": device_types,
            "by_status": statuses,
            "cache_info": {
                "is_valid": is_cache_valid(),
                "last_fetch": cache["timestamp"].isoformat() if cache["timestamp"] else None,
                "total_fetches": cache["fetch_count"]
            }
        }
    except Exception as e:
        logger.error(f"Error generating stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/survey-data/{survey_code}")
async def get_device_by_code(survey_code: str):
    """
    Get specific device by survey code
    
    Args:
        survey_code: Device survey code (e.g., "RUD001")
        
    Returns:
        Device details
    """
    try:
        devices = get_survey_data()
        device = next((d for d in devices if d.get('surveyCode') == survey_code), None)
        
        if not device:
            raise HTTPException(status_code=404, detail=f"Device {survey_code} not found")
        
        return device
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching device {survey_code}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/cache/refresh")
async def refresh_cache():
    """
    Manually refresh cache (force re-fetch from GitHub)
    
    Returns:
        Success message with new data count
    """
    try:
        logger.info("Manual cache refresh triggered")
        cache["data"] = None
        cache["timestamp"] = None
        
        devices = get_survey_data()
        
        return {
            "status": "success",
            "message": "Cache refreshed successfully",
            "devices_loaded": len(devices),
            "timestamp": cache["timestamp"].isoformat()
        }
    except Exception as e:
        logger.error(f"Error refreshing cache: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health_check():
    """
    Detailed health check endpoint for monitoring
    
    Returns:
        Health status and system information
    """
    try:
        # Test GitHub connectivity
        response = requests.head(GITHUB_RAW_EXCEL_URL, timeout=5)
        github_accessible = response.status_code == 200
    except:
        github_accessible = False
    
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "checks": {
            "cache_valid": is_cache_valid(),
            "github_accessible": github_accessible,
            "data_loaded": cache["data"] is not None
        },
        "metrics": {
            "total_fetches": cache["fetch_count"],
            "cached_devices": len(cache["data"]) if cache["data"] else 0,
            "last_fetch": cache["timestamp"].isoformat() if cache["timestamp"] else None
        }
    }


# Mount frontend static files (after API routes)
# This must be after all API routes so they take precedence
if FRONTEND_BUILD_DIR.exists():
    logger.info(f"Serving React frontend from: {FRONTEND_BUILD_DIR}")
    
    # Serve static files (JS, CSS, images, etc.)
    app.mount("/static", StaticFiles(directory=FRONTEND_BUILD_DIR / "static"), name="static")
    
    # Serve index.html for all other routes (React Router)
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        """Serve React frontend for all non-API routes"""
        # If path doesn't start with /api, serve the frontend
        if not full_path.startswith("api"):
            index_file = FRONTEND_BUILD_DIR / "index.html"
            if index_file.exists():
                with open(index_file, 'r', encoding='utf-8') as f:
                    return HTMLResponse(content=f.read())
        
        raise HTTPException(status_code=404, detail="Not found")
else:
    logger.warning(f"Frontend build directory not found at: {FRONTEND_BUILD_DIR}")
    logger.warning("Run 'cd frontend && npm run build' to build the frontend")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
