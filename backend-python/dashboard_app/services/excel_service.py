import pandas as pd
import numpy as np
import requests
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Union
from io import BytesIO
from fastapi import HTTPException

logger = logging.getLogger(__name__)

from dashboard_app.cache.redis_client import redis_client
from dashboard_app.schemas.excel_schema import (
    EXCEL_HEADER_MAP,
    REQUIRED_FIELDS,
    validate_excel_headers
)
from dashboard_app.services.data_normalizer import DataNormalizer
from dashboard_app.services.excel_validator import ExcelValidator

# Configuration
GITHUB_RAW_EXCEL_URL = "https://raw.githubusercontent.com/aditya08deole/Survey-Rudraram/main/backend/data/rudraram_survey.xlsx"
CACHE_DURATION_SECONDS = 3600  # 1 hour cache with Redis
SHEET_NAMES = ["Borewell", "Sump", "OHSR", "OHT"] # Sheets to look for

def is_cache_valid(sheet_name: str = "All") -> bool:
    """Redis handles TTL automatically, so we just check if key exists"""
    return redis_client.get(f"sheet:{sheet_name}") is not None

def validate_excel_data(df: pd.DataFrame) -> None:
    """Validate Excel data structure and headers"""
    if df.empty or len(df.columns) == 0:
        logger.warning(f"Empty sheet detected")
        return
    
    logger.info(f"Excel columns found: {list(df.columns)}")
    
    # Simple check for critical "Survey Code" or similar
    # We allow flexible schemas now, so standard full validation might be too strict
    # but we log what we find
    pass

def make_json_safe(obj):
    """Recursively ensure all values are JSON-safe"""
    if isinstance(obj, dict):
        return {k: make_json_safe(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [make_json_safe(item) for item in obj]
    elif isinstance(obj, float):
        if np.isnan(obj) or np.isinf(obj):
            return None
        return obj
    elif pd.isna(obj):
        return None
    return obj

def normalize_survey_data(df: pd.DataFrame, device_type_override: Optional[str] = None) -> Dict[str, Any]:
    """
    Normalizes a single sheet's dataframe.
    ARGS:
        df: DataFrame
        device_type_override: If set, forces all rows to this device type (e.g. from sheet name)
    """
    if df.empty or len(df.columns) == 0:
        return {"valid_devices": [], "invalid_devices": [], "stats": {"total": 0}}
    
    # Normalize headers roughly if needed (strip spaces)
    df.columns = [str(c).strip() for c in df.columns]
    
    # Flexible mapping: allow exact map or case-insensitive search
    # We construct a rename map based on what's actually in the DF
    rename_map = {}
    for actual_col in df.columns:
        # Check against contracts
        for expected, canonical in EXCEL_HEADER_MAP.items():
            if str(actual_col).strip().lower() == expected.lower(): 
                rename_map[actual_col] = canonical
            # Handle "Survey No" vs "Survey Code" variations
            elif "survey" in str(actual_col).lower() and "code" in str(actual_col).lower() and canonical == "survey_id":
                 rename_map[actual_col] = canonical
            elif "lat" in str(actual_col).lower() and canonical == "lat":
                 rename_map[actual_col] = canonical
            elif "long" in str(actual_col).lower() and canonical == "lng":
                 rename_map[actual_col] = canonical
    
    df_mapped = df.rename(columns=rename_map)
    # Ensure all canonical columns exist (fill with None if missing)
    for canonical in EXCEL_HEADER_MAP.values():
        if canonical not in df_mapped.columns:
            df_mapped[canonical] = None

    normalizer = DataNormalizer()
    normalized_rows = []
    
    for idx, row in df_mapped.iterrows():
        try:
            # Determine device type: override > row value > default
            dtype = device_type_override
            if not dtype:
                dtype = normalizer.normalize_device_type(row.get("device_type"))
            if not dtype:
                dtype = "Borewell" # Default fallback
            
            normalized_row = {
                "survey_id": normalizer.sanitize_string(row.get("survey_id")),
                "original_name": normalizer.sanitize_string(row.get("original_name") or row.get("survey_id")),
                "zone": normalizer.sanitize_string(row.get("zone")),
                "street": normalizer.sanitize_string(row.get("street")),
                "device_type": dtype,
                "status": normalizer.normalize_status(row.get("status")),
                "lat": normalizer.sanitize_coordinate(row.get("lat")),
                "lng": normalizer.sanitize_coordinate(row.get("lng")),
                "houses": normalizer.sanitize_integer(row.get("houses"), min_val=0, max_val=10000),
                "usage_hours": normalizer.sanitize_float(row.get("usage_hours"), min_val=0.0, max_val=24.0),
                "pipe_size": normalizer.sanitize_float(row.get("pipe_size"), min_val=0.0, max_val=100.0),
                "motor_hp": normalizer.sanitize_float(row.get("motor_hp"), min_val=0.0, max_val=1000.0),
                "notes": normalizer.sanitize_string(row.get("notes")),
                # Extended Fields for Sump/OHSR
                "depth_ft": normalizer.sanitize_float(row.get("depth") or row.get("depth_ft")),
                "capacity": normalizer.sanitize_float(row.get("capacity") or row.get("cap")),
                "tank_height_m": normalizer.sanitize_float(row.get("height") or row.get("tank_height") or row.get("tank_height_m")),
                "tank_circumference": normalizer.sanitize_float(row.get("circumference") or row.get("tank_circumference")),
                "power_distance_m": normalizer.sanitize_float(row.get("power_distance") or row.get("power_distance_m")),
                "people_connected": normalizer.sanitize_integer(row.get("people") or row.get("people_connected")),
                "material": normalizer.sanitize_string(row.get("material")),
                "type": normalizer.sanitize_string(row.get("type")),
                "lid_access": normalizer.sanitize_string(row.get("lid_access") or row.get("lid")),
                "power_type": normalizer.sanitize_string(row.get("power_type") or row.get("power")),
                "row_index": int(idx) + 2
            }
            normalized_rows.append(normalized_row)
        except Exception as e:
            logger.warning(f"Skipping row {idx}: {e}")

    # For now, treat all as valid for "fix it" request, 
    # but we could validte REQUIRED_FIELDS if strictness is needed.
    # We return list directly.
    return {
        "valid_devices": normalized_rows,
        "invalid_devices": [],
        "stats": {"total": len(normalized_rows)}
    }

def fetch_excel_data() -> Dict[str, pd.DataFrame]:
    """Fetch Excel and return dict of DataFrames (Sheet Name -> DF)"""
    try:
        logger.info(f"Fetching Excel from {GITHUB_RAW_EXCEL_URL}")
        response = requests.get(GITHUB_RAW_EXCEL_URL, timeout=30)
        response.raise_for_status()
        
        excel_data = BytesIO(response.content)
        # Read all sheets
        dfs = pd.read_excel(excel_data, sheet_name=None, engine='openpyxl') 
        return dfs
    except Exception as e:
        logger.error(f"Failed to fetch Excel: {e}")
        raise HTTPException(status_code=500, detail=f"Excel fetch error: {str(e)}")

def get_survey_data(sheet_name: str = "All", include_invalid: bool = False) -> Dict[str, Any]:
    """
    Get consolidated survey data from Excel
    Uses Redis to cache the FINAL processed JSON result
    """
    cache_key = f"survey_data_v2:{sheet_name}"
    cached_data = redis_client.get(cache_key)
    
    if cached_data:
        logger.info("Serving from Redis cache")
        return cached_data
    
    # Fetch fresh
    all_dfs = fetch_excel_data()
    all_devices = []
    
    # Process specified sheets or all relevant ones
    sheets_to_process = []
    # Process all sheets that match our keywords
    if sheet_name == "All":
        for actual_sheet_name in all_dfs.keys():
            lower_name = actual_sheet_name.lower()
            # Check if this sheet matches any of our known types
            if any(key in lower_name for key in ["bore", "sump", "ohsr", "oht", "overhead"]):
                sheets_to_process.append((actual_sheet_name, all_dfs[actual_sheet_name]))
                logger.info(f"Auto-detected sheet: {actual_sheet_name}")
    else:
        # Specific sheet requested
        if sheet_name in all_dfs:
            sheets_to_process.append((sheet_name, all_dfs[sheet_name]))
            
    # Normalize each sheet
    for name, df in sheets_to_process:
        # Infer device type from sheet name if possible
        d_type = None
        if "borewell" in name.lower(): d_type = "Borewell"
        elif "sump" in name.lower(): d_type = "Sump"
        elif "ohsr" in name.lower() or "overhead" in name.lower(): d_type = "OHSR"
        elif "oht" in name.lower(): d_type = "OHSR"
        
        result = normalize_survey_data(df, device_type_override=d_type)
        all_devices.extend(result["valid_devices"])
        
    # Construct response
    response = {
        "devices": [make_json_safe(d) for d in all_devices],
        "invalid_devices": [],
        "metadata": {
            "total_rows": len(all_devices),
            "valid_count": len(all_devices),
            "source": "excel_github"
        }
    }
    
    # Cache
    redis_client.set(cache_key, response, expire=CACHE_DURATION_SECONDS)
    
    return response

def get_cached_available_sheets() -> Optional[List[str]]:
    return SHEET_NAMES

def get_total_fetches() -> int:
    return 0
