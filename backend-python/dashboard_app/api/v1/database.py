"""
Database-backed API routes for Rudraram Survey
Uses Supabase PostgreSQL instead of Excel files
"""

from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional, Dict, Any
from supabase import create_client
import os
from dotenv import load_dotenv
import logging
from dashboard_app.auth.permissions import get_current_user, require_role

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
async def update_device_notes(
    survey_code: str, 
    update: NoteUpdate, 
    current_user: dict = Depends(require_role(["admin", "editor"]))
):
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
        # Fetch old data for audit trail
        old_record = supabase.table(table).select("notes").eq("survey_code", survey_code).execute()
        old_notes = old_record.data[0]["notes"] if old_record.data else None

        supabase.table(table).update({"notes": update.notes}).eq("survey_code", survey_code).execute()
        
        # Log Audit
        from dashboard_app.services.sync_service import SyncService
        SyncService.log_audit(
            operation="UPDATE_NOTES",
            table_name=table,
            record_id=survey_code,
            old_data={"notes": old_notes},
            new_data={"notes": update.notes}
        )
        
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
async def get_stats_summary():
    """Get aggregate statistics for all devices"""
    if not supabase:
        raise HTTPException(status_code=503, detail="Database not configured")
    
    try:
        # Get counts for each table
        b_count = supabase.table("borewells").select("*", count="exact", head=True).execute().count
        s_count = supabase.table("sumps").select("*", count="exact", head=True).execute().count
        o_count = supabase.table("overhead_tanks").select("*", count="exact", head=True).execute().count
        
        # Get working status counts (only for borewells currently tracked)
        working_count = supabase.table("borewells").select("*", count="exact", head=True).eq("status", "Working").execute().count
        
        total = (b_count or 0) + (s_count or 0) + (o_count or 0)
        
        return {
            "success": True,
            "data": {
                "totalDevices": total,
                "byType": {
                    "borewell": b_count or 0,
                    "sump": s_count or 0,
                    "overhead_tank": o_count or 0
                },
                "byStatus": {
                    "Working": working_count or 0,
                    "Not Working": (b_count or 0) - (working_count or 0)
                }
            }
        }
    except Exception as e:
        logger.error(f"Stats summary failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats/trends")
async def get_stats_trends():
    """Get 14-day trend of device synchronization"""
    if not supabase:
        raise HTTPException(status_code=503, detail="Database not configured")
    
    try:
        from datetime import datetime, timedelta
        fourteen_days_ago = (datetime.now() - timedelta(days=14)).isoformat()
        
        # Query sync history for the last 14 days
        result = supabase.table("sync_history") \
            .select("started_at, devices_synced, status") \
            .gte("started_at", fourteen_days_ago) \
            .order("started_at", desc=False) \
            .execute()
        
        # Group by date
        trends = {}
        for entry in result.data:
            if not entry.get("started_at"): continue
            date_str = entry["started_at"].split('T')[0]
            if date_str not in trends:
                trends[date_str] = 0
            if entry["status"] == "success":
                trends[date_str] += entry.get("devices_synced") or 0
        
        formatted_trends = [{"date": k, "count": v} for k, v in sorted(trends.items())]
        
        return {"success": True, "data": formatted_trends}
    except Exception as e:
        logger.error(f"Trends query failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats/health")
async def get_stats_health():
    """Get infrastructure health scores per zone"""
    if not supabase:
        raise HTTPException(status_code=503, detail="Database not configured")
    
    try:
        # Fetch borewells (primary indicators of health)
        borewells = supabase.table("borewells").select("zone, status").execute().data
        
        zone_stats = {}
        for b in borewells:
            zone = b.get("zone") or "Unknown"
            if zone not in zone_stats:
                zone_stats[zone] = {"total": 0, "working": 0}
            
            zone_stats[zone]["total"] += 1
            if b.get("status") == "Working":
                zone_stats[zone]["working"] += 1
        
        health_scores = []
        for zone, stats in zone_stats.items():
            score = (stats["working"] / stats["total"] * 100) if stats["total"] > 0 else 0
            health_scores.append({
                "zone": zone,
                "score": round(score, 1),
                "total": stats["total"],
                "working": stats["working"]
            })
            
        # Sort by score descending
        health_scores.sort(key=lambda x: x["score"], reverse=True)
        
        return {"success": True, "data": health_scores}
    except Exception as e:
        logger.error(f"Health query failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


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
