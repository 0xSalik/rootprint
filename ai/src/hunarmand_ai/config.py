"""Centralised, validated configuration loaded from environment variables.

We deliberately use ``pydantic-settings`` so that:

* every config value has a type and a default,
* missing values for non-essential providers degrade gracefully (e.g. no
  Bhashini key just removes Bhashini from the ASR ladder),
* the same code runs locally, in CI, and in production with no branching.

Free-tier path (no paid services):

* ``HUNARMAND_LLM_PROVIDER=openrouter`` + ``OPENROUTER_API_KEY``
* ``HUNARMAND_ASR_LADDER=groq,whisper,manual`` + ``GROQ_API_KEY``
* ``HUNARMAND_EMBEDDING_PROVIDER=local``  (sentence-transformers,
  optionally swap to ``jina`` with ``JINA_API_KEY``)
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
    # Allowed providers:
    #   openai     -> OpenAI directly (paid)
    #   openrouter -> OpenRouter (https://openrouter.ai), supports many
    #                 free models like meta-llama/llama-3.3-70b-instruct:free
    #                 and google/gemini-2.0-flash-exp:free
    #   anthropic  -> Anthropic Claude (paid)
    llm_provider: Literal["openai", "openrouter", "anthropic"] = Field(
        default="openrouter", alias="HUNARMAND_LLM_PROVIDER"
    )
    llm_model: str = Field(
        default="meta-llama/llama-3.3-70b-instruct:free", alias="HUNARMAND_LLM_MODEL"
    )
    llm_temperature: float = Field(default=0.2, alias="HUNARMAND_LLM_TEMPERATURE")

    # Structured-output strategy. Many free OpenRouter models do not yet
    # support `{"type": "json_schema", ...}`; some only support
    # `{"type": "json_object"}`; a handful support neither. We pick a
    # sensible default per provider but expose this so a deployment can
    # opt up if their chosen model supports schema-mode.
    llm_structured_mode: Literal["auto", "schema", "json", "prompt"] = Field(
        default="auto", alias="HUNARMAND_LLM_STRUCTURED_MODE"
    )

    # OpenAI (paid baseline)
    openai_api_key: str | None = Field(default=None, alias="OPENAI_API_KEY")
    openai_base_url: str | None = Field(default=None, alias="OPENAI_BASE_URL")

    # OpenRouter (free + paid; OpenAI-compatible API)
    openrouter_api_key: str | None = Field(default=None, alias="OPENROUTER_API_KEY")
    openrouter_base_url: str = Field(
        default="https://openrouter.ai/api/v1", alias="OPENROUTER_BASE_URL"
    )
    openrouter_site_url: str = Field(
        default="https://hunarmand.app", alias="OPENROUTER_SITE_URL"
    )
    openrouter_app_name: str = Field(default="Hunarmand AI", alias="OPENROUTER_APP_NAME")

    # Anthropic
    anthropic_api_key: str | None = Field(default=None, alias="ANTHROPIC_API_KEY")

    # ── Embeddings ────────────────────────────────────────────────────────
    # Allowed providers:
    #   openai -> text-embedding-3-small (paid)
    #   jina   -> https://api.jina.ai/v1 (free tier with API key)
    #   local  -> sentence-transformers (no API; ships in `[local-embeddings]` extra)
    embedding_provider: Literal["openai", "jina", "local"] = Field(
        default="local", alias="HUNARMAND_EMBEDDING_PROVIDER"
    )
    embedding_model: str = Field(
        default="intfloat/multilingual-e5-small", alias="HUNARMAND_EMBEDDING_MODEL"
    )
    embedding_dimensions: int = Field(default=384, alias="HUNARMAND_EMBEDDING_DIMENSIONS")

    jina_api_key: str | None = Field(default=None, alias="JINA_API_KEY")
    jina_base_url: str = Field(default="https://api.jina.ai/v1", alias="JINA_BASE_URL")

    # ── ASR ────────────────────────────────────────────────────────────────
    # Allowed entries: bhashini, ai4bharat, groq, hf_inference, whisper, manual
    # (`groq` runs whisper-large-v3-turbo on the free tier;
    # `hf_inference` runs Whisper on HF's free Inference API
    # — uses the same HF account as the Space deployment, so no extra signup;
    # `whisper` here is the OpenAI Audio API, which is paid.)
    asr_ladder: str = Field(
        default="bhashini,ai4bharat,groq,hf_inference,whisper,manual",
        alias="HUNARMAND_ASR_LADDER",
    )
    asr_default_language: str = Field(default="ks", alias="HUNARMAND_ASR_DEFAULT_LANGUAGE")
    whisper_model: str = Field(default="whisper-1", alias="HUNARMAND_WHISPER_MODEL")

    # Groq (free tier, OpenAI-compatible API for Whisper).
    groq_api_key: str | None = Field(default=None, alias="GROQ_API_KEY")
    groq_base_url: str = Field(
        default="https://api.groq.com/openai/v1", alias="GROQ_BASE_URL"
    )
    groq_whisper_model: str = Field(
        default="whisper-large-v3-turbo", alias="HUNARMAND_GROQ_WHISPER_MODEL"
    )

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

    # Hugging Face Inference API — free Whisper (alternative to Groq).
    # https://huggingface.co/settings/tokens — read-only token is enough.
    hf_api_token: str | None = Field(default=None, alias="HF_API_TOKEN")
    hf_inference_base_url: str = Field(
        default="https://api-inference.huggingface.co/models",
        alias="HF_INFERENCE_BASE_URL",
    )
    hf_whisper_model: str = Field(
        default="openai/whisper-large-v3", alias="HUNARMAND_HF_WHISPER_MODEL"
    )

    # ── Translation ────────────────────────────────────────────────────────
    translation_provider: Literal["llm", "bhashini", "none"] = Field(
        default="llm", alias="HUNARMAND_TRANSLATION_PROVIDER"
    )
    translation_model: str | None = Field(
        default=None,
        alias="HUNARMAND_TRANSLATION_MODEL",
        description=(
            "Model to use for LLM translation. Defaults to ``llm_model`` if not set, "
            "so the free-tier path uses the same OpenRouter model for both."
        ),
    )

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
        allowed = {"bhashini", "ai4bharat", "groq", "hf_inference", "whisper", "manual"}
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

    @property
    def effective_translation_model(self) -> str:
        return self.translation_model or self.llm_model


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
