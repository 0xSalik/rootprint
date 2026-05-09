"""Extractor helpers — pure-function tests that don't hit the LLM."""

from __future__ import annotations

from hunarmand_ai.extractor.extractor import _render_chunks  # type: ignore[attr-defined]


def test_render_chunks_includes_ids_and_timestamps() -> None:
    chunks = [
        {
            "chunk_id": "c-1",
            "pass_id": "technique",
            "text": "kani-buti chu",
            "text_en": "kani-buti is",
            "timestamp_start_s": 0.0,
            "timestamp_end_s": 2.5,
            "language": "ks",
        }
    ]
    rendered = _render_chunks(chunks)
    assert "chunk_id=c-1" in rendered
    assert "pass_id=technique" in rendered
    assert "0.0s" in rendered
    assert "2.5s" in rendered
    assert "kani-buti chu" in rendered
    assert "(EN translation) kani-buti is" in rendered


def test_render_chunks_empty() -> None:
    assert _render_chunks([]) == "(no transcripts)"
