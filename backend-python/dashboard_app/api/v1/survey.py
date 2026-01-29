from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from typing import Optional, List, Dict, Any
import logging
import os
from dotenv import load_dotenv
from supabase import create_client
from datetime import datetime

from dashboard_app.services.excel_service import (
    get_survey_data as get_excel_data,
    is_cache_valid,
    CACHE_DURATION_SECONDS
)

# Load environment
load_dotenv(".env.development")
load_dotenv(".env.production")

logger = logging.getLogger(__name__)

# Initialize Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    logger.error("Supabase credentials not found!")
    supabase = None
else:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        logger.info(f"Supabase client initialized: {SUPABASE_URL}")
    except Exception as e:
        logger.error(f"Failed to initialize Supabase: {e}")
        supabase = None

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

@router.get("/survey-data")
async def get_all_survey_data(
    sheet: str = "All",
    source: str = Query("supabase", description="Data source: 'supabase' or 'excel'"),
    include_invalid: bool = Query(False, description="Include quarantined invalid devices")
):
    """
    Get all survey data.
    - Default source='supabase': Fetches from Database (Repliable, Fast)
    - source='excel': Fetches from GitHub Excel file (For Table View comparison)
    """
    try:
        response_data = {}
        headers = {}
        
        if source == "excel":
            # --- EXCEL PATH ---
            result = get_excel_data(sheet, include_invalid=include_invalid)
            # Result already has {devices, metadata, etc}
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
        else:
            # --- SUPABASE PATH (DEFAULT) ---
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
            
            return JSONResponse(
                content=jsonable_encoder(response_data),
                headers={
                    "X-Total-Devices": str(total),
                    "X-Source": "database"
                }
            )
            
    except Exception as e:
        logger.error(f"Error in /api/survey-data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/survey-data/stats")
async def get_survey_stats(source: str = Query("supabase")):
    """Get statistics (Calculated from DB or Excel)"""
    try:
        if source == "excel":
            result = get_excel_data("All")
            valid_devices = result.get("devices", [])
        else:
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
