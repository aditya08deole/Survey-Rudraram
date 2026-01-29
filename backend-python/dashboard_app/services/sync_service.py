import logging
import pandas as pd
from typing import Dict, Any, List
from dashboard_app.services.excel_service import fetch_excel_data, normalize_survey_data
from dashboard_app.core.config import get_settings
from supabase import create_client

logger = logging.getLogger(__name__)

# Initialize Supabase Client
settings = get_settings()
supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

class SyncService:
    @staticmethod
    def sync_excel_to_supabase() -> Dict[str, Any]:
        """
        Fetches latest Excel data, normalizes it, and upserts into Supabase.
        Returns stats about the operation.
        """
        try:
            logger.info("Starting Excel-to-Supabase Sync...")
            
            # 1. Fetch and process all sheets from Excel
            all_dfs = fetch_excel_data()
            all_devices = []
            
            # Auto-detect sheets
            for actual_sheet_name in all_dfs.keys():
                lower_name = actual_sheet_name.lower()
                if any(key in lower_name for key in ["bore", "sump", "ohsr", "oht", "overhead"]):
                    
                    # Infer type
                    d_type = "Borewell" # Default
                    if "sump" in lower_name: d_type = "Sump"
                    elif "ohsr" in lower_name or "overhead" in lower_name or "oht" in lower_name: d_type = "OHSR"
                    
                    # Normalize
                    result = normalize_survey_data(all_dfs[actual_sheet_name], device_type_override=d_type)
                    all_devices.extend(result["valid_devices"])
            
            if not all_devices:
                return {"status": "warning", "message": "No valid devices found in Excel", "stats": {"processed": 0}}

            # 2. Prepare Data for Supabase Upsert
            # We need to match the Supabase table schema
            upsert_data = []
            for device in all_devices:
                # Map flattened fields to DB columns
                record = {
                    "survey_id": device["survey_id"],
                    "device_type": device["device_type"],
                    "original_name": device["original_name"],
                    "status": device["status"],
                    "lat": device["lat"],
                    "lng": device["lng"],
                    "zone": device["zone"],
                    "street": device["street"],
                    "motor_hp": device.get("motor_hp"),
                    "depth_ft": device.get("depth_ft"),
                    "pipe_size": device.get("pipe_size"),
                    "capacity": device.get("capacity"),
                    "tank_height_m": device.get("tank_height_m"),
                    "tank_circumference": device.get("tank_circumference"),
                    "power_distance_m": device.get("power_distance_m"),
                    "people_connected": device.get("people_connected"),
                    "material": device.get("material"),
                    "type": device.get("type"),
                    "lid_access": device.get("lid_access"),
                    "power_type": device.get("power_type"),
                    "notes": device.get("notes"),
                    # "images": device.get("images", []), # Don't overwrite images from Excel if we want to keep DB images? 
                    # Actually, for now, Excel is source of truth for METADATA. DB is source for IMAGES.
                    # We should probably doing an UPDATE of metadata only, or careful Upsert.
                    # Supabase upsert performs insert or update on conflict.
                }
                
                # Correction: The normalizer output keys might not match DB keys exactly.
                # Let's map explicitly based on `normalize_survey_data` output structure.
                # Output keys: survey_id, original_name, zone, street, device_type, status, lat, lng, houses, usage_hours, pipe_size, motor_hp, notes
                
                # We need to handle Sump/OHSR specific fields like capacity/height which might not be in the standard normalizer output yet?
                # Wait, `excel_service.py` -> `normalize_survey_data` standardizes to a specific set.
                # If Sump columns (Capacity, Height) are lost there, they won't reach DB.
                # I need to check `excel_service.py` again. It seems it ONLY outputs: houses, usage_hours, pipe_size, motor_hp.
                # It MISSES capacity, height, etc. for Sumps/OHSR!
                # THIS IS THE "MISSING DETAILS" BUG!
                
                # For now, let's allow "extra props" in normalizer or just pass raw row data mixed in?
                # Better: Update `excel_service.py` to include these fields in the normalized output.
                
                # Let's assume I will fix `excel_service.py` in the next step. 
                # For now, I will write the SyncService to accept these fields.
                
                clean_record = {k: v for k, v in device.items() if k not in ['row_index']}
                
                # Ensure geometry is set if lat/lng exist (for PostGIS if used, or just syncing raw cols)
                # content of `devices` table: id (uuid), survey_id (text unique), ...
                
                upsert_data.append(clean_record)

            # 3. Upsert to Supabase
            if upsert_data:
                # Chunking (Supabase has limit on request size)
                chunk_size = 100
                total_upserted = 0
                for i in range(0, len(upsert_data), chunk_size):
                    chunk = upsert_data[i:i + chunk_size]
                    response = supabase.table("devices").upsert(chunk, on_conflict="survey_id").execute()
                    # Response structure verification?
                    total_upserted += len(chunk)
                
                logger.info(f"Successfully synced {total_upserted} devices.")
                return {"status": "success", "message": "Sync complete", "stats": {"processed": len(all_devices), "upserted": total_upserted}}
            
            return {"status": "success", "message": "No data to sync", "stats": {"processed": 0}}
            
        except Exception as e:
            logger.error(f"Sync failed: {e}")
            return {"status": "error", "message": str(e)}
