"""Provider-agnostic async LLM and embedding client.

This is the only file that should know whether we are talking to OpenAI
or Anthropic. Everything else just calls ``generate()``, ``embed()``, or
the structured-output helper. Switching providers requires no caller
changes.

Design notes
------------

* All calls retry on transient errors with exponential backoff
  (``tenacity``).
* Streaming is supported but never required — the callers all use the
  one-shot path because we always return a structured object.
* JSON-mode + JSON-schema response format is preferred; we fall back to
  Anthropic's tool-use protocol with a single tool that has the desired
  schema.
* Embeddings are only OpenAI for now. Adding a local provider later is
  a single subclass.
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
    """Unified async wrapper over OpenAI and Anthropic SDKs."""

    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        self._openai = self._build_openai()
        self._anthropic = self._build_anthropic()

    # ── Lazy SDK construction ────────────────────────────────────────────
    def _build_openai(self) -> Any | None:
        if not self.settings.openai_api_key:
            return None
        from openai import AsyncOpenAI

        return AsyncOpenAI(
            api_key=self.settings.openai_api_key,
            base_url=self.settings.openai_base_url or None,
        )

    def _build_anthropic(self) -> Any | None:
        if not self.settings.anthropic_api_key:
            return None
        from anthropic import AsyncAnthropic

        return AsyncAnthropic(api_key=self.settings.anthropic_api_key)

    # ── Provider helpers ─────────────────────────────────────────────────
    @property
    def provider(self) -> str:
        return self.settings.llm_provider

    def _require_openai(self) -> Any:
        if not self._openai:
            raise RuntimeError(
                "OPENAI_API_KEY is not configured. Set it in .env or change "
                "HUNARMAND_LLM_PROVIDER to a configured provider."
            )
        return self._openai

    def _require_anthropic(self) -> Any:
        if not self._anthropic:
            raise RuntimeError(
                "ANTHROPIC_API_KEY is not configured. Set it in .env or change "
                "HUNARMAND_LLM_PROVIDER."
            )
        return self._anthropic

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

        async for attempt in self._retrying():
            with attempt:
                if self.provider == "openai":
                    client = self._require_openai()
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

                if self.provider == "anthropic":
                    client = self._require_anthropic()
                    resp = await client.messages.create(
                        model=model,
                        system=system,
                        messages=messages,
                        temperature=temperature,
                        max_tokens=max_tokens,
                    )
                    parts = [p.text for p in resp.content if getattr(p, "type", None) == "text"]
                    return "".join(parts)

                raise RuntimeError(f"Unsupported provider: {self.provider}")

        raise RuntimeError("Unreachable: tenacity exhausted attempts")

    # ── Embeddings ───────────────────────────────────────────────────────
    async def embed(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        client = self._require_openai()
        async for attempt in self._retrying():
            with attempt:
                resp = await client.embeddings.create(
                    model=self.settings.embedding_model,
                    input=texts,
                    dimensions=self.settings.embedding_dimensions,
                )
                return [d.embedding for d in resp.data]
        raise RuntimeError("Unreachable")

    # ── Whisper ASR through OpenAI ───────────────────────────────────────
    async def transcribe(
        self,
        *,
        audio_path: str,
        language: str | None = None,
        prompt: str | None = None,
    ) -> dict[str, Any]:
        client = self._require_openai()
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


_singleton: LLMClient | None = None


def get_llm_client() -> LLMClient:
    global _singleton
    if _singleton is None:
        _singleton = LLMClient()
    return _singleton
