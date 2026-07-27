from app.tasks.celery_app import celery_app
from app.services.gemini_service import GeminiService
from app.core.config import get_settings
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import async_session, Professional
import pathlib
import asyncio

settings = get_settings()


def _run_async(coro):
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


async def _update_embedding(profile_id: int, embedding: list[float]):
    async with async_session() as db:
        result = await db.execute(select(Professional).where(Professional.id == profile_id))
        professional = result.scalar_one_or_none()
        if professional:
            professional.embedding = embedding
            await db.commit()


@celery_app.task(name="tasks.profile_processing.convert_profile")
def convert_profile(profile_data: dict):
    from app.services.markdown_converter import MarkdownConverter

    profile_id = profile_data.get("id")
    converter = MarkdownConverter()
    markdown = converter.convert_professional_to_markdown(profile_data)

    storage_path = pathlib.Path(settings.BACKEND_STORAGE_PATH) / "profiles"
    storage_path.mkdir(parents=True, exist_ok=True)

    file_path = storage_path / f"{profile_id}.md"
    file_path.write_text(markdown, encoding="utf-8")

    gemini = GeminiService()
    embedding = _run_async(gemini.generate_profile_embedding(markdown))

    if embedding and profile_id:
        _run_async(_update_embedding(int(profile_id), embedding))

    return {
        "status": "converted",
        "profile_id": profile_id,
        "markdown_path": str(file_path),
        "embedding_generated": embedding is not None,
    }
