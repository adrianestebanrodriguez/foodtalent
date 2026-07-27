from pydantic import BaseModel, EmailStr
from datetime import datetime


class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str = ""
    role: str = "profesional"


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str = "profesional"


class ProfessionalCreate(BaseModel):
    name: str
    email: str | None = None
    whatsapp: str | None = None
    specialties: list[str] = []
    experience_years: int = 0
    availability: str = "inmediata"
    hourly_rate: str | None = None
    location: str | None = None
    summary: str = ""
    research_products: list[dict] = []  # [{name, url}]
    last_experience: dict | None = None  # {client, description, achievement}


class ProfessionalResponse(BaseModel):
    id: int
    name: str
    email: str | None
    avatar_url: str | None
    whatsapp: str | None = None
    specialties: list[str]
    experience_years: int
    availability: str
    hourly_rate: str | None
    location: str | None
    summary: str
    markdown_content: str
    source: str
    sources: list[str]
    is_verified: bool
    rating: float
    projects_completed: int
    research_products: list[dict] = []
    last_experience: dict | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class SearchRequest(BaseModel):
    query: str
    category: str | None = None
    max_results: int = 5


class MatchResult(BaseModel):
    professional_id: int
    name: str
    match_percentage: float
    nivel_match: str = "Match posible"
    explanation: str
    source: str
    avatar_url: str | None = None
    specialties: list[str] = []
    experience_years: int = 0
    location: str | None = None
    video_url: str | None = None
    article_url: str | None = None
    channel_name: str | None = None
    site_name: str | None = None
