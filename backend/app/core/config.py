from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    PROJECT_NAME: str = "Hunarmand API"
    API_V1_STR: str = "/api/v1"

    # CORS — kept as a plain string to dodge pydantic-settings v2's
    # eager JSON-decode of complex types (List[AnyHttpUrl]) which
    # happens BEFORE field validators get a chance to split a comma-
    # separated value, surfacing as
    #   "error parsing value for field BACKEND_CORS_ORIGINS"
    # on Render / any deployment that passes the env var as
    # `https://a,https://b`.
    #
    # Accepts:
    #   * comma-separated:  https://app.vercel.app,http://localhost:3000
    #   * single origin:    https://app.vercel.app
    #   * wildcard:         *
    #   * JSON array:       ["https://app.vercel.app","http://localhost:3000"]
    # Read it via ``settings.cors_origins_list`` everywhere.
    BACKEND_CORS_ORIGINS: str = ""

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

    # ── Commerce (A2) ──────────────────────────────────────────────────────
    STRIPE_SECRET_KEY: str = "sk_test_mock_key_for_hackathon"

    # ── Helpers ────────────────────────────────────────────────────────────
    @property
    def cors_origins_list(self) -> list[str]:
        """Parse ``BACKEND_CORS_ORIGINS`` into the list FastAPI expects.

        Tolerant of every shape we've seen in the wild — comma-separated,
        single origin, wildcard, JSON array — so the operator can paste
        any reasonable value into the Render dashboard without thinking
        about quoting.
        """

        raw = (self.BACKEND_CORS_ORIGINS or "").strip()
        if not raw:
            return []
        if raw == "*":
            return ["*"]
        # JSON array form: ["a","b"]
        if raw.startswith("[") and raw.endswith("]"):
            import json

            try:
                parsed = json.loads(raw)
                if isinstance(parsed, list):
                    return [str(o).strip().rstrip("/") for o in parsed if str(o).strip()]
            except json.JSONDecodeError:
                pass  # fall through to comma split
        return [o.strip().rstrip("/") for o in raw.split(",") if o.strip()]


settings = Settings()
