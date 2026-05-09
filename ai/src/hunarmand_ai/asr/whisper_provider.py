"""OpenAI Whisper API provider.

Whisper does not officially support Kashmiri (`ks`). For Koshur audio we
hint ``language=ur`` (Urdu), which is acoustically the closest supported
language and routinely produces near-Kashmiri transliterated text. The
on-device facilitator can then correct it before the transcript enters
the public Sanad layer.
"""

from __future__ import annotations

from typing import Any

import structlog

from ..config import get_settings
from ..llm.client import get_llm_client
from ..schemas.asr import AsrProvider, AsrResult, AsrSegment
from .base import ASRUnavailableError

log = structlog.get_logger(__name__)


# Whisper's supported language list (ISO-639-1). Anything else gets routed
# through Urdu acoustic models.
_WHISPER_LANGS: set[str] = {
    "af", "ar", "az", "be", "bg", "bn", "bs", "ca", "cs", "cy", "da", "de",
    "el", "en", "es", "et", "fa", "fi", "fr", "gl", "gu", "he", "hi", "hr",
    "hu", "hy", "id", "is", "it", "ja", "kk", "kn", "ko", "lt", "lv", "mi",
    "mk", "ml", "mn", "mr", "ms", "ne", "nl", "no", "pa", "pl", "pt", "ro",
    "ru", "sk", "sl", "sr", "sv", "sw", "ta", "te", "th", "tl", "tr", "uk",
    "ur", "vi", "zh",
}


def _route_language(hint: str | None) -> str:
    if not hint:
        return "ur"
    code = hint.split("-")[0].lower()
    if code in _WHISPER_LANGS:
        return code
    if code in {"ks", "kas", "kashmiri", "koshur"}:
        return "ur"  # Acoustic fallback to Urdu.
    if code in {"hi", "doi"}:
        return "hi"
    return "ur"


class WhisperProvider:
    name = AsrProvider.WHISPER.value

    def __init__(self) -> None:
        self.settings = get_settings()

    async def is_available(self) -> bool:
        return bool(self.settings.openai_api_key)

    async def transcribe(self, *, audio_path: str, language_hint: str | None) -> AsrResult:
        if not await self.is_available():
            raise ASRUnavailableError("OPENAI_API_KEY not set")

        lang = _route_language(language_hint)
        kashmiri_glossary = (
            "Koshur. Kashmiri craft terms: pashmina, sozni, kani, talim, "
            "naqashi, khatamband, namda, kanihama, gurez, changthangi, "
            "ustaad, hunar, hunarmand, sanad."
        )
        client = get_llm_client()
        raw = await client.transcribe(
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
    notes = None
    if declared_language and declared_language not in _WHISPER_LANGS and routed_language != declared_language:
        notes = (
            f"language hint '{declared_language}' is not natively supported; "
            f"acoustic fallback to '{routed_language}'."
        )

    return AsrResult(
        provider=AsrProvider.WHISPER,
        language_detected=raw.get("language", routed_language) or routed_language,
        text=text.strip(),
        confidence=confidence,
        segments=segments,
        duration_s=duration,
        notes=notes,
    )


def _confidence_from_logprobs(logprobs: list[float]) -> float:
    """Map average segment log-probabilities into a 0..1 confidence band.

    Whisper's avg_logprob is typically in the [-1, 0] range with
    -0.20 being clean speech and -0.80 being garbled. We squash it.
    """

    if not logprobs:
        return 0.5
    avg = sum(logprobs) / len(logprobs)
    # Linear mapping with clamp.
    raw = (avg + 1.0) / 1.0  # logprob -1 -> 0, 0 -> 1
    return max(0.0, min(1.0, round(raw, 3)))
