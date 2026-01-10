from celery import Celery
import os
import logging

logger = logging.getLogger(__name__)

# Redis URL for Celery broker and backend
redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Initialize Celery
celery_app = Celery(
    "rudraram_tasks",
    broker=redis_url,
    backend=redis_url,
    include=["app.tasks.excel_tasks"]
)

# Optional configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    worker_prefetch_multiplier=1
)

if __name__ == "__main__":
    celery_app.start()
