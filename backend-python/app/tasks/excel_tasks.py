from app.celery_worker import celery_app
from app.services.excel_service import fetch_excel_from_github, get_survey_data, SHEET_NAME
import logging

logger = logging.getLogger(__name__)

@celery_app.task(name="app.tasks.excel_tasks.prewarm_cache")
def prewarm_cache(sheet_name: str = SHEET_NAME):
    """
    Background task to fetch Excel data and warm up the Redis cache.
    Useful for scheduled updates or after a manual refresh.
    """
    logger.info(f"Background task: Pre-warming cache for sheet '{sheet_name}'")
    try:
        # This will fetch fresh data and set it in Redis
        data = fetch_excel_from_github(sheet_name)
        logger.info(f"Successfully pre-warmed cache for '{sheet_name}'. Rows: {len(data)}")
        return {"status": "success", "rows": len(data)}
    except Exception as e:
        logger.error(f"Error in prewarm_cache task: {e}")
        return {"status": "error", "message": str(e)}

@celery_app.task(name="app.tasks.excel_tasks.clear_all_caches")
def clear_all_caches():
    """Task to clear Redis manually (can be triggered by admin)"""
    from app.cache.redis_client import redis_client
    redis_client.flush_all()
    logger.info("Background task: All Redis caches cleared")
    return {"status": "success"}
