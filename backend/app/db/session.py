import asyncio
from datetime import datetime
import logging
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, JSON, Float, text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from pgvector.sqlalchemy import Vector
from app.core.config import get_settings

settings = get_settings()

database_url = settings.DATABASE_URL

# --- FIX: Forzar el dialecto asyncpg para evitar ModuleNotFoundError: No module named 'psycopg2' ---
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql+asyncpg://", 1)
elif database_url.startswith("postgresql://") and not database_url.startswith("postgresql+asyncpg://"):
    database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)

# Clean DATABASE_URL - remove sslmode, let asyncpg handle SSL via connect_args
if "sslmode=" in database_url:
    import re
    database_url = re.sub(r"[?&]sslmode=[^&]*", "", database_url)
    database_url = re.sub(r"\?&", "?", database_url).replace("&&", "&").replace("??", "?")

# Remove any existing ssl= parameter
if "ssl=" in database_url:
    import re
    database_url = re.sub(r"[?&]ssl=[^&]*", "", database_url)
    database_url = database_url.replace("??", "?").replace("?&", "?").replace("&&", "&")

# Log for debugging
logging.info(f"Processed DATABASE_URL: {database_url[:100]}...")

# Use connect_args to explicitly control SSL (bypasses connection string parsing)
engine = create_async_engine(
    database_url,
    echo=settings.DEBUG,
    connect_args={"ssl": "require"}
)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), default="")
    role: Mapped[str] = mapped_column(String(20), default="profesional")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    reset_token: Mapped[str] = mapped_column(String(255), nullable=True)
    reset_token_expires: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Professional(Base):
    __tablename__ = "professionals"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, nullable=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=True)
    avatar_url: Mapped[str] = mapped_column(String(500), nullable=True)
    whatsapp: Mapped[str] = mapped_column(String(20), nullable=True)

    # Structured data
    specialties: Mapped[list] = mapped_column(JSON, default=list)
    experience_years: Mapped[int] = mapped_column(Integer, default=0)
    availability: Mapped[str] = mapped_column(String(50), default="inmediata")
    hourly_rate: Mapped[str] = mapped_column(String(50), nullable=True)
    location: Mapped[str] = mapped_column(String(255), nullable=True)

    # New fields
    research_products: Mapped[list] = mapped_column(JSON, default=list)  # [{name, url}]
    last_experience: Mapped[dict] = mapped_column(JSON, nullable=True)  # {client, description, achievement}

    # Content
    summary: Mapped[str] = mapped_column(Text, default="")
    markdown_content: Mapped[str] = mapped_column(Text, default="")

    # Source tracking
    source: Mapped[str] = mapped_column(String(20), default="registered")  # registered | youtube | web
    sources: Mapped[list] = mapped_column(JSON, default=list)

    # Embedding for semantic search
    embedding = Column(Vector(768), nullable=True)

    # Metadata
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    rating: Mapped[float] = mapped_column(Float, default=0.0)
    projects_completed: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class SearchLog(Base):
    __tablename__ = "search_logs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    query: Mapped[str] = mapped_column(Text, nullable=False)
    results_count: Mapped[int] = mapped_column(Integer, default=0)
    top_match_name: Mapped[str] = mapped_column(String(255), nullable=True)
    top_match_percentage: Mapped[float] = mapped_column(Float, nullable=True)
    ip_address: Mapped[str] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


async def init_db():
    max_retries = 10
    base_delay = 2
    
    for attempt in range(max_retries):
        try:
            async with engine.begin() as conn:
                await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
                await conn.run_sync(Base.metadata.create_all)
            logging.info("Database initialized successfully")
            return
        except Exception as e:
            if attempt == max_retries - 1:
                logging.error(f"Failed to initialize database after {max_retries} attempts: {e}")
                raise
            delay = base_delay * (2 ** attempt)
            logging.warning(f"Database connection failed (attempt {attempt + 1}/{max_retries}), retrying in {delay}s: {e}")
            await asyncio.sleep(delay)