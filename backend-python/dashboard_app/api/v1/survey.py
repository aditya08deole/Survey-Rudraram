from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from typing import Dict, Any, List
import logging
import os
from dotenv import load_dotenv
from supabase import create_client

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
    return {
        "survey_id": record.get("survey_code"),
        "original_name": record.get("survey_code"),
        "zone": record.get("zone"),
        "street": record.get("location_address") or record.get("street_name"),
        "device_type": device_type,
        "status": record.get("status"),
        "lat": record.get("latitude"),
        "lng": record.get("longitude"),
        "houses": record.get("connected_houses") or record.get("houses_connected"),
        "usage_hours": record.get("daily_usage_hours") or record.get("daily_usage"),
        "pipe_size": record.get("pipe_size"),
        "motor_hp": record.get("motor_capacity") or record.get("motor_hp"),
        "notes": record.get("remarks") or record.get("notes"),
        "id": record.get("id")
    }

@router.get("/survey-data")
async def get_all_survey_data(
    sheet: str = "All",
    include_invalid: bool = Query(False)
):
    """
    Get all survey data from Database (migrated from Excel)
    Returns data in the format expected by the frontend.
    """
    if not supabase:
        raise HTTPException(status_code=503, detail="Database connection not available")

    try:
        all_devices = []
        
        # 1. Fetch Borewells
        try:
            res = supabase.table("borewells").select("*").execute()
            for r in res.data:
                all_devices.append(map_db_to_frontend(r, "Borewell"))
        except Exception as e:
            logger.error(f"Error fetching borewells: {e}")

        # 2. Fetch Sumps
        try:
            res = supabase.table("sumps").select("*").execute()
            for r in res.data:
                all_devices.append(map_db_to_frontend(r, "Sump"))
        except Exception as e:
            logger.error(f"Error fetching sumps: {e}")

        # 3. Fetch Overhead Tanks
        try:
            res = supabase.table("overhead_tanks").select("*").execute()
            for r in res.data:
                all_devices.append(map_db_to_frontend(r, "OHSR"))
        except Exception as e:
            logger.error(f"Error fetching tanks: {e}")

        # Filter by sheet/type if requested
        if sheet and sheet != "All":
            type_map = {
                "Borewell": "Borewell",
                "Sump": "Sump",
                "OHSR": "OHSR",
                "OHT": "OHSR"
            }
            target_type = type_map.get(sheet)
            if target_type:
                all_devices = [d for d in all_devices if d["device_type"] == target_type]

        # Basic metadata
        total = len(all_devices)
        
        # Construct response matching old Excel format
        response_data = {
            "devices": all_devices,
            "invalid_devices": [],
            "metadata": {
                "total_rows": total,
                "valid_count": total,
                "invalid_count": 0,
                "validation_rate": 100.0,
                "error_breakdown": {}
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
        logger.error(f"Critical error in get_all_survey_data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/survey-data/stats")
async def get_survey_stats():
    """Get statistics (Calculated from DB data)"""
    if not supabase:
        raise HTTPException(status_code=503, detail="Database not configured")

    try:
        # Re-fetch data (inefficient but consistent) or do aggregation queries
        # For simplicity/speed of implementation, we'll do lightweight aggregation queries
        
        stats = {
            "total_devices": 0,
            "zones": {},
            "types": {},
            "status": {}
        }

        # Helper to process table stats
        def process_table(table, type_name):
            res = supabase.table(table).select("zone, status").execute()
            count = len(res.data)
            stats["total_devices"] += count
            stats["types"][type_name] = count
            
            for r in res.data:
                z = r.get("zone") or "Unknown"
                s = r.get("status") or "Unknown"
                stats["zones"][z] = stats["zones"].get(z, 0) + 1
                stats["status"][s] = stats["status"].get(s, 0) + 1

        process_table("borewells", "Borewell")
        process_table("sumps", "Sump")
        process_table("overhead_tanks", "OHSR")

        return stats
    except Exception as e:
        logger.error(f"Error calculating stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))
