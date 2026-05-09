"""Provider-agnostic async LLM and embedding client.

Supported chat-completion providers (configured via ``HUNARMAND_LLM_PROVIDER``):

* ``openai``     – OpenAI directly.
* ``openrouter`` – OpenRouter (free + paid; OpenAI-compatible API).
                   Recommended free models for the hackathon team:
                     * ``meta-llama/llama-3.3-70b-instruct:free``
                     * ``google/gemini-2.0-flash-exp:free``
                     * ``deepseek/deepseek-chat:free``
                     * ``qwen/qwen-2.5-72b-instruct:free``
                     * ``nousresearch/hermes-3-llama-3.1-405b:free``
* ``anthropic``  – Anthropic Claude (paid).

For Whisper ASR we expose two clients:
* ``transcribe`` – uses OpenAI directly (paid).
* ``transcribe_groq`` – uses Groq's free Whisper (whisper-large-v3-turbo).

All chat calls use a unified ``generate()`` so callers do not branch.
"""

from __future__ import annotations

from typing import Any

import structlog
from tenacity import (
    AsyncRetrying,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential_jitter,
)

from ..config import Settings, get_settings

log = structlog.get_logger(__name__)


class LLMClient:
    """Unified async wrapper over OpenAI / OpenRouter / Anthropic SDKs."""

    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        self._openai = self._build_openai()
        self._openrouter = self._build_openrouter()
        self._anthropic = self._build_anthropic()
        self._groq = self._build_groq()

    # ── Lazy SDK construction ────────────────────────────────────────────
    def _build_openai(self) -> Any | None:
        if not self.settings.openai_api_key:
            return None
        from openai import AsyncOpenAI

        return AsyncOpenAI(
            api_key=self.settings.openai_api_key,
            base_url=self.settings.openai_base_url or None,
        )

    def _build_openrouter(self) -> Any | None:
        if not self.settings.openrouter_api_key:
            return None
        from openai import AsyncOpenAI

        return AsyncOpenAI(
            api_key=self.settings.openrouter_api_key,
            base_url=self.settings.openrouter_base_url,
            default_headers={
                # OpenRouter recommends these for analytics / leaderboard
                # placement and to avoid being rate-limited as anonymous.
                "HTTP-Referer": self.settings.openrouter_site_url,
                "X-Title": self.settings.openrouter_app_name,
            },
        )

    def _build_anthropic(self) -> Any | None:
        if not self.settings.anthropic_api_key:
            return None
        from anthropic import AsyncAnthropic

        return AsyncAnthropic(api_key=self.settings.anthropic_api_key)

    def _build_groq(self) -> Any | None:
        if not self.settings.groq_api_key:
            return None
        from openai import AsyncOpenAI

        return AsyncOpenAI(
            api_key=self.settings.groq_api_key,
            base_url=self.settings.groq_base_url,
        )

    # ── Provider helpers ─────────────────────────────────────────────────
    @property
    def provider(self) -> str:
        return self.settings.llm_provider

    def _chat_client(self) -> tuple[Any, str]:
        """Return (sdk_client, kind) where kind is 'openai_compat' or 'anthropic'."""

        if self.provider == "openai":
            if not self._openai:
                raise RuntimeError(
                    "HUNARMAND_LLM_PROVIDER=openai but OPENAI_API_KEY is not set."
                )
            return self._openai, "openai_compat"
        if self.provider == "openrouter":
            if not self._openrouter:
                raise RuntimeError(
                    "HUNARMAND_LLM_PROVIDER=openrouter but OPENROUTER_API_KEY is not set. "
                    "Get a free key at https://openrouter.ai/keys"
                )
            return self._openrouter, "openai_compat"
        if self.provider == "anthropic":
            if not self._anthropic:
                raise RuntimeError(
                    "HUNARMAND_LLM_PROVIDER=anthropic but ANTHROPIC_API_KEY is not set."
                )
            return self._anthropic, "anthropic"
        raise RuntimeError(f"Unsupported LLM provider: {self.provider}")

    def _require_groq(self) -> Any:
        if not self._groq:
            raise RuntimeError(
                "GROQ_API_KEY is not configured — Groq Whisper unavailable. "
                "Get a free key at https://console.groq.com/keys"
            )
        return self._groq

    def _require_openai_audio(self) -> Any:
        if not self._openai:
            raise RuntimeError(
                "OPENAI_API_KEY is not set — OpenAI Whisper unavailable."
            )
        return self._openai

    # ── Retry wrapper ────────────────────────────────────────────────────
    @staticmethod
    def _retrying() -> AsyncRetrying:
        return AsyncRetrying(
            stop=stop_after_attempt(4),
            wait=wait_exponential_jitter(initial=1.0, max=8.0),
            retry=retry_if_exception_type(Exception),
            reraise=True,
        )

    # ── Plain text completion ────────────────────────────────────────────
    async def generate(
        self,
        *,
        system: str,
        messages: list[dict[str, str]],
        model: str | None = None,
        temperature: float | None = None,
        max_tokens: int = 1024,
        response_format: dict | None = None,
    ) -> str:
        """Return the assistant's text answer to a chat request."""

        model = model or self.settings.llm_model
        temperature = temperature if temperature is not None else self.settings.llm_temperature
        client, kind = self._chat_client()

        async for attempt in self._retrying():
            with attempt:
                if kind == "openai_compat":
                    kwargs: dict[str, Any] = {
                        "model": model,
                        "messages": [{"role": "system", "content": system}, *messages],
                        "temperature": temperature,
                        "max_tokens": max_tokens,
                    }
                    if response_format:
                        kwargs["response_format"] = response_format
                    resp = await client.chat.completions.create(**kwargs)
                    return resp.choices[0].message.content or ""

                if kind == "anthropic":
                    resp = await client.messages.create(
                        model=model,
                        system=system,
                        messages=messages,
                        temperature=temperature,
                        max_tokens=max_tokens,
                    )
                    parts = [p.text for p in resp.content if getattr(p, "type", None) == "text"]
                    return "".join(parts)

                raise RuntimeError(f"Unsupported chat kind: {kind}")

        raise RuntimeError("Unreachable: tenacity exhausted attempts")

    # ── Embeddings (legacy compatibility) ────────────────────────────────
    async def embed(self, texts: list[str]) -> list[list[float]]:
        """Embed via OpenAI directly.

        Note: prefer ``hunarmand_ai.rag.embedder.Embedder`` which routes to
        the configured embedding provider (OpenAI, Jina, or local).
        """

        if not texts:
            return []
        if not self._openai:
            raise RuntimeError("OPENAI_API_KEY not configured for OpenAI embeddings.")
        async for attempt in self._retrying():
            with attempt:
                resp = await self._openai.embeddings.create(
                    model=self.settings.embedding_model,
                    input=texts,
                    dimensions=self.settings.embedding_dimensions,
                )
                return [d.embedding for d in resp.data]
        raise RuntimeError("Unreachable")

    # ── Whisper (OpenAI direct) ──────────────────────────────────────────
    async def transcribe(
        self,
        *,
        audio_path: str,
        language: str | None = None,
        prompt: str | None = None,
    ) -> dict[str, Any]:
        client = self._require_openai_audio()
        async for attempt in self._retrying():
            with attempt:
                with open(audio_path, "rb") as fh:
                    resp = await client.audio.transcriptions.create(
                        model=self.settings.whisper_model,
                        file=fh,
                        language=language,
                        prompt=prompt,
                        response_format="verbose_json",
                        timestamp_granularities=["segment"],
                    )
                if hasattr(resp, "model_dump"):
                    return resp.model_dump()
                return dict(resp)
        raise RuntimeError("Unreachable")

    # ── Whisper (Groq, free tier) ────────────────────────────────────────
    async def transcribe_groq(
        self,
        *,
        audio_path: str,
        language: str | None = None,
        prompt: str | None = None,
    ) -> dict[str, Any]:
        client = self._require_groq()
        async for attempt in self._retrying():
            with attempt:
                with open(audio_path, "rb") as fh:
                    resp = await client.audio.transcriptions.create(
                        model=self.settings.groq_whisper_model,
                        file=fh,
                        language=language,
                        prompt=prompt,
                        response_format="verbose_json",
                        timestamp_granularities=["segment"],
                    )
                if hasattr(resp, "model_dump"):
                    return resp.model_dump()
                return dict(resp)
        raise RuntimeError("Unreachable")


_singleton: LLMClient | None = None


def get_llm_client() -> LLMClient:
    global _singleton
    if _singleton is None:
        _singleton = LLMClient()
    return _singleton
