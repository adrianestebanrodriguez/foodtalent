from app.tasks.celery_app import celery_app
from app.services.web_scraper import WebScraper
from app.services.gemini_service import GeminiService
import asyncio


def _run_async(coro):
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task(name="tasks.web_ingestion.ingest_web")
def ingest_web(queries: list[str] = None):
    if not queries:
        queries = [
            "experto alimentos Colombia",
            "consultor alimentos funcionales",
            "especialista regulacion INVIMA",
        ]

    scraper = WebScraper()
    gemini = GeminiService()

    results = []
    for query in queries:
        articles = _run_async(scraper.search_articles(query, limit=5))

        for article in articles:
            content = _run_async(scraper.extract_content(article["url"]))
            if content:
                experts = _run_async(gemini.identify_experts_from_content(content))
                for expert in experts:
                    expert["web_source"] = {
                        "url": article["url"],
                        "title": article["title"],
                    }
                    results.append(expert)

    return {"status": "completed", "experts_found": len(results), "experts": results}
