from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from typing import Optional, List, Dict, Any
import logging
from datetime import datetime

from dashboard_app.services.excel_service import (
    get_survey_data,
    is_cache_valid,
    CACHE_DURATION_SECONDS
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Survey Data"])

@router.get("/survey-data")
async def get_all_survey_data(
    sheet: str = "All",
    include_invalid: bool = Query(False, description="Include quarantined invalid devices")
):
    """
    Get all survey data from Excel
    Aggregates Borewell, Sump, and OHSR sheets if sheet="All"
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
                "X-Source": "Excel (GitHub)"
            }
        )
    except Exception as e:
        logger.error(f"Error in /api/survey-data: {str(e)}")
        # Return 500 but log detailed error
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/survey-data/stats")
async def get_survey_stats():
    """Get fast distribution statistics"""
    try:
        # Get 'All' sheet data for global stats (this internally fetches all sheets)
        result = get_survey_data("All")
        valid_devices = result.get("devices", [])
        
        stats = {
            "total_devices": len(valid_devices),
            "zones": {},
            "types": {},
            "status": {}
        }
        
        for d in valid_devices:
            # Zone stats
            zone = d.get("zone") or "Unknown"
            stats["zones"][zone] = stats["zones"].get(zone, 0) + 1
            
            # Type stats
            dtype = d.get("device_type") or "Unknown"
            stats["types"][dtype] = stats["types"][dtype, 0] + 1
            
            # Status stats
            status = d.get("status") or "Unknown"
            stats["status"][status] = stats["status"].get(status, 0) + 1
            
        return stats
    except Exception as e:
        logger.error(f"Error calculating stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
