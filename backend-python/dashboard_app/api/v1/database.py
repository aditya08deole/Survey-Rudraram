"""
Database-backed API routes for Rudraram Survey
Uses Supabase PostgreSQL instead of Excel files
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional, Dict, Any
from supabase import create_client
import os
from dotenv import load_dotenv
import logging

# Load environment
load_dotenv(".env.development")

logger = logging.getLogger(__name__)

# Initialize Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    logger.error("Supabase credentials not found!")
    supabase = None
else:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    logger.info(f"✓ Supabase client initialized: {SUPABASE_URL}")

# Create router
router = APIRouter(prefix="/api/db", tags=["Database"])

from pydantic import BaseModel

class NoteUpdate(BaseModel):
    notes: str
    device_type: str

@router.patch("/devices/{survey_code}/notes")
async def update_device_notes(survey_code: str, update: NoteUpdate):
    """Update notes for a specific device"""
    if not supabase:
        raise HTTPException(status_code=503, detail="Database not configured")
    
    table_map = {
        "Borewell": "borewells", "borewell": "borewells",
        "Sump": "sumps", "sump": "sumps",
        "OHSR": "overhead_tanks", "overhead_tank": "overhead_tanks", "OHT": "overhead_tanks"
    }
    
    table = table_map.get(update.device_type)
    if not table:
         raise HTTPException(status_code=400, detail="Invalid device type")

    try:
        supabase.table(table).update({"notes": update.notes}).eq("survey_code", survey_code).execute()
        return {"success": True, "message": "Notes updated"}
    except Exception as e:
        logger.error(f"Failed to update notes: {e}")
        raise HTTPException(status_code=500, detail=str(e))



@router.get("/devices")
async def get_all_devices(
    device_type: Optional[str] = Query(None, description="Filter by device type: borewell, sump, overhead_tank"),
    zone: Optional[str] = Query(None, description="Filter by zone"),
    status: Optional[str] = Query(None, description="Filter by status"),
    limit: int = Query(1000, le=10000, description="Maximum number of records"),
    offset: int = Query(0, ge=0, description="Pagination offset")
):
    """
    Get all devices from database with optional filtering
    Combines data from borewells, sumps, and overhead_tanks tables
    """
    if not supabase:
        raise HTTPException(status_code=503, detail="Database not configured")
    
    try:
        all_devices = []
        
        # Fetch borewells
        if not device_type or device_type == "borewell":
            query = supabase.table("borewells").select("*")
            if zone:
                query = query.eq("zone", zone)
            if status:
                query = query.eq("status", status)
            query = query.range(offset, offset + limit - 1)
            
            result = query.execute()
            borewells = result.data
            for item in borewells:
                item["device_type"] = "borewell"
            all_devices.extend(borewells)
        
        # Fetch sumps
        if not device_type or device_type == "sump":
            query = supabase.table("sumps").select("*")
            if zone:
                query = query.eq("zone", zone)
            query = query.range(offset, offset + limit - 1)
            
            result = query.execute()
            sumps = result.data
            for item in sumps:
                item["device_type"] = "sump"
                item["status"] = None  # Sumps don't have status
            all_devices.extend(sumps)
        
        # Fetch overhead tanks
        if not device_type or device_type == "overhead_tank":
            query = supabase.table("overhead_tanks").select("*")
            if zone:
                query = query.eq("zone", zone)
            query = query.range(offset, offset + limit - 1)
            
            result = query.execute()
            overhead_tanks = result.data
            for item in overhead_tanks:
                item["device_type"] = "overhead_tank"
                item["status"] = None  # OHSRs don't have status
            all_devices.extend(overhead_tanks)
        
        logger.info(f"Fetched {len(all_devices)} devices from database")
        
        return {
            "success": True,
            "count": len(all_devices),
            "data": all_devices
        }
        
    except Exception as e:
        logger.error(f"Database query failed: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.get("/devices/{survey_code}")
async def get_device_by_code(survey_code: str):
    """Get a specific device by survey code"""
    if not supabase:
        raise HTTPException(status_code=503, detail="Database not configured")
    
    try:
        # Try borewells
        result = supabase.table("borewells").select("*").eq("survey_code", survey_code).execute()
        if result.data:
            device = result.data[0]
            device["device_type"] = "borewell"
            return {"success": True, "data": device}
        
        # Try sumps
        result = supabase.table("sumps").select("*").eq("survey_code", survey_code).execute()
        if result.data:
            device = result.data[0]
            device["device_type"] = "sump"
            return {"success": True, "data": device}
        
        # Try overhead_tanks
        result = supabase.table("overhead_tanks").select("*").eq("survey_code", survey_code).execute()
        if result.data:
            device = result.data[0]
            device["device_type"] = "overhead_tank"
            return {"success": True, "data": device}
        
        raise HTTPException(status_code=404, detail=f"Device {survey_code} not found")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Database query failed: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.get("/stats")
async def get_statistics():
    """Get overall statistics from database"""
    if not supabase:
        raise HTTPException(status_code=503, detail="Database not configured")
    
    try:
        # Count devices by type
        borewells_count = len(supabase.table("borewells").select("id").execute().data)
        sumps_count = len(supabase.table("sumps").select("id").execute().data)
        ohsr_count = len(supabase.table("overhead_tanks").select("id").execute().data)
        
        # Get borewell status breakdown
        borewells_data = supabase.table("borewells").select("status, zone").execute().data
        
        status_counts = {}
        zone_counts = {}
        
        for item in borewells_data:
            status = item.get("status") or "Unknown"
            zone = item.get("zone") or "Unknown"
            
            status_counts[status] = status_counts.get(status, 0) + 1
            zone_counts[zone] = zone_counts.get(zone, 0) + 1
        
        # Get sumps zones
        sumps_data = supabase.table("sumps").select("zone").execute().data
        for item in sumps_data:
            zone = item.get("zone") or "Unknown"
            zone_counts[zone] = zone_counts.get(zone, 0) + 1
        
        # Get OHSR zones
        ohsr_data = supabase.table("overhead_tanks").select("zone").execute().data
        for item in ohsr_data:
            zone = item.get("zone") or "Unknown"
            zone_counts[zone] = zone_counts.get(zone, 0) + 1
        
        return {
            "success": True,
            "data": {
                "total_devices": borewells_count + sumps_count + ohsr_count,
                "by_type": {
                    "borewells": borewells_count,
                    "sumps": sumps_count,
                    "overhead_tanks": ohsr_count
                },
                "by_status": status_counts,
                "by_zone": zone_counts
            }
        }
        
    except Exception as e:
        logger.error(f"Statistics query failed: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.get("/zones")
async def get_zones():
    """Get list of all unique zones"""
    if not supabase:
        raise HTTPException(status_code=503, detail="Database not configured")
    
    try:
        zones = set()
        
        # Get zones from all tables
        borewells = supabase.table("borewells").select("zone").execute().data
        sumps = supabase.table("sumps").select("zone").execute().data
        ohsr = supabase.table("overhead_tanks").select("zone").execute().data
        
        for item in borewells + sumps + ohsr:
            if item.get("zone"):
                zones.add(item["zone"])
        
        return {
            "success": True,
            "data": sorted(list(zones))
        }
        
    except Exception as e:
        logger.error(f"Zones query failed: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.get("/health")
async def health_check():
    """Check database connection health"""
    if not supabase:
        return {
            "status": "error",
            "database": "not_configured",
            "message": "Supabase credentials missing"
        }
    
    try:
        # Simple query to test connection
        result = supabase.table("borewells").select("id").limit(1).execute()
        
        return {
            "status": "healthy",
            "database": "connected",
            "url": SUPABASE_URL
        }
    except Exception as e:
        return {
            "status": "error",
            "database": "connection_failed",
            "error": str(e)
        }
