from celery import Celery
from app.core.config import get_settings

settings = get_settings()

celery_app = Celery(
    "foodtalent",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL.replace("/0", "/1"),
)

celery_app.conf.task_routes = {
    "tasks.profile_processing.*": {"queue": "profile_processing"},
    "tasks.search_processing.*": {"queue": "search_processing"},
    "tasks.youtube_ingestion.*": {"queue": "youtube_ingestion"},
    "tasks.web_ingestion.*": {"queue": "web_ingestion"},
}

celery_app.conf.beat_schedule = {
    "ingest-youtube-weekly": {
        "task": "tasks.ingest_youtube",
        "schedule": 604800.0,  # 7 days
    },
    "ingest-web-weekly": {
        "task": "tasks.ingest_web",
        "schedule": 604800.0,
    },
}

from app.tasks import convert_profile, ingest_youtube, ingest_web
