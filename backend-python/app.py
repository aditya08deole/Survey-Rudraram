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
import numpy as np
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

# In-memory cache - stores data per sheet
cache: Dict[str, Any] = {
    "sheets": {},  # Dict of sheet_name -> {data, timestamp}
    "available_sheets": None,  # List of available sheet names
    "sheets_timestamp": None,  # When sheet list was fetched
    "fetch_count": 0
}


def is_cache_valid(sheet_name: str = SHEET_NAME) -> bool:
    """Check if cached data is still valid for a specific sheet"""
    if sheet_name not in cache["sheets"]:
        return False
    
    sheet_cache = cache["sheets"][sheet_name]
    if sheet_cache["data"] is None or sheet_cache["timestamp"] is None:
        return False
    
    elapsed = datetime.now() - sheet_cache["timestamp"]
    return elapsed < timedelta(seconds=CACHE_DURATION_SECONDS)


def validate_excel_data(df: pd.DataFrame) -> None:
    """
    Validate Excel data structure and content using pandas methods
    
    Args:
        df: DataFrame to validate
        
    Raises:
        HTTPException: If validation fails
    """
    required_columns = ['Survey Code', 'Zone', 'Device Type', 'Status']
    missing_columns = [col for col in required_columns if col not in df.columns]
    
    if missing_columns:
        raise HTTPException(
            status_code=500,
            detail=f"Excel missing required columns: {missing_columns}"
        )
    
    # Check for empty DataFrame
    if df.empty:
        raise HTTPException(
            status_code=500,
            detail="Excel file contains no data rows"
        )
    
    # Log data quality metrics using pandas
    total_rows = len(df)
    rows_with_coords = df[['Lat', 'Long']].notna().all(axis=1).sum()
    missing_survey_codes = df['Survey Code'].isna().sum()
    
    logger.info(f"Data validation: {total_rows} rows, {rows_with_coords} with coordinates, {missing_survey_codes} missing codes")


def fetch_excel_from_github(sheet_name: str = SHEET_NAME) -> pd.DataFrame:
    """
    Fetch Excel file from GitHub raw URL and parse specific sheet with pandas
    Includes data validation for quality assurance
    
    Args:
        sheet_name: Name of the Excel sheet to load (default: "All")
    
    Returns:
        DataFrame with validated survey data from specified sheet
    
    Raises:
        HTTPException: If fetch, parse, validation fails, or sheet not found
    """
    try:
        logger.info(f"Fetching Excel from GitHub: {GITHUB_RAW_EXCEL_URL}")
        
        # Fetch Excel file
        response = requests.get(GITHUB_RAW_EXCEL_URL, timeout=10)
        response.raise_for_status()
        
        # Parse Excel using pandas with automatic dtype inference
        excel_data = BytesIO(response.content)
        
        # Get all sheet names and cache them
        excel_file = pd.ExcelFile(excel_data, engine='openpyxl')
        available_sheets = excel_file.sheet_names
        cache["available_sheets"] = available_sheets
        cache["sheets_timestamp"] = datetime.now()
        logger.info(f"Available sheets: {available_sheets}")
        
        # Validate sheet exists
        if sheet_name not in available_sheets:
            raise HTTPException(
                status_code=404,
                detail=f"Sheet '{sheet_name}' not found. Available sheets: {available_sheets}"
            )
        
        # Read the specific sheet
        df = pd.read_excel(
            excel_file, 
            sheet_name=sheet_name,
            na_values=['', 'NA', 'N/A', 'null', 'NULL']  # Define what pandas should treat as NaN
        )
        
        # Validate data structure and content
        validate_excel_data(df)
        
        logger.info(f"Successfully fetched sheet '{sheet_name}'. Rows: {len(df)}, Columns: {len(df.columns)}")
        cache["fetch_count"] += 1
        
        return df
        
    except requests.RequestException as e:
        logger.error(f"Failed to fetch Excel from GitHub: {e}")
        raise HTTPException(
            status_code=503,
            detail=f"Unable to fetch data from GitHub: {str(e)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to parse Excel: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse Excel data: {str(e)}"
        )


def normalize_survey_data(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    Convert DataFrame to normalized JSON format matching frontend expectations
    Uses pandas vectorized operations for optimal performance
    
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
    
    # Create a copy and rename columns
    df_normalized = df.rename(columns=column_mapping).copy()
    
    # Define column types for better data handling
    numeric_columns = ['housesConnected', 'dailyUsage', 'pipeSize', 'motorCapacity', 'lat', 'long']
    string_columns = ['surveyCode', 'zone', 'streetName', 'deviceType', 'status', 'notes', 'images']
    
    # Convert numeric columns using pandas vectorized operations
    for col in numeric_columns:
        if col in df_normalized.columns:
            # Convert to numeric, coercing errors to NaN
            df_normalized[col] = pd.to_numeric(df_normalized[col], errors='coerce')
            # Replace Inf/-Inf with NaN
            df_normalized[col] = df_normalized[col].replace([np.inf, -np.inf], np.nan)
    
    # Clean string columns using pandas string methods (vectorized)
    for col in string_columns:
        if col in df_normalized.columns:
            # Strip whitespace and convert to string
            df_normalized[col] = df_normalized[col].astype(str).str.strip()
            # Replace 'nan' string with actual None
            df_normalized[col] = df_normalized[col].replace(['nan', 'None', ''], None)
    
    # Final cleanup: Replace all NaN values with None for JSON serialization
    # This uses pandas fillna which is vectorized and faster
    df_normalized = df_normalized.where(pd.notna(df_normalized), None)
    
    # Convert to list of dictionaries using pandas built-in method
    devices = df_normalized.to_dict('records')
    
    # Use pandas to count devices with coordinates (vectorized)
    has_coords = df_normalized[['lat', 'long']].notna().all(axis=1)
    devices_with_coords = has_coords.sum()
    
    logger.info(f"Normalized {len(devices)} devices, {devices_with_coords} with valid coordinates")
    
    return devices


def get_survey_data(sheet_name: str = SHEET_NAME) -> List[Dict[str, Any]]:
    """
    Get survey data with per-sheet caching
    
    Args:
        sheet_name: Name of the Excel sheet to load (default: "All")
    
    Returns:
        List of device dictionaries from specified sheet
    """
    # Initialize sheet cache if not exists
    if sheet_name not in cache["sheets"]:
        cache["sheets"][sheet_name] = {"data": None, "timestamp": None}
    
    # Check cache first
    if is_cache_valid(sheet_name):
        cache_age = (datetime.now() - cache["sheets"][sheet_name]["timestamp"]).seconds
        logger.info(f"Serving sheet '{sheet_name}' from cache (age: {cache_age}s)")
        return cache["sheets"][sheet_name]["data"]
    
    # Cache miss or expired - fetch fresh data
    logger.info(f"Cache miss for sheet '{sheet_name}' - fetching fresh data")
    df = fetch_excel_from_github(sheet_name)
    devices = normalize_survey_data(df)
    
    # Update cache for this sheet
    cache["sheets"][sheet_name]["data"] = devices
    cache["sheets"][sheet_name]["timestamp"] = datetime.now()
    
    return devices


# API Endpoints

@app.get("/")
async def root():
    """Health check endpoint"""
    cached_sheets = list(cache["sheets"].keys())
    return {
        "service": "Rudraram Survey API",
        "status": "operational",
        "version": "2.1.0",
        "framework": "FastAPI",
        "default_sheet": SHEET_NAME,
        "cached_sheets": cached_sheets,
        "available_sheets": cache.get("available_sheets"),
        "total_fetches": cache["fetch_count"]
    }


@app.get("/api/survey-data")
async def get_all_survey_data(sheet: str = SHEET_NAME):
    """
    Get all survey data from specified Excel sheet
    
    Args:
        sheet: Name of the Excel sheet to load (default: "All")
    
    Returns:
        JSON array of all devices from specified sheet
    """
    try:
        devices = get_survey_data(sheet)
        return JSONResponse(
            content=devices,
            headers={
                "Cache-Control": f"public, max-age={CACHE_DURATION_SECONDS}",
                "X-Total-Devices": str(len(devices)),
                "X-Sheet-Name": sheet,
                "X-Cache-Status": "hit" if is_cache_valid(sheet) else "miss"
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in /api/survey-data: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/sheets")
async def get_available_sheets():
    """
    Get list of all available sheets in the Excel file
    
    Returns:
        JSON object with available sheet names and default sheet
    """
    try:
        # Check if we have cached sheet list (valid for 5 minutes)
        if cache["available_sheets"] is not None and cache["sheets_timestamp"] is not None:
            age = (datetime.now() - cache["sheets_timestamp"]).seconds
            if age < 300:  # 5 minutes
                logger.info(f"Serving sheet list from cache (age: {age}s)")
                return {
                    "sheets": cache["available_sheets"],
                    "default_sheet": SHEET_NAME,
                    "total_sheets": len(cache["available_sheets"])
                }
        
        # Fetch fresh sheet list by loading any sheet (this updates the cache)
        logger.info("Fetching fresh sheet list")
        fetch_excel_from_github(SHEET_NAME)
        
        return {
            "sheets": cache["available_sheets"],
            "default_sheet": SHEET_NAME,
            "total_sheets": len(cache["available_sheets"]) if cache["available_sheets"] else 0
        }
    except Exception as e:
        logger.error(f"Error fetching sheet list: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/survey-data/stats")
async def get_survey_stats(sheet: str = SHEET_NAME):
    """
    Get statistical summary of survey data using pandas vectorized operations
    
    Args:
        sheet: Name of the Excel sheet to load (default: "All")
    
    Returns:
        Statistics about devices, zones, types, and status from specified sheet
    """
    try:
        devices = get_survey_data(sheet)
        
        # Convert to DataFrame for faster pandas operations
        df = pd.DataFrame(devices)
        
        # Total devices
        total_devices = len(df)
        
        # Count devices with valid coordinates using pandas vectorized operations
        devices_with_coords = df[['lat', 'long']].notna().all(axis=1).sum()
        
        # Use pandas value_counts for efficient grouping (vectorized)
        zones = df['zone'].value_counts().fillna(0).to_dict() if 'zone' in df.columns else {}
        device_types = df['deviceType'].value_counts().fillna(0).to_dict() if 'deviceType' in df.columns else {}
        statuses = df['status'].value_counts().fillna(0).to_dict() if 'status' in df.columns else {}
        
        # Calculate additional stats using pandas aggregation
        numeric_stats = {}
        if 'housesConnected' in df.columns:
            numeric_stats['houses_connected'] = {
                'total': int(df['housesConnected'].sum(skipna=True)),
                'average': float(df['housesConnected'].mean(skipna=True)),
                'max': float(df['housesConnected'].max(skipna=True))
            }
        
        if 'dailyUsage' in df.columns:
            numeric_stats['daily_usage_hours'] = {
                'average': float(df['dailyUsage'].mean(skipna=True)),
                'total': float(df['dailyUsage'].sum(skipna=True))
            }
        
        return {
            "sheet_name": sheet,
            "total_devices": int(total_devices),
            "devices_with_coordinates": int(devices_with_coords),
            "by_zone": {k: int(v) for k, v in zones.items()},
            "by_type": {k: int(v) for k, v in device_types.items()},
            "by_status": {k: int(v) for k, v in statuses.items()},
            "numeric_stats": numeric_stats,
            "cache_info": {
                "is_valid": is_cache_valid(sheet),
                "last_fetch": cache["sheets"][sheet]["timestamp"].isoformat() if sheet in cache["sheets"] and cache["sheets"][sheet]["timestamp"] else None,
                "total_fetches": cache["fetch_count"]
            }
        }
    except Exception as e:
        logger.error(f"Error generating stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/survey-data/{survey_code}")
async def get_device_by_code(survey_code: str, sheet: str = SHEET_NAME):
    """
    Get specific device by survey code from specified sheet
    
    Args:
        survey_code: Device survey code (e.g., "RUD001")
        sheet: Name of the Excel sheet to search in (default: "All")
        
    Returns:
        Device details
    """
    try:
        devices = get_survey_data(sheet)
        device = next((d for d in devices if d.get('surveyCode') == survey_code), None)
        
        if not device:
            raise HTTPException(status_code=404, detail=f"Device {survey_code} not found in sheet '{sheet}'")
        
        return device
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching device {survey_code}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/cache/refresh")
async def refresh_cache(sheet: Optional[str] = None):
    """
    Manually refresh cache (force re-fetch from GitHub)
    
    Args:
        sheet: Specific sheet to refresh (optional). If not provided, refreshes all cached sheets
    
    Returns:
        Success message with new data count
    """
    try:
        if sheet:
            # Refresh specific sheet
            logger.info(f"Manual cache refresh triggered for sheet '{sheet}'")
            if sheet in cache["sheets"]:
                cache["sheets"][sheet]["data"] = None
                cache["sheets"][sheet]["timestamp"] = None
            
            devices = get_survey_data(sheet)
            
            return {
                "status": "success",
                "message": f"Cache refreshed for sheet '{sheet}'",
                "sheet": sheet,
                "devices_loaded": len(devices),
                "timestamp": cache["sheets"][sheet]["timestamp"].isoformat()
            }
        else:
            # Refresh all sheets
            logger.info("Manual cache refresh triggered for all sheets")
            refreshed_sheets = list(cache["sheets"].keys())
            cache["sheets"] = {}
            cache["available_sheets"] = None
            cache["sheets_timestamp"] = None
            
            # Reload default sheet
            devices = get_survey_data(SHEET_NAME)
            
            return {
                "status": "success",
                "message": "Cache refreshed for all sheets",
                "refreshed_sheets": refreshed_sheets,
                "devices_loaded": len(devices),
                "timestamp": datetime.now().isoformat()
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
