import asyncio
import smtplib
from datetime import datetime
from email.mime.text import MIMEText
import httpx
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db, Professional, SearchLog
from app.models.schemas import SearchRequest, MatchResult
from app.services.gemini_service import GeminiService
from app.services.vector_store import VectorStore
from app.services.youtube_service import YouTubeService
from app.services.food_industry_scraper import FoodIndustryScraper
from app.core.config import get_settings

settings = get_settings()

router = APIRouter(prefix="/api/search", tags=["search"])


def _nivel_match(porcentaje: float) -> str:
    if porcentaje >= 80:
        return "Match alto"
    if porcentaje >= 60:
        return "Match relevante"
    return "Match posible"


async def _search_youtube(youtube: YouTubeService, query: str, gemini: GeminiService) -> list[dict]:
    try:
        print(f"[YouTube] Buscando videos de expertos en industria alimentaria: {query}", flush=True)
        loop = asyncio.get_event_loop()
        videos = await loop.run_in_executor(None, youtube.search_food_experts, query, 10)
        print(f"[YouTube] Videos encontrados (filtrados): {len(videos)}", flush=True)

        experts = []
        seen_channels = set()

        for video in videos[:5]:
            channel = video.get("channel_title", "")
            if channel in seen_channels:
                continue
            seen_channels.add(channel)

            print(f"[YouTube] Canal: {channel} - {video['title']}", flush=True)

            expert_data = {
                "id": hash(channel) % 100000,
                "name": channel,
                "email": None,
                "avatar_url": None,
                "summary": f"Experto en industria alimentaria. Video: {video['title']}",
                "specialties": ["industria alimentaria"],
                "experience_years": 0,
                "availability": "a coordinar",
                "location": None,
                "source": "youtube",
                "sources": ["youtube"],
                "markdown_content": f"Canal de YouTube: {channel}\nVideo: {video['title']}\nDescripcion: {video.get('description', '')[:500]}\nURL: https://youtube.com/watch?v={video['video_id']}",
                "is_verified": False,
                "rating": 0.0,
                "similarity": 0.4,
                "video_url": f"https://youtube.com/watch?v={video['video_id']}",
                "channel_name": channel,
            }
            experts.append(expert_data)

        print(f"[YouTube] Total expertos: {len(experts)}", flush=True)
        return experts
    except Exception as e:
        print(f"[YouTube] Error: {e}", flush=True)
        return []


async def _search_web(scraper: FoodIndustryScraper, query: str) -> list[dict]:
    try:
        print(f"[Web] Buscando expertos en sitios de industria alimentaria: {query}", flush=True)
        experts = await scraper.search_experts(query)
        print(f"[Web] Total expertos web: {len(experts)}", flush=True)
        return experts
    except Exception as e:
        print(f"[Web] Error: {e}", flush=True)
        return []


@router.post("", response_model=list[MatchResult])
async def search_professionals(
    request: SearchRequest,
    http_request: Request,
    db: AsyncSession = Depends(get_db),
):
    print(f"[Search] Nueva busqueda: '{request.query}'", flush=True)

    gemini = GeminiService()
    vector_store = VectorStore(db)
    youtube = YouTubeService()
    web_scraper = FoodIndustryScraper()

    query_embedding = await gemini.generate_embedding(request.query)

    local_task = vector_store.search_similar(
        embedding=query_embedding,
        limit=20,
        filters={"category": request.category} if request.category else None,
    )
    youtube_task = _search_youtube(youtube, request.query, gemini)
    web_task = _search_web(web_scraper, request.query)

    local_candidates, youtube_experts, web_experts = await asyncio.gather(
        local_task, youtube_task, web_task
    )

    print(f"[Search] Local: {len(local_candidates)}, YouTube: {len(youtube_experts)}, Web: {len(web_experts)}", flush=True)

    candidate_ids = {c["id"] for c in local_candidates}

    all_profs = await db.execute(select(Professional).limit(50))
    for p in all_profs.scalars().all():
        if p.id not in candidate_ids:
            local_candidates.append(
                {
                    "id": p.id,
                    "name": p.name,
                    "email": p.email,
                    "avatar_url": p.avatar_url,
                    "summary": p.summary,
                    "specialties": p.specialties or [],
                    "experience_years": p.experience_years,
                    "availability": p.availability,
                    "hourly_rate": p.hourly_rate,
                    "location": p.location,
                    "source": p.source,
                    "sources": p.sources or [],
                    "markdown_content": p.markdown_content,
                    "is_verified": p.is_verified,
                    "rating": p.rating,
                    "research_products": p.research_products or [],
                    "last_experience": p.last_experience,
                    "similarity": 0.0,
                }
            )

    all_candidates = local_candidates + youtube_experts + web_experts
    print(f"[Search] Total candidatos para reranking: {len(all_candidates)}", flush=True)

    results = await gemini.rerank_and_explain(
        query=request.query,
        candidates=all_candidates,
        max_results=request.max_results,
    )

    print(f"[Search] Resultados finales: {len(results)}", flush=True)

    await web_scraper.close()

    match_results = [
        MatchResult(
            professional_id=r["professional_id"],
            name=r["name"],
            match_percentage=r["match_percentage"],
            nivel_match=r.get("nivel_match", _nivel_match(r["match_percentage"])),
            explanation=r["explanation"],
            source=r["source"],
            avatar_url=r.get("avatar_url"),
            specialties=r.get("specialties", []),
            experience_years=r.get("experience_years", 0),
            location=r.get("location"),
            video_url=r.get("video_url"),
            article_url=r.get("article_url"),
            channel_name=r.get("channel_name"),
            site_name=r.get("site_name"),
        )
        for r in results
    ]

    try:
        top = results[0] if results else None
        log_entry = SearchLog(
            query=request.query,
            results_count=len(results),
            top_match_name=top["name"] if top else None,
            top_match_percentage=top["match_percentage"] if top else None,
            ip_address=http_request.client.host if http_request.client else None,
            user_agent=http_request.headers.get("user-agent"),
        )
        db.add(log_entry)
        await db.commit()
    except Exception as e:
        print(f"[Search] Error logging search: {e}", flush=True)

    try:
        top_match_text = (
            f"{top['name']} ({top['match_percentage']}%)" if top else "Sin resultados"
        )
        subject = f"Nueva busqueda en FoodTalent: {request.query[:80]}"
        text_body = (
            f"Alguien busco en FoodTalent:\n\n"
            f"Query: {request.query}\n"
            f"Resultados: {len(results)}\n"
            f"Top match: {top_match_text}\n\n"
            f"IP: {http_request.client.host if http_request.client else 'N/A'}\n"
            f"Fecha: {datetime.utcnow()}"
        )
        if settings.BREVO_API_KEY:
            async with httpx.AsyncClient(timeout=10) as client:
                await client.post(
                    "https://api.brevo.com/v3/smtp/email",
                    headers={
                        "api-key": settings.BREVO_API_KEY,
                        "Content-Type": "application/json",
                    },
                    json={
                        "sender": {"email": settings.BREVO_FROM_EMAIL, "name": settings.BREVO_FROM_NAME},
                        "to": [{"email": settings.BREVO_FROM_EMAIL}],
                        "subject": subject,
                        "textContent": text_body,
                    },
                )
        elif settings.SMTP_HOST and settings.SMTP_PASSWORD:
            msg = MIMEText(text_body, "plain", "utf-8")
            msg["Subject"] = subject
            msg["From"] = settings.SMTP_FROM_EMAIL
            msg["To"] = settings.BREVO_FROM_EMAIL
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.send_message(msg)
    except Exception as e:
        print(f"[Search] Error sending notification: {e}", flush=True)

    return match_results
