from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    APP_NAME: str = "FoodTalent"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Auth
    SECRET_KEY: str = "change-me-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/foodtalent"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Gemini
    GEMINI_API_KEY: str = ""

    # YouTube
    YOUTUBE_API_KEY: str = ""

    # Google Custom Search
    GOOGLE_CSE_API_KEY: str = ""
    GOOGLE_CSE_ID: str = ""

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:5173", "https://foodtalent-five.vercel.app"]

    # Frontend URL for password reset links
    FRONTEND_URL: str = "http://localhost:3000"

    # Security
    RATE_LIMIT_GLOBAL: str = "60/minute"
    RATE_LIMIT_AUTH: str = "10/minute"
    CSP_DIRECTIVES: dict | None = None

    # Brevo API (for password reset emails)
    BREVO_API_KEY: str = ""
    BREVO_FROM_EMAIL: str = "alquimiafoods@proton.me"
    BREVO_FROM_NAME: str = "FoodTalent"
    NOTIFICATION_EMAIL: str = "alquimiafoods@proton.me"

    # SMTP (for password reset) - fallback if Brevo API not configured
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "noreply@foodtalent.com"

    # Storage
    BACKEND_STORAGE_PATH: str = "storage"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
