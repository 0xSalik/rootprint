"""Embedder provider selection."""

from __future__ import annotations

import pytest

from hunarmand_ai.config import Settings
from hunarmand_ai.rag.embedder import (
    Embedder,
    EmbedderUnavailableError,
    _JinaProvider,
    _LocalProvider,
    _OpenAIProvider,
)


def test_embedder_selects_local() -> None:
    s = Settings(HUNARMAND_EMBEDDING_PROVIDER="local")
    e = Embedder(settings=s)
    assert isinstance(e.provider, _LocalProvider)


def test_embedder_selects_jina() -> None:
    s = Settings(HUNARMAND_EMBEDDING_PROVIDER="jina")
    e = Embedder(settings=s)
    assert isinstance(e.provider, _JinaProvider)


def test_embedder_selects_openai() -> None:
    s = Settings(HUNARMAND_EMBEDDING_PROVIDER="openai")
    e = Embedder(settings=s)
    assert isinstance(e.provider, _OpenAIProvider)


@pytest.mark.asyncio
async def test_jina_unavailable_without_key() -> None:
    s = Settings(HUNARMAND_EMBEDDING_PROVIDER="jina")
    e = Embedder(settings=s)
    assert not await e.provider.is_available()
    with pytest.raises(EmbedderUnavailableError):
        await e.provider.embed(["hello"])
