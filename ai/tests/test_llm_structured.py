"""Adaptive structured-output helpers."""

from __future__ import annotations

import json

import pytest
from pydantic import BaseModel, ConfigDict

from hunarmand_ai.config import get_settings
from hunarmand_ai.llm.structured import (
    _extract_json_object,
    _resolve_mode,
    _response_format_for,
    _strip_code_fence,
)


class _Sample(BaseModel):
    model_config = ConfigDict(extra="forbid")
    answer: str
    confidence: float


def test_strip_code_fence_with_lang() -> None:
    assert _strip_code_fence("```json\n{\"a\":1}\n```") == '{"a":1}'


def test_strip_code_fence_no_fence() -> None:
    assert _strip_code_fence('{"a":1}') == '{"a":1}'


def test_extract_json_object_with_prose() -> None:
    text = 'Sure! Here is the JSON: {"answer": "kani", "confidence": 0.9}\nThanks.'
    out = _extract_json_object(text)
    assert json.loads(out) == {"answer": "kani", "confidence": 0.9}


def test_extract_json_object_handles_nested() -> None:
    text = '{"a": {"b": "c"}, "d": [1,2,3]}'
    out = _extract_json_object(text)
    assert json.loads(out) == {"a": {"b": "c"}, "d": [1, 2, 3]}


def test_extract_json_object_handles_strings_with_braces() -> None:
    text = '{"answer": "use {kani} stick", "confidence": 0.5}'
    out = _extract_json_object(text)
    assert json.loads(out) == {"answer": "use {kani} stick", "confidence": 0.5}


@pytest.mark.parametrize("mode", ["schema", "json", "prompt"])
def test_response_format_for(mode: str) -> None:
    rf = _response_format_for(mode, _Sample)
    if mode == "schema":
        assert rf and rf["type"] == "json_schema"
    elif mode == "json":
        assert rf == {"type": "json_object"}
    else:
        assert rf is None


def test_resolve_mode_auto_per_provider(monkeypatch) -> None:
    get_settings.cache_clear()
    monkeypatch.setenv("HUNARMAND_LLM_STRUCTURED_MODE", "auto")

    monkeypatch.setenv("HUNARMAND_LLM_PROVIDER", "openai")
    get_settings.cache_clear()
    assert _resolve_mode() == "schema"

    monkeypatch.setenv("HUNARMAND_LLM_PROVIDER", "openrouter")
    get_settings.cache_clear()
    assert _resolve_mode() == "json"

    monkeypatch.setenv("HUNARMAND_LLM_PROVIDER", "anthropic")
    get_settings.cache_clear()
    assert _resolve_mode() == "json"

    # Reset for downstream tests.
    monkeypatch.delenv("HUNARMAND_LLM_PROVIDER", raising=False)
    monkeypatch.delenv("HUNARMAND_LLM_STRUCTURED_MODE", raising=False)
    get_settings.cache_clear()
