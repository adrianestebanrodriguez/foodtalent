from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.tasks.convert_profile import convert_profile
from app.tasks.ingest_youtube import ingest_youtube
from app.tasks.ingest_web import ingest_web
from app.api.routes.auth import get_current_active_user
from app.db.session import User

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


@router.post("/convert-profile")
async def trigger_convert_profile(
    profile_data: dict,
    current_user: User = Depends(get_current_active_user),
):
    task = convert_profile.delay(profile_data)
    return {"task_id": task.id, "status": "queued"}


@router.post("/ingest-youtube")
async def trigger_ingest_youtube(
    queries: list[str] = [],
    current_user: User = Depends(get_current_active_user),
):
    task = ingest_youtube.delay(queries if queries else None)
    return {"task_id": task.id, "status": "queued"}


@router.post("/ingest-web")
async def trigger_ingest_web(
    queries: list[str] = [],
    current_user: User = Depends(get_current_active_user),
):
    task = ingest_web.delay(queries if queries else None)
    return {"task_id": task.id, "status": "queued"}
