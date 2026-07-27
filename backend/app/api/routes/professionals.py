from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import pathlib
from app.db.session import Professional, get_db
from app.models.schemas import ProfessionalCreate, ProfessionalResponse
from app.services.markdown_converter import MarkdownConverter
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

    convert_profile_task.delay(profile_data)

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

    convert_profile_task.delay(profile_data)

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
