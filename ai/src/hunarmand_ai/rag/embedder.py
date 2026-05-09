"""Embeddings for Vault chunks."""

from __future__ import annotations

from ..llm.client import LLMClient, get_llm_client


class Embedder:
    def __init__(self, llm: LLMClient | None = None) -> None:
        self._llm = llm or get_llm_client()

    async def embed_texts(self, texts: list[str]) -> list[list[float]]:
        # OpenAI's embeddings endpoint handles up to 2048 inputs per call,
        # but we batch defensively in groups of 100 to stay well under any
        # provider's per-call payload cap.
        out: list[list[float]] = []
        for i in range(0, len(texts), 100):
            batch = texts[i : i + 100]
            out.extend(await self._llm.embed(batch))
        return out


_singleton: Embedder | None = None


def get_embedder() -> Embedder:
    global _singleton
    if _singleton is None:
        _singleton = Embedder()
    return _singleton
