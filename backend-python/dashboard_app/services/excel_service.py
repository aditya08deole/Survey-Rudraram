import pandas as pd
import numpy as np
import requests
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
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
SHEET_NAME = "All"

def is_cache_valid(sheet_name: str = SHEET_NAME) -> bool:
    """Redis handles TTL automatically, so we just check if key exists"""
    return redis_client.get(f"sheet:{sheet_name}") is not None

def validate_excel_data(df: pd.DataFrame) -> None:
    """Validate Excel data structure and headers"""
    if df.empty or len(df.columns) == 0:
        logger.warning(f"Empty sheet detected")
        return
    
    logger.info(f"Excel columns found: {list(df.columns)}")
    
    # Validate headers against expected schema
    header_validation = validate_excel_headers(list(df.columns))
    
    if not header_validation["valid"]:
        logger.warning(f"Header validation warnings: {header_validation['warnings']}")
    
    if header_validation["missing_headers"]:
        logger.error(f"Missing required headers: {header_validation['missing_headers']}")
    
    if header_validation["extra_headers"]:
        logger.info(f"Extra headers found (will be ignored): {header_validation['extra_headers']}")

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

def normalize_survey_data(df: pd.DataFrame) -> Dict[str, Any]:
    """
    INDUSTRIAL-GRADE NORMALIZATION PIPELINE
    
    Converts raw Excel DataFrame into validated, canonical device objects
    
    Returns:
        {
            "valid_devices": [...],      # Clean, validated devices
            "invalid_devices": [...],    # Quarantined rows with errors
            "stats": {
                "total": 187,
                "valid": 175,
                "invalid": 12,
                "validation_rate": 93.6,
                "error_breakdown": {...}
            },
            "header_validation": {...}
        }
    """
    if df.empty or len(df.columns) == 0:
        return {
            "valid_devices": [],
            "invalid_devices": [],
            "stats": {
                "total": 0,
                "valid": 0,
                "invalid": 0,
                "validation_rate": 0,
                "error_breakdown": {}
            }
        }
    
    # Step 1: Validate headers
    header_validation = validate_excel_headers(list(df.columns))
    logger.info(f"Header validation: {header_validation}")
    
    # Step 2: Map Excel headers to canonical field names
    df_mapped = df.rename(columns=EXCEL_HEADER_MAP)
    logger.info(f"Mapped columns: {list(df_mapped.columns)}")
    
    # Step 3: Initialize normalizer and validator
    normalizer = DataNormalizer()
    validator = ExcelValidator()
    
    # Step 4: Normalize each row
    normalized_rows = []
    
    for idx, row in df_mapped.iterrows():
        # Sanitize all fields using formal schema
        normalized_row = {
            # Core identification
            "survey_id": normalizer.sanitize_string(row.get("survey_id")),
            "original_name": normalizer.sanitize_string(row.get("original_name")),
            
            # Location
            "zone": normalizer.sanitize_string(row.get("zone")),
            "street": normalizer.sanitize_string(row.get("street")),
            
            # Device information
            "device_type": normalizer.normalize_device_type(row.get("device_type")),
            "status": normalizer.normalize_status(row.get("status")),
            
            # GPS coordinates (CRITICAL - must be numeric)
            "lat": normalizer.sanitize_coordinate(row.get("lat")),
            "lng": normalizer.sanitize_coordinate(row.get("lng")),
            
            # Operational data
            "houses": normalizer.sanitize_integer(row.get("houses"), min_val=0, max_val=10000),
            "usage_hours": normalizer.sanitize_float(row.get("usage_hours"), min_val=0.0, max_val=24.0),
            
            # Technical specifications
            "pipe_size": normalizer.sanitize_float(row.get("pipe_size"), min_val=0.0, max_val=100.0),
            "motor_hp": normalizer.sanitize_float(row.get("motor_hp"), min_val=0.0, max_val=1000.0),
            
            # Maintenance
            "notes": normalizer.sanitize_string(row.get("notes")),
            
            # Metadata for debugging
            "row_index": int(idx) + 2  # Excel row number (1-indexed + header row)
        }
        
        normalized_rows.append(normalized_row)
    
    # Step 5: Validate all rows and quarantine invalid ones
    validation_result = validator.validate_batch(normalized_rows)
    
    # Step 6: Log statistics
    stats = validation_result["stats"]
    logger.info(f"Normalization complete: {stats['valid']}/{stats['total']} valid ({stats['validation_rate']}%)")
    
    if stats['invalid'] > 0:
        logger.warning(f"Quarantined {stats['invalid']} invalid rows")
        logger.warning(f"Error breakdown: {stats['error_breakdown']}")
    
    # Step 7: Make JSON-safe
    valid_devices = [make_json_safe(device) for device in validation_result["valid_devices"]]
    invalid_devices = [make_json_safe(device) for device in validation_result["invalid_devices"]]
    
    return {
        "valid_devices": valid_devices,
        "invalid_devices": invalid_devices,
        "stats": stats,
        "header_validation": header_validation
    }

def fetch_excel_from_github(sheet_name: str = SHEET_NAME) -> pd.DataFrame:
    """Fetch Excel from GitHub"""
    try:
        response = requests.get(GITHUB_RAW_EXCEL_URL, timeout=15)
        response.raise_for_status()
        
        excel_data = BytesIO(response.content)
        excel_file = pd.ExcelFile(excel_data, engine='openpyxl')
        
        available_sheets = excel_file.sheet_names
        # Cache sheet names in Redis for 1 hour
        redis_client.set("available_sheets", available_sheets, expire=3600)
        
        if sheet_name not in available_sheets:
            raise HTTPException(status_code=404, detail=f"Sheet '{sheet_name}' not found")
        
        df = pd.read_excel(excel_file, sheet_name=sheet_name, na_values=['', 'NA', 'N/A', 'null', 'NULL'])
        validate_excel_data(df)
        
        # Increment fetch count in Redis
        fetch_count = redis_client.get("fetch_count") or 0
        redis_client.set("fetch_count", fetch_count + 1, expire=86400 * 7) # Keep for a week
        
        return df
    except Exception as e:
        logger.error(f"Failed to fetch Excel: {e}")
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))

def get_survey_data(sheet_name: str = SHEET_NAME, include_invalid: bool = False) -> Dict[str, Any]:
    """
    Get survey data with Redis caching and validation metrics
    
    Args:
        sheet_name: Excel sheet name
        include_invalid: Whether to include quarantined invalid devices
        
    Returns:
        {
            "devices": [...],           # Valid devices only
            "invalid_devices": [...],   # If include_invalid=True
            "metadata": {
                "total_rows": 187,
                "valid_count": 175,
                "invalid_count": 12,
                "validation_rate": 93.6,
                ...
            }
        }
    """
    cache_key = f"sheet:{sheet_name}"
    cached_data = redis_client.get(cache_key)
    
    if cached_data:
        logger.info(f"Serving sheet '{sheet_name}' from Redis cache")
        # Cached data already has the full structure
        if not include_invalid and "invalid_devices" in cached_data:
            cached_data.pop("invalid_devices", None)
        return cached_data
    
    logger.info(f"Cache miss for sheet '{sheet_name}' - fetching fresh data")
    df = fetch_excel_from_github(sheet_name)
    result = normalize_survey_data(df)
    
    # Structure response
    response = {
        "devices": result["valid_devices"],
        "invalid_devices": result["invalid_devices"],
        "metadata": {
            "sheet_name": sheet_name,
            "total_rows": result["stats"]["total"],
            "valid_count": result["stats"]["valid"],
            "invalid_count": result["stats"]["invalid"],
            "validation_rate": result["stats"]["validation_rate"],
            "error_breakdown": result["stats"]["error_breakdown"],
            "header_validation": result["header_validation"],
            "cached_at": datetime.utcnow().isoformat()
        }
    }
    
    # Cache the full response
    redis_client.set(cache_key, response, expire=CACHE_DURATION_SECONDS)
    
    if not include_invalid:
        response.pop("invalid_devices", None)
    
    return response

def get_cached_available_sheets() -> Optional[List[str]]:
    return redis_client.get("available_sheets")

def get_total_fetches() -> int:
    return redis_client.get("fetch_count") or 0
