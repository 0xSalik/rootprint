"""Groq Whisper provider — free-tier ASR.

Groq runs ``whisper-large-v3`` and ``whisper-large-v3-turbo`` on
custom inference hardware with a generous free tier and very low
latency (sub-second for short clips). Like OpenAI Whisper, Kashmiri
(``ks``) is not in the official supported set, so we route Koshur
through the Urdu acoustic model the same way we do for OpenAI's
Whisper. Quality is comparable to the paid OpenAI endpoint.

Auth: an OpenAI-compatible API at ``https://api.groq.com/openai/v1``.
Sign up free at https://console.groq.com/keys.
"""

from __future__ import annotations

from typing import Any

import structlog

from ..config import get_settings
from ..llm.client import get_llm_client
from ..schemas.asr import AsrProvider, AsrResult, AsrSegment
from .base import ASRUnavailableError
from .whisper_provider import _WHISPER_LANGS, _confidence_from_logprobs, _route_language

log = structlog.get_logger(__name__)


class GroqWhisperProvider:
    name = AsrProvider.GROQ.value

    def __init__(self) -> None:
        self.settings = get_settings()

    async def is_available(self) -> bool:
        return bool(self.settings.groq_api_key)

    async def transcribe(self, *, audio_path: str, language_hint: str | None) -> AsrResult:
        if not await self.is_available():
            raise ASRUnavailableError("GROQ_API_KEY not set")

        lang = _route_language(language_hint)
        kashmiri_glossary = (
            "Koshur. Kashmiri craft terms: pashmina, sozni, kani, talim, "
            "naqashi, khatamband, namda, kanihama, gurez, changthangi, "
            "ustaad, hunar, hunarmand, sanad."
        )
        client = get_llm_client()
        raw = await client.transcribe_groq(
            audio_path=audio_path,
            language=lang,
            prompt=kashmiri_glossary,
        )
        return _normalise(raw, declared_language=language_hint or lang, routed_language=lang)


def _normalise(raw: dict[str, Any], *, declared_language: str, routed_language: str) -> AsrResult:
    text = raw.get("text", "") or ""
    segments_raw = raw.get("segments", []) or []
    segments: list[AsrSegment] = []
    avg_logprobs: list[float] = []
    for seg in segments_raw:
        try:
            segments.append(
                AsrSegment(
                    start_s=float(seg.get("start", 0.0) or 0.0),
                    end_s=float(seg.get("end", 0.0) or 0.0),
                    text=(seg.get("text") or "").strip(),
                    avg_logprob=seg.get("avg_logprob"),
                )
            )
        except Exception:  # noqa: BLE001
            continue
        if seg.get("avg_logprob") is not None:
            avg_logprobs.append(float(seg["avg_logprob"]))

    duration = float(raw.get("duration", 0.0) or 0.0)
    if not duration and segments:
        duration = max(s.end_s for s in segments)

    confidence = _confidence_from_logprobs(avg_logprobs)
    notes = "Groq whisper-large-v3-turbo (free tier)"
    if (
        declared_language
        and declared_language not in _WHISPER_LANGS
        and routed_language != declared_language
    ):
        notes += (
            f"; language hint '{declared_language}' is not natively supported; "
            f"acoustic fallback to '{routed_language}'."
        )

    return AsrResult(
        provider=AsrProvider.GROQ,
        language_detected=raw.get("language", routed_language) or routed_language,
        text=text.strip(),
        confidence=confidence,
        segments=segments,
        duration_s=duration,
        notes=notes,
    )
