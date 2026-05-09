"""Manual provider — facilitator types as the master speaks.

This is intentional, not a fallback we are ashamed of. A field session
in a Srinagar workshop with poor connectivity will sometimes have the
facilitator typing the master's exact words on a tablet. That transcript
enters the Vault as ``provider=manual`` with ``confidence=1.0`` because
it is the canonical ground truth.
"""

from __future__ import annotations

from ..schemas.asr import AsrProvider, AsrResult, AsrSegment
from .base import ASRUnavailableError


class ManualProvider:
    """Always available, but only fires when ``manual_text`` is provided
    in the request. The pipeline knows to skip us if the field is empty.
    """

    name = AsrProvider.MANUAL.value

    async def is_available(self) -> bool:
        return True

    async def transcribe_text(
        self,
        *,
        manual_text: str,
        language_hint: str | None,
        duration_s: float | None = None,
    ) -> AsrResult:
        text = manual_text.strip()
        if not text:
            raise ASRUnavailableError("Manual provider requires non-empty text.")
        return AsrResult(
            provider=AsrProvider.MANUAL,
            language_detected=language_hint or "ks",
            text=text,
            confidence=1.0,
            segments=[AsrSegment(start_s=0.0, end_s=float(duration_s or 0.0), text=text)],
            duration_s=float(duration_s or 0.0),
            notes="Manually typed by field facilitator (canonical ground truth).",
        )

    async def transcribe(self, *, audio_path: str, language_hint: str | None) -> AsrResult:
        raise ASRUnavailableError("Manual provider needs typed text, not audio.")
