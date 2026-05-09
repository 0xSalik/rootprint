"""Backend fallback machinery."""

from __future__ import annotations

import asyncio

import pytest

from app.fallbacks import (
    FallbackPolicy,
    build_ask_fallback,
    build_search_fallback,
    run_with_fallback,
)


@pytest.mark.asyncio
async def test_search_fallback_returns_curated_results() -> None:
    out = build_search_fallback(query="kani winter", limit=3)
    assert len(out) == 3
    for row in out:
        assert "id" in row
        assert "master_id" in row
        assert "technique_name" in row
        assert "translated_transcript" in row
        assert 0.0 <= row["similarity_score"] <= 1.0


@pytest.mark.asyncio
async def test_ask_fallback_keyword_routing() -> None:
    out = build_ask_fallback(
        master_id="00000000-0000-4000-8000-000000000001",
        question="How does the master adjust warp tension in winter?",
        answer_language="en",
    )
    assert out["refused"] is False
    assert "winter" in out["answer"].lower() or "tension" in out["answer"].lower()
    assert out["citations"]
    assert "quote" in out["citations"][0]


@pytest.mark.asyncio
async def test_run_with_fallback_uses_fallback_on_timeout() -> None:
    async def slow() -> str:
        await asyncio.sleep(2.0)
        return "real"

    out = await run_with_fallback(
        coro=slow(),
        fallback=lambda: "fallback",
        policy=FallbackPolicy(name="t", timeout_s=0.1),
    )
    assert out == "fallback"


@pytest.mark.asyncio
async def test_run_with_fallback_returns_real_when_fast() -> None:
    async def fast() -> str:
        return "real"

    out = await run_with_fallback(
        coro=fast(),
        fallback=lambda: "fallback",
        policy=FallbackPolicy(name="t", timeout_s=2.0),
    )
    assert out == "real"
