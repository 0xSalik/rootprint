"""'Ask the Hunarmand' refusal logic — pure-function tests."""

from __future__ import annotations

from hunarmand_ai.rag.ask import REFUSAL_TEMPLATE, _trim_quote  # type: ignore[attr-defined]


def test_trim_quote_short() -> None:
    assert _trim_quote("hello world", 100) == "hello world"


def test_trim_quote_at_sentence_boundary() -> None:
    text = "First sentence. Second sentence. Third sentence."
    out = _trim_quote(text, 24)
    assert out.endswith("…") or len(out) <= 24


def test_refusal_template_mentions_master() -> None:
    assert "master" in REFUSAL_TEMPLATE.lower()
    assert "follow-up" in REFUSAL_TEMPLATE.lower() or "directly" in REFUSAL_TEMPLATE.lower()
