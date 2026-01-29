from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from dashboard_app.services.sync_service import SyncService
from dashboard_app.auth.permissions import require_role
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/excel", summary="Trigger Excel to Supabase Sync")
async def sync_excel_data(
    background_tasks: BackgroundTasks, 
    admin: dict = Depends(require_role(["admin"]))
):
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

@router.get("/history", summary="Get Synchronization History")
async def get_sync_history():
    """
    Fetches the latest synchronization events from the database.
    """
    try:
        # Import supabase directly from SyncService or similar
        from dashboard_app.services.sync_service import supabase
        response = supabase.table("sync_history")\
            .select("*")\
            .order("started_at", desc=True)\
            .limit(20)\
            .execute()
        return response.data
    except Exception as e:
        logger.error(f"Error fetching sync history: {e}")
        raise HTTPException(status_code=500, detail=str(e))
