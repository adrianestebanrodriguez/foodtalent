from app.tasks.celery_app import celery_app
from app.services.youtube_service import YouTubeService
from app.services.gemini_service import GeminiService
import asyncio


def _run_async(coro):
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task(name="tasks.youtube_ingestion.ingest_youtube")
def ingest_youtube(queries: list[str] = None):
    if not queries:
        queries = [
            "formulacion alimentos",
            "procesos alimentarios",
            "normativa INVIMA",
            "HACCP alimentos",
            "innovacion alimentos",
        ]

    youtube = YouTubeService()
    gemini = GeminiService()

    results = []
    for query in queries:
        videos = youtube.search_food_experts(query, max_results=5)

        for video in videos:
            transcript = youtube.get_transcript(video["video_id"])
            if transcript:
                experts = _run_async(gemini.identify_experts_from_content(transcript))
                for expert in experts:
                    expert["youtube_source"] = {
                        "video_id": video["video_id"],
                        "channel": video["channel_title"],
                        "title": video["title"],
                    }
                    results.append(expert)

    return {"status": "completed", "experts_found": len(results), "experts": results}
