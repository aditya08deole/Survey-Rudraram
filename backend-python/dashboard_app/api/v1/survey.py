from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from typing import Optional, List, Dict, Any
import logging
import os
from dotenv import load_dotenv
from datetime import datetime

from dashboard_app.database.supabase_client import get_supabase_client

# Load environment
load_dotenv(".env.development")
load_dotenv(".env.production")

logger = logging.getLogger(__name__)

# Initialize Supabase client using shared singleton
try:
    supabase = get_supabase_client()
    logger.info(f"✅ Supabase client initialized via singleton")
except Exception as e:
    logger.error(f"❌ Supabase initialization failed: {e}")
    supabase = None

# Cache settings
CACHE_EXPIRY_SECONDS = 60

router = APIRouter(tags=["Survey Data"])

def map_db_to_frontend(record: Dict[str, Any], device_type: str) -> Dict[str, Any]:
    """Map database record columns to frontend Device interface"""
    base_data = {
        "survey_id": record.get("survey_code"),
        "original_name": record.get("original_name") or record.get("survey_code"),
        "zone": record.get("zone"),
        "street": record.get("location_address") or record.get("street_name") or record.get("location"),
        "device_type": device_type,
        "status": "Working" if device_type in ["Sump", "OHSR", "OHT"] else record.get("status"),
        "lat": record.get("latitude"),
        "lng": record.get("longitude"),
        "images": record.get("images"),
        "notes": record.get("notes") or record.get("remarks"),
    }

    # Add specific fields based on device type
    if device_type == "Borewell":
        base_data.update({
            "motor_hp": record.get("motor_hp"),
            "depth_ft": record.get("depth_ft"),
            "pipe_size_inch": record.get("pipe_size_inch"),
            "power_type": record.get("power_type"),
            "houses_connected": record.get("houses_connected"),
            "daily_usage_hrs": record.get("daily_usage_hrs"),
            "sr_no": record.get("sr_no"),
            "done": record.get("done")
        })
    elif device_type == "Sump":
        base_data.update({
            "capacity": record.get("capacity"),
            "tank_height_m": record.get("tank_height_m"),
            "tank_circumference": record.get("tank_circumference"),
            "power_distance_m": record.get("power_distance_m"),
            "people_connected": record.get("people_connected") # if available
        })
    elif device_type in ["OHSR", "OHT"]:
        base_data.update({
            "capacity": record.get("capacity"),
            "tank_height_m": record.get("tank_height_m"),
            "material": record.get("material"),
            "lid_access": record.get("lid_access"),
            "type": record.get("type"), # e.g. GLSR vs OHSR
            "houses_connected": record.get("houses_connected")
        })
    
    return base_data

async def fetch_from_supabase(sheet_filter: str) -> List[Dict[str, Any]]:
    """Fetch and normalize data from Supabase"""
    if not supabase:
        raise HTTPException(status_code=503, detail="Database connection not available")

    all_devices = []
    
    # Simple mapping: if sheet is "Borewell", only fetch borewells
    fetch_borewell = sheet_filter in ["All", "Borewell"]
    fetch_sump = sheet_filter in ["All", "Sump"]
    fetch_ohsr = sheet_filter in ["All", "OHSR", "OHT", "Overhead Tank"]

    # 1. Fetch Borewells
    if fetch_borewell:
        try:
            res = supabase.table("borewells").select("*").execute()
            for r in res.data:
                all_devices.append(map_db_to_frontend(r, "Borewell"))
        except Exception as e:
            logger.error(f"Error fetching borewells: {e}")

    # 2. Fetch Sumps
    if fetch_sump:
        try:
            res = supabase.table("sumps").select("*").execute()
            for r in res.data:
                all_devices.append(map_db_to_frontend(r, "Sump"))
        except Exception as e:
            logger.error(f"Error fetching sumps: {e}")

    # 3. Fetch Overhead Tanks
    if fetch_ohsr:
        try:
            res = supabase.table("overhead_tanks").select("*").execute()
            for r in res.data:
                all_devices.append(map_db_to_frontend(r, "OHSR"))
        except Exception as e:
            logger.error(f"Error fetching tanks: {e}")
            
    return all_devices

from dashboard_app.schemas.survey import SurveyDataResponse, SurveyStatsResponse

# Simple in-memory cache for Supabase data
_supabase_cache = {}
CACHE_EXPIRY_SECONDS = 300 # 5 minutes

@router.get("/survey-data", response_model=SurveyDataResponse)
async def get_all_survey_data(
    sheet: str = "All",
    source: str = Query("supabase", description="Data source: 'supabase' or 'excel'"),
    include_invalid: bool = Query(False, description="Include quarantined invalid devices")
):
    """
    Get all survey data from Supabase database.
    Supabase-only - Excel support removed.
    """
    try:
        if source == "excel":
            raise HTTPException(
                status_code=410,
                detail="Excel data source has been deprecated. Use Supabase database only."
            )
        
        # --- SUPABASE PATH (ONLY) ---
            # Check cache
            cache_key = f"{sheet}_{include_invalid}"
            now = datetime.now().timestamp()
            
            if cache_key in _supabase_cache:
                data, timestamp = _supabase_cache[cache_key]
                if now - timestamp < CACHE_EXPIRY_SECONDS:
                    logger.info(f"Serving /survey-data from memory cache: {cache_key}")
                    return JSONResponse(
                        content=data,
                        headers={
                            "X-Total-Devices": str(len(data.get("devices", []))),
                            "X-Source": "database-cache",
                            "Cache-Control": f"public, max-age={CACHE_EXPIRY_SECONDS}"
                        }
                    )

            all_devices = await fetch_from_supabase(sheet)
            
            # Construct response matching Excel format structure
            total = len(all_devices)
            response_data = {
                "devices": all_devices,
                "invalid_devices": [], # DB assumes valid
                "metadata": {
                    "total_rows": total,
                    "valid_count": total,
                    "invalid_count": 0,
                    "validation_rate": 100.0,
                    "source": "database"
                }
            }
            
            # Update cache
            json_data = jsonable_encoder(response_data)
            _supabase_cache[cache_key] = (json_data, now)
            
            return JSONResponse(
                content=json_data,
                headers={
                    "X-Total-Devices": str(total),
                    "X-Source": "database",
                    "Cache-Control": f"public, max-age={CACHE_EXPIRY_SECONDS}"
                }
            )
            
    except Exception as e:
        logger.error(f"Error in /api/survey-data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/survey-data/stats", response_model=SurveyStatsResponse)
async def get_survey_stats():
    """Get statistics from Supabase database"""
    try:
        valid_devices = await fetch_from_supabase("All")

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
            stats["types"][dtype] = stats["types"].get(dtype, 0) + 1
            
            # Status stats
            status = d.get("status") or "Unknown"
            stats["status"][status] = stats["status"].get(status, 0) + 1
            
        return stats
    except Exception as e:
        logger.error(f"Error calculating stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
