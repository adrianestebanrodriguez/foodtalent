"""Dispatch background tasks with or without Celery.

On platforms without workers (Vercel serverless) set TASKS_INLINE=true and
tasks run in-process via a threadpool. Elsewhere tasks are queued in Celery
as before, falling back to inline execution if the broker is unreachable.
"""

import asyncio
import logging
from typing import Any, Callable

from app.core.config import get_settings

logger = logging.getLogger(__name__)


async def dispatch(celery_task: Any, payload: Any) -> dict:
    """Queue ``celery_task`` with ``payload`` or run it inline."""
    settings = get_settings()

    if settings.TASKS_INLINE:
        return await run_inline(celery_task, payload)

    try:
        result = celery_task.delay(payload)
        task_id = getattr(result, "id", None)
        return {"task_id": task_id, "status": "queued"}
    except Exception as exc:
        logger.warning(f"Celery broker unreachable, running task inline: {exc}")
        return await run_inline(celery_task, payload)


async def run_inline(celery_task: Any, payload: Any) -> dict:
    """Run the task's sync function in a thread (no event loop there)."""
    func: Callable = getattr(celery_task, "run", celery_task)
    try:
        output = await asyncio.to_thread(func, payload)
    except Exception as exc:
        logger.error(f"Inline task failed: {exc}")
        return {"status": "error", "detail": str(exc)}
    if isinstance(output, dict):
        return {"status": "completed", **output}
    return {"status": "completed", "result": output}
