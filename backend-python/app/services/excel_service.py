import pandas as pd
import numpy as np
import requests
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from io import BytesIO
from fastapi import HTTPException

logger = logging.getLogger(__name__)

from app.cache.redis_client import redis_client

# Configuration
GITHUB_RAW_EXCEL_URL = "https://raw.githubusercontent.com/aditya08deole/Survey-Rudraram/main/backend/data/rudraram_survey.xlsx"
CACHE_DURATION_SECONDS = 3600  # 1 hour cache with Redis
SHEET_NAME = "All"

def is_cache_valid(sheet_name: str = SHEET_NAME) -> bool:
    """Redis handles TTL automatically, so we just check if key exists"""
    return redis_client.get(f"sheet:{sheet_name}") is not None

def validate_excel_data(df: pd.DataFrame) -> None:
    """Validate Excel data structure"""
    if df.empty or len(df.columns) == 0:
        logger.warning(f"Empty sheet detected")
        return
    logger.info(f"Excel columns found: {list(df.columns)}")

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

def to_camel_case(col_name: str) -> str:
    """Convert any column name to camelCase"""
    special_mappings = {
        'Latitude': 'lat',
        'Longitude': 'long',
        'Original Name': 'originalName',
        'Survey Code (ID)': 'surveyCode'
    }
    
    if col_name in special_mappings:
        return special_mappings[col_name]
    
    parts = str(col_name).replace('(', ' ').replace(')', ' ').replace('/', ' ').split()
    if not parts:
        return str(col_name).lower().replace(' ', '_')
    return parts[0].lower() + ''.join(word.capitalize() for word in parts[1:])

def normalize_survey_data(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """Convert DataFrame to normalized JSON format"""
    if df.empty or len(df.columns) == 0:
        return []
    
    column_mapping = {col: to_camel_case(col) for col in df.columns}
    df_normalized = df.rename(columns=column_mapping).copy()
    
    for col in df_normalized.columns:
        try:
            converted = pd.to_numeric(df_normalized[col], errors='coerce')
            if converted.notna().sum() > 0:
                df_normalized[col] = converted
        except:
            pass
    
    df_normalized = df_normalized.replace([np.inf, -np.inf], np.nan)
    df_normalized = df_normalized.where(pd.notna(df_normalized), None)
    
    for col in df_normalized.columns:
        if df_normalized[col].dtype == 'object':
            df_normalized[col] = df_normalized[col].astype(str).str.strip()
            df_normalized[col] = df_normalized[col].replace(['nan', 'None', 'NaN', 'null', ''], None)
    
    devices = df_normalized.to_dict('records')
    return [make_json_safe(device) for device in devices]

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

def get_survey_data(sheet_name: str = SHEET_NAME) -> List[Dict[str, Any]]:
    """Get survey data with Redis caching"""
    cache_key = f"sheet:{sheet_name}"
    cached_data = redis_client.get(cache_key)
    
    if cached_data:
        logger.info(f"Serving sheet '{sheet_name}' from Redis cache")
        return cached_data
    
    logger.info(f"Cache miss for sheet '{sheet_name}' - fetching fresh data")
    df = fetch_excel_from_github(sheet_name)
    devices = normalize_survey_data(df)
    
    redis_client.set(cache_key, devices, expire=CACHE_DURATION_SECONDS)
    return devices

def get_cached_available_sheets() -> Optional[List[str]]:
    return redis_client.get("available_sheets")

def get_total_fetches() -> int:
    return redis_client.get("fetch_count") or 0
