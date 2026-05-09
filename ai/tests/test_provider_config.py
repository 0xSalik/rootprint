"""Provider configuration and ladder validation."""

from __future__ import annotations

import pytest

from hunarmand_ai.config import Settings, get_settings


def test_default_is_free_tier(monkeypatch) -> None:
    """The shipped defaults should not require any paid services."""

    monkeypatch.delenv("HUNARMAND_LLM_PROVIDER", raising=False)
    monkeypatch.delenv("HUNARMAND_EMBEDDING_PROVIDER", raising=False)
    monkeypatch.delenv("HUNARMAND_ASR_LADDER", raising=False)
    monkeypatch.delenv("HUNARMAND_TRANSLATION_PROVIDER", raising=False)
    get_settings.cache_clear()

    s = Settings()
    assert s.llm_provider == "openrouter"
    assert s.embedding_provider == "local"
    assert "groq" in s.asr_ladder_list
    assert s.translation_provider == "llm"


def test_asr_ladder_validates() -> None:
    Settings(HUNARMAND_ASR_LADDER="bhashini,groq,whisper")
    Settings(HUNARMAND_ASR_LADDER="bhashini,hf_inference,whisper")
    Settings(HUNARMAND_ASR_LADDER="manual")
    with pytest.raises(ValueError, match="Unknown ASR providers"):
        Settings(HUNARMAND_ASR_LADDER="bhashini,nope,whisper")


def test_effective_translation_model_falls_back(monkeypatch) -> None:
    monkeypatch.delenv("HUNARMAND_TRANSLATION_MODEL", raising=False)
    monkeypatch.setenv("HUNARMAND_LLM_MODEL", "deepseek/deepseek-chat:free")
    get_settings.cache_clear()
    s = Settings()
    assert s.effective_translation_model == "deepseek/deepseek-chat:free"
    monkeypatch.delenv("HUNARMAND_LLM_MODEL", raising=False)
    get_settings.cache_clear()


def test_groq_in_default_ladder() -> None:
    s = Settings()
    assert "groq" in s.asr_ladder_list


def test_hf_inference_in_default_ladder() -> None:
    s = Settings()
    assert "hf_inference" in s.asr_ladder_list
