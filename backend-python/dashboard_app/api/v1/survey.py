from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from typing import Optional, List, Dict, Any
import logging
from datetime import datetime

from dashboard_app.services.excel_service import (
    get_survey_data,
    is_cache_valid,
    fetch_excel_from_github,
    make_json_safe,
    get_cached_available_sheets,
    SHEET_NAME,
    CACHE_DURATION_SECONDS
)
import pandas as pd

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Survey Data"])

@router.get("/survey-data")
async def get_all_survey_data(
    sheet: str = SHEET_NAME,
    include_invalid: bool = Query(False, description="Include quarantined invalid devices")
):
    """
    Get all survey data from specified Excel sheet with validation metrics
    
    Returns:
        {
            "devices": [...],           # Valid devices only
            "invalid_devices": [...],   # If include_invalid=true
            "metadata": {
                "total_rows": 187,
                "valid_count": 175,
                "invalid_count": 12,
                "validation_rate": 93.6,
                "error_breakdown": {...}
            }
        }
    """
    try:
        result = get_survey_data(sheet, include_invalid=include_invalid)
        json_safe_content = jsonable_encoder(result)
        
        metadata = result.get("metadata", {})
        
        return JSONResponse(
            content=json_safe_content,
            headers={
                "Cache-Control": f"public, max-age={CACHE_DURATION_SECONDS}",
                "X-Total-Devices": str(metadata.get("valid_count", 0)),
                "X-Invalid-Devices": str(metadata.get("invalid_count", 0)),
                "X-Validation-Rate": str(metadata.get("validation_rate", 0)),
                "X-Sheet-Name": sheet,
                "X-Cache-Status": "hit" if is_cache_valid(sheet) else "miss"
            }
        )
    except Exception as e:
        logger.error(f"Error in /api/survey-data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sheets")
async def get_available_sheets():
    """
    Get list of all available sheets
    """
    try:
        available_sheets = get_cached_available_sheets()
        if available_sheets is not None:
            return {
                "sheets": available_sheets,
                "default_sheet": SHEET_NAME,
                "total_sheets": len(available_sheets)
            }
        
        fetch_excel_from_github(SHEET_NAME)
        available_sheets = get_cached_available_sheets()
        return {
            "sheets": available_sheets,
            "default_sheet": SHEET_NAME,
            "total_sheets": len(available_sheets) if available_sheets else 0
        }
    except Exception as e:
        logger.error(f"Error fetching sheet list: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/survey-data/stats")
async def get_survey_stats(sheet: str = SHEET_NAME):
    """
    Get statistical summary of survey data with validation metrics
    """
    try:
        result = get_survey_data(sheet, include_invalid=False)
        devices = result.get("devices", [])
        metadata = result.get("metadata", {})
        
        df = pd.DataFrame(devices)
        
        total_devices = len(df)
        devices_with_coords = 0
        if not df.empty and 'lat' in df.columns and 'lng' in df.columns:
            devices_with_coords = df[['lat', 'lng']].notna().all(axis=1).sum()
        
        zones = df['zone'].value_counts().to_dict() if not df.empty and 'zone' in df.columns else {}
        device_types = df['device_type'].value_counts().to_dict() if not df.empty and 'device_type' in df.columns else {}
        statuses = df['status'].value_counts().to_dict() if not df.empty and 'status' in df.columns else {}
        
        return {
            "sheet_name": sheet,
            "total_devices": int(total_devices),
            "devices_with_coordinates": int(devices_with_coords),
            "by_zone": {k: int(v) for k, v in zones.items()},
            "by_type": {k: int(v) for k, v in device_types.items()},
            "by_status": {k: int(v) for k, v in statuses.items()},
            "validation_metrics": {
                "total_rows": metadata.get("total_rows", 0),
                "valid_count": metadata.get("valid_count", 0),
                "invalid_count": metadata.get("invalid_count", 0),
                "validation_rate": metadata.get("validation_rate", 0),
                "error_breakdown": metadata.get("error_breakdown", {})
            },
            "cache_info": {
                "is_valid": is_cache_valid(sheet),
                "last_fetch": "Redis Managed"
            }
        }
    except Exception as e:
        logger.error(f"Error generating stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/survey-data/{survey_code}")
async def get_device_by_code(survey_code: str, sheet: str = SHEET_NAME):
    """
    Get specific device by survey code
    """
    try:
        result = get_survey_data(sheet, include_invalid=False)
        devices = result.get("devices", [])
        device = next((d for d in devices if d.get('survey_id') == survey_code), None)
        
        if not device:
            raise HTTPException(status_code=404, detail=f"Device {survey_code} not found")
        
        return device
    except Exception as e:
        if isinstance(e, HTTPException): raise e
        logger.error(f"Error fetching device {survey_code}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/cache/refresh")
async def refresh_cache(sheet: Optional[str] = None):
    """
    Manually refresh cache
    """
    from dashboard_app.cache.redis_client import redis_client
    try:
        if sheet:
            redis_client.delete(f"sheet:{sheet}")
            get_survey_data(sheet)
            return {"status": "success", "message": f"Cache refreshed for {sheet}"}
        else:
            redis_client.flush_all()
            get_survey_data(SHEET_NAME)
            return {"status": "success", "message": "All caches refreshed"}
    except Exception as e:
        logger.error(f"Error refreshing cache: {e}")
        raise HTTPException(status_code=500, detail=str(e))
