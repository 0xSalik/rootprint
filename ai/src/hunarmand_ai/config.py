"""Centralised, validated configuration loaded from environment variables.

We deliberately use ``pydantic-settings`` so that:

* every config value has a type and a default,
* missing values for non-essential providers degrade gracefully (e.g. no
  Bhashini key just removes Bhashini from the ASR ladder),
* the same code runs locally, in CI, and in production with no branching.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        env_prefix="",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Application ────────────────────────────────────────────────────────
    env: Literal["development", "staging", "production", "test"] = Field(
        default="development", alias="HUNARMAND_ENV"
    )
    log_level: str = Field(default="INFO", alias="HUNARMAND_LOG_LEVEL")
    host: str = Field(default="0.0.0.0", alias="HUNARMAND_HOST")
    port: int = Field(default=8000, alias="HUNARMAND_PORT")
    cors_origins: str = Field(default="*", alias="HUNARMAND_CORS_ORIGINS")

    # ── Database ───────────────────────────────────────────────────────────
    database_url: str = Field(
        default="postgresql+asyncpg://hunarmand:hunarmand@localhost:5432/hunarmand",
        alias="HUNARMAND_DATABASE_URL",
    )

    # ── Sanad root key ────────────────────────────────────────────────────
    kek_secret: str = Field(default="dev-only-do-not-use-in-prod", alias="HUNARMAND_KEK_SECRET")

    # ── LLM ────────────────────────────────────────────────────────────────
    llm_provider: Literal["openai", "anthropic"] = Field(
        default="openai", alias="HUNARMAND_LLM_PROVIDER"
    )
    llm_model: str = Field(default="gpt-4o-2024-11-20", alias="HUNARMAND_LLM_MODEL")
    llm_temperature: float = Field(default=0.2, alias="HUNARMAND_LLM_TEMPERATURE")

    openai_api_key: str | None = Field(default=None, alias="OPENAI_API_KEY")
    openai_base_url: str | None = Field(default=None, alias="OPENAI_BASE_URL")
    anthropic_api_key: str | None = Field(default=None, alias="ANTHROPIC_API_KEY")

    # ── Embeddings ────────────────────────────────────────────────────────
    embedding_provider: Literal["openai"] = Field(
        default="openai", alias="HUNARMAND_EMBEDDING_PROVIDER"
    )
    embedding_model: str = Field(
        default="text-embedding-3-small", alias="HUNARMAND_EMBEDDING_MODEL"
    )
    embedding_dimensions: int = Field(default=1536, alias="HUNARMAND_EMBEDDING_DIMENSIONS")

    # ── ASR ────────────────────────────────────────────────────────────────
    asr_ladder: str = Field(
        default="bhashini,ai4bharat,whisper,manual", alias="HUNARMAND_ASR_LADDER"
    )
    asr_default_language: str = Field(default="ks", alias="HUNARMAND_ASR_DEFAULT_LANGUAGE")
    whisper_model: str = Field(default="whisper-1", alias="HUNARMAND_WHISPER_MODEL")

    bhashini_api_key: str | None = Field(default=None, alias="BHASHINI_API_KEY")
    bhashini_user_id: str | None = Field(default=None, alias="BHASHINI_USER_ID")
    bhashini_pipeline_id: str | None = Field(default=None, alias="BHASHINI_PIPELINE_ID")
    bhashini_inference_url: str = Field(
        default="https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline",
        alias="BHASHINI_INFERENCE_URL",
    )

    ai4bharat_inference_url: str | None = Field(default=None, alias="AI4BHARAT_INFERENCE_URL")
    ai4bharat_api_key: str | None = Field(default=None, alias="AI4BHARAT_API_KEY")
    ai4bharat_model: str = Field(default="ai4bharat/indicwhisper", alias="AI4BHARAT_MODEL")

    # ── Translation ────────────────────────────────────────────────────────
    translation_provider: Literal["openai", "bhashini", "none"] = Field(
        default="openai", alias="HUNARMAND_TRANSLATION_PROVIDER"
    )
    translation_model: str = Field(default="gpt-4o-mini", alias="HUNARMAND_TRANSLATION_MODEL")

    # ── RAG ────────────────────────────────────────────────────────────────
    rag_chunk_tokens: int = Field(default=320, alias="HUNARMAND_RAG_CHUNK_TOKENS")
    rag_chunk_overlap: int = Field(default=50, alias="HUNARMAND_RAG_CHUNK_OVERLAP")
    rag_top_k: int = Field(default=6, alias="HUNARMAND_RAG_TOP_K")
    rag_score_threshold: float = Field(default=0.32, alias="HUNARMAND_RAG_SCORE_THRESHOLD")
    rag_refuse_below: float = Field(default=0.28, alias="HUNARMAND_RAG_REFUSE_BELOW")

    # ── Sanad ──────────────────────────────────────────────────────────────
    sanad_base_url: str = Field(default="https://hunarmand.app/s", alias="HUNARMAND_SANAD_BASE_URL")
    sanad_verifier_key_version: str = Field(
        default="v1", alias="HUNARMAND_SANAD_VERIFIER_KEY_VERSION"
    )

    # ── Validators ────────────────────────────────────────────────────────
    @field_validator("asr_ladder")
    @classmethod
    def _validate_ladder(cls, v: str) -> str:
        allowed = {"bhashini", "ai4bharat", "whisper", "manual"}
        parts = [p.strip() for p in v.split(",") if p.strip()]
        bad = [p for p in parts if p not in allowed]
        if bad:
            raise ValueError(f"Unknown ASR providers: {bad}. Allowed: {sorted(allowed)}")
        return ",".join(parts)

    # ── Helpers ────────────────────────────────────────────────────────────
    @property
    def asr_ladder_list(self) -> list[str]:
        return [p.strip() for p in self.asr_ladder.split(",") if p.strip()]

    @property
    def cors_origins_list(self) -> list[str]:
        if self.cors_origins.strip() == "*":
            return ["*"]
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
