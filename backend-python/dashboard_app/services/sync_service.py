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
        Logs operation progress to sync_history table.
        """
        sync_record_id = None
        try:
            logger.info("Starting Excel-to-Supabase Sync...")
            
            # 0. Initialize Sync Log
            try:
                sync_log = supabase.table("sync_history").insert({
                    "status": "running",
                    "triggered_by": "manual",
                }).execute()
                if sync_log.data:
                    sync_record_id = sync_log.data[0]["id"]
            except Exception as log_err:
                logger.warning(f"Failed to create sync log entry (table might not exist): {log_err}")

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
                msg = "No valid devices found in Excel"
                if sync_record_id:
                    supabase.table("sync_history").update({
                        "status": "failed",
                        "error_message": msg,
                        "finished_at": "now()"
                    }).eq("id", sync_record_id).execute()
                return {"status": "warning", "message": msg, "stats": {"processed": 0}}

            # 2. Prepare Data for Supabase Upsert
            upsert_data = []
            for device in all_devices:
                # Remove row_index and ensure all normalized fields are present
                clean_record = {k: v for k, v in device.items() if k not in ['row_index']}
                upsert_data.append(clean_record)

            # 3. Upsert to Supabase
            total_upserted = 0
            if upsert_data:
                # Chunking (Supabase has limit on request size)
                chunk_size = 100
                for i in range(0, len(upsert_data), chunk_size):
                    chunk = upsert_data[i:i + chunk_size]
                    supabase.table("devices").upsert(chunk, on_conflict="survey_id").execute()
                    total_upserted += len(chunk)
            
            # 4. Update Sync Log on Success
            if sync_record_id:
                try:
                    import datetime
                    supabase.table("sync_history").update({
                        "status": "success",
                        "finished_at": datetime.datetime.now().isoformat(),
                        "devices_synced": total_upserted
                    }).eq("id", sync_record_id).execute()
                except Exception as log_err:
                    logger.error(f"Failed to update sync log: {log_err}")

            logger.info(f"Successfully synced {total_upserted} devices.")
            return {
                "status": "success", 
                "message": "Sync complete", 
                "stats": {"processed": len(all_devices), "upserted": total_upserted}
            }
            
        except Exception as e:
            logger.error(f"Sync failed: {e}")
            if sync_record_id:
                try:
                    supabase.table("sync_history").update({
                        "status": "failed",
                        "error_message": str(e),
                        "finished_at": "now()"
                    }).eq("id", sync_record_id).execute()
                except: pass
            return {"status": "error", "message": str(e)}

    @staticmethod
    def log_audit(operation: str, table_name: str, record_id: str, old_data: Any = None, new_data: Any = None, user_id: str = None):
        """
        Records a change to a device record for the audit trail.
        """
        try:
            supabase.table("audit_logs").insert({
                "operation": operation,
                "table_name": table_name,
                "record_id": record_id,
                "old_data": old_data,
                "new_data": new_data,
                "user_id": user_id
            }).execute()
        except Exception as e:
            logger.error(f"Failed to log audit: {e}")
