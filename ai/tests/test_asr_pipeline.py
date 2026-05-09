"""ASR fallback ladder behavioural tests (no network)."""

from __future__ import annotations

from typing import Any

import pytest

from hunarmand_ai.asr.base import ASRProviderError, ASRUnavailableError
from hunarmand_ai.asr.pipeline import ACCEPT_CONFIDENCE, ASRPipeline
from hunarmand_ai.schemas.asr import AsrProvider, AsrResult, AsrSegment


class _FakeProvider:
    def __init__(self, *, name: str, available: bool, result: AsrResult | None, raise_on_call: Exception | None = None) -> None:
        self.name = name
        self._available = available
        self._result = result
        self._raise = raise_on_call

    async def is_available(self) -> bool:
        return self._available

    async def transcribe(self, *, audio_path: str, language_hint: str | None) -> AsrResult:
        if self._raise:
            raise self._raise
        assert self._result is not None
        return self._result


def _result(provider: AsrProvider, *, text: str = "...", confidence: float = 0.9) -> AsrResult:
    return AsrResult(
        provider=provider,
        language_detected="ks",
        text=text,
        confidence=confidence,
        segments=[AsrSegment(start_s=0.0, end_s=1.0, text=text)],
        duration_s=1.0,
    )


@pytest.fixture()
def pipeline() -> ASRPipeline:
    p = ASRPipeline()
    return p


@pytest.mark.asyncio
async def test_first_high_confidence_provider_wins(pipeline: ASRPipeline, monkeypatch: Any) -> None:
    pipeline._providers[AsrProvider.BHASHINI.value] = _FakeProvider(
        name="bhashini", available=True, result=_result(AsrProvider.BHASHINI, confidence=0.92)
    )
    pipeline._providers[AsrProvider.GROQ.value] = _FakeProvider(
        name="groq", available=True, result=_result(AsrProvider.GROQ, confidence=0.94)
    )
    pipeline._providers[AsrProvider.WHISPER.value] = _FakeProvider(
        name="whisper", available=True, result=_result(AsrProvider.WHISPER, confidence=0.95)
    )
    pipeline.settings.asr_ladder = "bhashini,groq,whisper,manual"

    async def _no_translate(*, text: str, source_language: str, target_language: str = "en") -> str:
        return f"EN({text})"

    monkeypatch.setattr(pipeline._translator, "translate", _no_translate)

    result = await pipeline.transcribe_audio(audio_path="/tmp/fake.wav", language_hint="ks")
    assert result.provider == AsrProvider.BHASHINI
    assert result.confidence >= ACCEPT_CONFIDENCE
    assert not result.fallback_used


@pytest.mark.asyncio
async def test_unavailable_provider_skipped(pipeline: ASRPipeline, monkeypatch: Any) -> None:
    pipeline._providers[AsrProvider.BHASHINI.value] = _FakeProvider(
        name="bhashini", available=False, result=None
    )
    pipeline._providers[AsrProvider.GROQ.value] = _FakeProvider(
        name="groq", available=False, result=None
    )
    pipeline._providers[AsrProvider.WHISPER.value] = _FakeProvider(
        name="whisper", available=True, result=_result(AsrProvider.WHISPER, confidence=0.91)
    )
    pipeline.settings.asr_ladder = "bhashini,groq,whisper,manual"

    async def _no_translate(**_: Any) -> str:
        return "EN"

    monkeypatch.setattr(pipeline._translator, "translate", _no_translate)

    result = await pipeline.transcribe_audio(audio_path="/tmp/fake.wav")
    assert result.provider == AsrProvider.WHISPER


@pytest.mark.asyncio
async def test_failure_falls_through(pipeline: ASRPipeline, monkeypatch: Any) -> None:
    pipeline._providers[AsrProvider.BHASHINI.value] = _FakeProvider(
        name="bhashini", available=True, result=None, raise_on_call=ASRProviderError("boom")
    )
    pipeline._providers[AsrProvider.GROQ.value] = _FakeProvider(
        name="groq", available=False, result=None
    )
    pipeline._providers[AsrProvider.WHISPER.value] = _FakeProvider(
        name="whisper", available=True, result=_result(AsrProvider.WHISPER, confidence=0.88)
    )
    pipeline.settings.asr_ladder = "bhashini,groq,whisper,manual"

    async def _no_translate(**_: Any) -> str:
        return "EN"

    monkeypatch.setattr(pipeline._translator, "translate", _no_translate)

    result = await pipeline.transcribe_audio(audio_path="/tmp/fake.wav")
    assert result.provider == AsrProvider.WHISPER
    assert AsrProvider.BHASHINI in result.fallback_chain


@pytest.mark.asyncio
async def test_low_confidence_returns_best_attempt(pipeline: ASRPipeline, monkeypatch: Any) -> None:
    pipeline._providers[AsrProvider.BHASHINI.value] = _FakeProvider(
        name="bhashini",
        available=True,
        result=_result(AsrProvider.BHASHINI, confidence=0.4),
    )
    pipeline._providers[AsrProvider.GROQ.value] = _FakeProvider(
        name="groq", available=False, result=None
    )
    pipeline._providers[AsrProvider.WHISPER.value] = _FakeProvider(
        name="whisper", available=True, result=_result(AsrProvider.WHISPER, confidence=0.5)
    )
    pipeline.settings.asr_ladder = "bhashini,groq,whisper,manual"

    async def _no_translate(**_: Any) -> str:
        return "EN"

    monkeypatch.setattr(pipeline._translator, "translate", _no_translate)

    result = await pipeline.transcribe_audio(audio_path="/tmp/fake.wav")
    assert result.fallback_used
    assert result.provider == AsrProvider.WHISPER  # higher confidence between attempts


@pytest.mark.asyncio
async def test_manual_provider_available_path() -> None:
    p = ASRPipeline()
    result = await p.transcribe_manual(
        manual_text="kani-buti chu hath sund",
        language_hint="ks",
        translate_to_english=False,
        duration_s=2.5,
    )
    assert result.provider == AsrProvider.MANUAL
    assert result.confidence == 1.0
    assert result.text.startswith("kani-buti")
