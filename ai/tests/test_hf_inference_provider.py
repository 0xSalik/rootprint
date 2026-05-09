"""HF Inference Whisper provider behaviour."""

from __future__ import annotations

import pytest

from hunarmand_ai.asr.base import ASRUnavailableError
from hunarmand_ai.asr.hf_inference_provider import HFInferenceProvider
from hunarmand_ai.config import Settings


@pytest.mark.asyncio
async def test_unavailable_without_token(monkeypatch) -> None:
    monkeypatch.delenv("HF_API_TOKEN", raising=False)
    p = HFInferenceProvider()
    p.settings = Settings(HF_API_TOKEN=None)
    assert not await p.is_available()
    with pytest.raises(ASRUnavailableError):
        await p.transcribe(audio_path="/tmp/x.wav", language_hint="ks")


def test_provider_name() -> None:
    p = HFInferenceProvider()
    assert p.name == "hf_inference"
