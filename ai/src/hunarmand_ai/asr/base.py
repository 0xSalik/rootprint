"""ASR provider protocol."""

from __future__ import annotations

from typing import Protocol

from ..schemas.asr import AsrResult


class AsrProviderProtocol(Protocol):
    """Each provider transcribes audio into a normalised ``AsrResult``.

    Providers MUST raise ``ASRUnavailableError`` if they are not
    configured (missing API key etc.) — that allows the pipeline to skip
    them silently and fall through to the next rung in the ladder.
    """

    name: str

    async def is_available(self) -> bool: ...

    async def transcribe(
        self,
        *,
        audio_path: str,
        language_hint: str | None,
    ) -> AsrResult: ...


class ASRUnavailableError(RuntimeError):
    """Raised by a provider when it cannot serve a request (no key, etc.)."""


class ASRProviderError(RuntimeError):
    """Raised when the provider was tried and genuinely failed."""
