"""Fallback behaviour: timeout fires the curated payload."""

from __future__ import annotations

import asyncio
import os

import pytest

from hunarmand_ai.fallbacks import (
    FallbackPolicy,
    build_ask_fallback,
    build_asr_fallback,
    build_extract_fallback,
    run_with_fallback,
)
from hunarmand_ai.schemas.craft_dna import CraftDNA
from hunarmand_ai.schemas.rag import AskRequest, AskResponse


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


@pytest.mark.asyncio
async def test_run_with_fallback_returns_fallback_on_timeout() -> None:
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
async def test_run_with_fallback_returns_fallback_on_exception() -> None:
    async def boom() -> str:
        raise RuntimeError("upstream blew up")

    out = await run_with_fallback(
        coro=boom(),
        fallback=lambda: "fallback",
        policy=FallbackPolicy(name="t", timeout_s=2.0),
    )
    assert out == "fallback"


@pytest.mark.asyncio
async def test_can_disable_globally(monkeypatch) -> None:
    monkeypatch.setenv("HUNARMAND_FALLBACK_ENABLED", "0")

    async def boom() -> str:
        raise RuntimeError("real-error")

    with pytest.raises(RuntimeError, match="real-error"):
        await run_with_fallback(
            coro=boom(),
            fallback=lambda: "fallback",
            policy="ask",
        )


def test_build_ask_fallback_validates() -> None:
    req = AskRequest(
        master_id="00000000-0000-4000-8000-000000000001",
        question="how does the master adjust warp tension in winter",
        answer_language="en",
    )
    resp = build_ask_fallback(req)
    assert isinstance(resp, AskResponse)
    assert resp.refused is False
    assert resp.citations and resp.citations[0].quote
    # keyword routing should pick the winter-tension entry
    assert "winter" in resp.answer.lower() or "tension" in resp.answer.lower()


def test_build_extract_fallback_validates() -> None:
    dna = build_extract_fallback("00000000-0000-4000-8000-000000000001", "ks")
    assert isinstance(dna, CraftDNA)
    # the schema validators ran (cross-references resolve, etc.)
    assert dna.identity.full_name
    assert dna.techniques
    assert dna.knowledge_vulnerability_index() <= 1.0


def test_build_asr_fallback_has_segments_and_translation() -> None:
    res = build_asr_fallback(language_hint="ks")
    assert res.text
    assert res.text_translated_en
    assert res.segments
