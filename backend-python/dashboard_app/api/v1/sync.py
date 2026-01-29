from fastapi import APIRouter, HTTPException, BackgroundTasks
from dashboard_app.services.sync_service import SyncService
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/excel", summary="Trigger Excel to Supabase Sync")
async def sync_excel_data(background_tasks: BackgroundTasks):
    """
    Triggers a synchronization of data from the GitHub Excel file to the Supabase database.
    This ensures the database is the Single Source of Truth.
    """
    try:
        # Run synchronously for now to ensure immediate feedback for the user, 
        # or use background task if it takes too long.
        # Given the dataset size (~100-500 rows), sync is fast enough.
        result = SyncService.sync_excel_to_supabase()
        return result
    except Exception as e:
        logger.error(f"Sync endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
