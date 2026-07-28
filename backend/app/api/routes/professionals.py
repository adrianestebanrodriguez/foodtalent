import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response as FastAPIResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import pathlib
from app.db.session import Professional, get_db
from app.models.schemas import ProfessionalCreate, ProfessionalResponse
from app.services.markdown_converter import MarkdownConverter
from app.services.gemini_service import GeminiService
from app.api.deps import require_role, get_current_user
from app.db.session import User
from app.core.config import get_settings
from app.tasks.convert_profile import convert_profile as convert_profile_task

router = APIRouter(prefix="/api/professionals", tags=["professionals"])


@router.post("", response_model=ProfessionalResponse)
async def create_professional(
    data: ProfessionalCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("profesional")),
):
    professional = Professional(
        user_id=current_user.id,
        name=data.name,
        email=data.email,
        specialties=data.specialties,
        experience_years=data.experience_years,
        availability=data.availability,
        hourly_rate=data.hourly_rate,
        location=data.location,
        summary=data.summary,
        whatsapp=data.whatsapp,
        research_products=data.research_products or [],
        last_experience=data.last_experience,
        source="registered",
    )

    db.add(professional)
    await db.commit()
    await db.refresh(professional)

    profile_data = {
        "id": professional.id,
        "name": professional.name,
        "email": professional.email or "",
        "specialties": professional.specialties or [],
        "experience_years": professional.experience_years,
        "availability": professional.availability,
        "hourly_rate": professional.hourly_rate or "",
        "location": professional.location or "",
        "summary": professional.summary or "",
        "research_products": professional.research_products or [],
        "last_experience": professional.last_experience,
        "source": "registered",
    }

    converter = MarkdownConverter()
    professional.markdown_content = converter.convert_professional_to_markdown(profile_data)

    await db.commit()
    await db.refresh(professional)

    try:
        gemini = GeminiService()
        embedding = await gemini.generate_profile_embedding(professional.markdown_content)
        if embedding:
            professional.embedding = embedding
            await db.commit()
    except Exception as e:
        print(f"Error generating embedding: {e}")

    try:
        convert_profile_task.delay(profile_data)
    except Exception as e:
        print(f"Error queuing Celery task: {e}")

    return professional


@router.put("/{professional_id}", response_model=ProfessionalResponse)
async def update_professional(
    professional_id: int,
    data: ProfessionalCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("profesional")),
):
    result = await db.execute(select(Professional).where(Professional.id == professional_id))
    professional = result.scalar_one_or_none()
    if not professional:
        raise HTTPException(status_code=404, detail="Profesional no encontrado")

    for field in ("name", "email", "specialties", "experience_years", "availability",
                  "hourly_rate", "location", "summary", "research_products", "last_experience"):
        setattr(professional, field, getattr(data, field))

    profile_data = {
        "id": professional.id,
        "name": professional.name,
        "email": professional.email or "",
        "specialties": professional.specialties or [],
        "experience_years": professional.experience_years,
        "availability": professional.availability,
        "hourly_rate": professional.hourly_rate or "",
        "location": professional.location or "",
        "summary": professional.summary or "",
        "research_products": professional.research_products or [],
        "last_experience": professional.last_experience,
        "source": "registered",
    }

    converter = MarkdownConverter()
    professional.markdown_content = converter.convert_professional_to_markdown(profile_data)

    await db.commit()
    await db.refresh(professional)

    try:
        gemini = GeminiService()
        embedding = await gemini.generate_profile_embedding(professional.markdown_content)
        if embedding:
            professional.embedding = embedding
            await db.commit()
    except Exception as e:
        print(f"Error generating embedding: {e}")

    try:
        convert_profile_task.delay(profile_data)
    except Exception as e:
        print(f"Error queuing Celery task: {e}")

    return professional


@router.get("/me", response_model=ProfessionalResponse)
async def get_my_professional(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("profesional")),
):
    result = await db.execute(
        select(Professional).where(Professional.user_id == current_user.id)
    )
    professional = result.scalar_one_or_none()
    if not professional:
        raise HTTPException(status_code=404, detail="Perfil profesional no encontrado")
    return professional


@router.get("", response_model=list[ProfessionalResponse])
async def list_professionals(
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Professional).offset(skip).limit(limit)
    )
    return result.scalars().all()


@router.get("/{professional_id}", response_model=ProfessionalResponse)
async def get_professional(
    professional_id: int,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Professional).where(Professional.id == professional_id)
    )
    professional = result.scalar_one_or_none()

    if not professional:
        raise HTTPException(status_code=404, detail="Profesional no encontrado")

    return professional


@router.get("/{professional_id}/markdown")
async def get_professional_markdown(
    professional_id: int,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Professional).where(Professional.id == professional_id))
    professional = result.scalar_one_or_none()
    if not professional:
        raise HTTPException(status_code=404, detail="Profesional no encontrado")
    if not professional.markdown_content:
        raise HTTPException(status_code=404, detail="Markdown no disponible")

    return {"markdown": professional.markdown_content}


@router.get("/export/json")
async def export_professionals_json(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Solo administradores pueden exportar datos")

    result = await db.execute(select(Professional).order_by(Professional.id))
    professionals = result.scalars().all()

    data = []
    for p in professionals:
        data.append(
            {
                "id": p.id,
                "user_id": p.user_id,
                "name": p.name,
                "email": p.email,
                "avatar_url": p.avatar_url,
                "whatsapp": p.whatsapp,
                "specialties": p.specialties,
                "experience_years": p.experience_years,
                "availability": p.availability,
                "hourly_rate": p.hourly_rate,
                "location": p.location,
                "research_products": p.research_products,
                "last_experience": p.last_experience,
                "summary": p.summary,
                "markdown_content": p.markdown_content,
                "source": p.source,
                "sources": p.sources,
                "is_verified": p.is_verified,
                "rating": p.rating,
                "projects_completed": p.projects_completed,
                "created_at": p.created_at.isoformat() if p.created_at else None,
                "updated_at": p.updated_at.isoformat() if p.updated_at else None,
            }
        )

    json_bytes = json.dumps(data, ensure_ascii=False, indent=2).encode("utf-8")

    return FastAPIResponse(
        content=json_bytes,
        media_type="application/json",
        headers={
            "Content-Disposition": f'attachment; filename="foodtalent_professionals_backup_{datetime.utcnow().strftime("%Y%m%d")}.json"',
        },
    )
