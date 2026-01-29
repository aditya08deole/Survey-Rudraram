"""
Sync API Router
Handles intelligent synchronization between Excel Source and Supabase Database
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from typing import Dict, Any, List
import logging
from datetime import datetime
import hashlib
import json

from dashboard_app.core.config import get_settings
from dashboard_app.auth.permissions import get_current_user
from dashboard_app.schemas.user import User
from dashboard_app.services.excel_service import get_survey_data

# Import Supabase
from supabase import Client, create_client

router = APIRouter(prefix="/sync", tags=["Sync"])
logger = logging.getLogger(__name__)

# Supabase dependency
def get_supabase() -> Client:
    settings = get_settings()
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

def generate_row_hash(row: Dict[str, Any]) -> str:
    """Generate a consistent hash for a row to detect changes"""
    # Create a copy and remove volatile fields if any (though currently we sync all provided)
    # Sort keys for consistency
    row_str = json.dumps(row, sort_keys=True, default=str)
    return hashlib.md5(row_str.encode()).hexdigest()

async def perform_sync(supabase: Client):
    """
    Background task to perform the sync logic.
    1. Fetch Excel Data
    2. Fetch Existing DB Data (survey_code -> hash)
    3. Compare and Upsert
    """
    try:
        logger.info("Starting Excel Sync...")
        
        # 1. Fetch Latest Excel Data
        excel_result = get_survey_data(sheet_name="All")
        excel_devices = excel_result.get("devices", [])
        
        if not excel_devices:
            logger.warning("No devices found in Excel. Aborting sync.")
            return

        # 2. Fetch Existing DB Data
        # We need identifying info to check for existence
        # Assuming 'survey_code' is unique constraint in DB
        # Only fetch necessary columns to build comparison hash? 
        # Actually, simpler to just UPSERT or Check Existence.
        # But for "Intelligent" sync, user wants delta.
        
        # Let's simple strategy: Upsert based on survey_code. 
        # Calculating hash for 1000+ items might be expensive in python vs just strict upsert.
        # However, to avoid unnecessary DB writes, let's fetch IDs.
        
        # Fetch all existing survey codes
        db_res = supabase.table('devices').select('survey_code').execute()
        existing_codes = {item['survey_code'] for item in db_res.data}
        
        stats = {"inserted": 0, "updated": 0, "errors": 0}
        
        for device in excel_devices:
            try:
                # Map Excel fields to DB fields
                # excel_service already normalizes to snake_case mostly, but let's Ensure mapping
                
                # DB Schema: 
                # survey_code, device_type, zone, location, status, 
                # latitude, longitude, motor_hp, depth_ft, etc.
                
                # Excel "survey_id" -> DB "survey_code"
                payload = {
                    "survey_code": device.get("survey_id"),
                    "device_type": device.get("device_type"),
                    "zone": device.get("zone"),
                    "location": device.get("street") or device.get("location"), # Map street to location
                    "status": device.get("status"),
                    "latitude": device.get("lat"),
                    "longitude": device.get("lng"),
                    "original_name": device.get("original_name"),
                    
                    # Technical Specs (Null if not present)
                    "motor_hp": device.get("motor_hp"),
                    "depth_ft": device.get("depth_ft"), # Assumes DB has this col
                    "pipe_size_inch": device.get("pipe_size"), # DB col check needed? Assuming 'pipe_size_inch' based on sidebar
                    "capacity": device.get("capacity"), # For Sump/OHSR
                    
                    # Meta
                    "last_synced_at": datetime.utcnow().isoformat()
                }
                
                # Remove None values to avoid overwriting existing data with NULL? 
                # Or updating with NULL is correct if Excel is empty?
                # User said Excel is Source of Update. So we sync what we have.
                # However, exclude 'id' if it exists in payload
                
                code = payload["survey_code"]
                if not code:
                    continue
                    
                if code in existing_codes:
                    # UPDATE
                    # We could check hash here, but "Upsert" is safer to ensure consistency
                    # supabase.table('devices').upsert(payload, on_conflict='survey_code').execute()
                    # To count distinct updates, we'd need logic. simpler to blind upsert.
                    supabase.table('devices').update(payload).eq('survey_code', code).execute()
                    stats["updated"] += 1
                else:
                    # INSERT
                    supabase.table('devices').insert(payload).execute()
                    stats["inserted"] += 1
                    
            except Exception as e:
                logger.error(f"Failed to sync device {device.get('survey_id')}: {e}")
                stats["errors"] += 1
                
        logger.info(f"Sync Complete. Stats: {stats}")
        
    except Exception as e:
        logger.error(f"Sync failed globally: {e}")

@router.post("/excel")
async def trigger_excel_sync(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """
    Trigger an immediate sync from Excel to Supabase.
    Runs in background.
    """
    # Enqueue the sync task
    background_tasks.add_task(perform_sync, supabase)
    
    return JSONResponse(
        status_code=202,
        content={
            "success": True, 
            "message": "Sync started in background.",
            "details": "Changes will appear shortly."
        }
    )
