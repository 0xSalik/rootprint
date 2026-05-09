from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Union, Optional
from pydantic import AnyHttpUrl, field_validator


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    PROJECT_NAME: str = "Hunarmand API"
    API_V1_STR: str = "/api/v1"

    # CORS
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = []

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    # ── Postgres ────────────────────────────────────────────────────────────
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "hunarmand_db"
    POSTGRES_PORT: str = "5432"

    # Optional explicit DATABASE_URL — preferred over the discrete fields.
    # On Neon: rewrite the pooled connection string from `postgresql://...`
    # to `postgresql+asyncpg://...` and drop `?sslmode=require` (asyncpg
    # uses `ssl`, not `sslmode`).
    HUNARMAND_DATABASE_URL: Optional[str] = None

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        if self.HUNARMAND_DATABASE_URL:
            return self.HUNARMAND_DATABASE_URL
        if self.POSTGRES_PASSWORD:
            return (
                f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
                f"@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
            )
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}"
            f"@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    # ── Auth ────────────────────────────────────────────────────────────────
    SECRET_KEY: str = "CHANGE_ME_IN_PRODUCTION"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # ── S3 / Cloudflare R2 ─────────────────────────────────────────────────
    S3_BUCKET: str = "hunarmand-vault"
    S3_ENDPOINT_URL: str = ""
    S3_ACCESS_KEY: str = ""
    S3_SECRET_KEY: str = ""

    # ── AI core (deployed elsewhere — typically the HF Space) ──────────────
    AI_CORE_URL: str = "http://localhost:8001"
    AI_CORE_TOKEN: Optional[str] = None  # forwarded as Bearer if set

    # Vector dimension — MUST match the AI core embedder's output.
    # Default 384 corresponds to intfloat/multilingual-e5-small.
    HUNARMAND_EMBEDDING_DIMENSIONS: int = 384

    # ── Background tasks ────────────────────────────────────────────────────
    RUN_INLINE_TASKS: bool = True
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"

    # ── Misc ────────────────────────────────────────────────────────────────
    HUNARMAND_LOG_LEVEL: str = "INFO"

    # Legacy/compat — kept so we don't break older .env files.
    OPENAI_API_KEY: str = ""


settings = Settings()
