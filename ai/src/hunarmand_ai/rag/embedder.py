"""Multi-provider embedder.

Supported providers (configured via ``HUNARMAND_EMBEDDING_PROVIDER``):

* ``openai`` — paid; ``text-embedding-3-small`` (1536d) by default.
* ``jina``   — free tier with ``JINA_API_KEY``; ``jina-embeddings-v3``
  is multilingual (incl. Hindi/Urdu) and supports task-specific
  embeddings.
* ``local``  — runs ``sentence-transformers`` locally; truly free.
  Default model: ``intfloat/multilingual-e5-small`` (384d).

Switching providers usually changes the vector dimension. Set
``HUNARMAND_EMBEDDING_DIMENSIONS`` to match before creating the
``vault_chunks`` table — pgvector enforces dimension at the column.
"""

from __future__ import annotations

from typing import Any

import httpx
import structlog
from tenacity import (
    AsyncRetrying,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential_jitter,
)

from ..config import Settings, get_settings
from ..llm.client import LLMClient, get_llm_client

log = structlog.get_logger(__name__)


class EmbedderUnavailableError(RuntimeError):
    """Raised when the configured embedding provider cannot serve."""


def _retrying() -> AsyncRetrying:
    return AsyncRetrying(
        stop=stop_after_attempt(4),
        wait=wait_exponential_jitter(initial=1.0, max=8.0),
        retry=retry_if_exception_type(Exception),
        reraise=True,
    )


# ── Provider implementations ────────────────────────────────────────────────


class _OpenAIProvider:
    name = "openai"

    def __init__(self, settings: Settings, llm: LLMClient) -> None:
        self.settings = settings
        self.llm = llm

    async def is_available(self) -> bool:
        return bool(self.settings.openai_api_key)

    async def embed(self, texts: list[str]) -> list[list[float]]:
        return await self.llm.embed(texts)


class _JinaProvider:
    name = "jina"

    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    async def is_available(self) -> bool:
        return bool(self.settings.jina_api_key)

    async def embed(self, texts: list[str]) -> list[list[float]]:
        if not await self.is_available():
            raise EmbedderUnavailableError("JINA_API_KEY not set")
        url = self.settings.jina_base_url.rstrip("/") + "/embeddings"
        headers = {
            "Authorization": f"Bearer {self.settings.jina_api_key}",
            "Content-Type": "application/json",
        }
        body: dict[str, Any] = {
            "model": self.settings.embedding_model,
            "input": texts,
            # ``retrieval.passage`` works well for Vault chunks; clients
            # querying use ``retrieval.query``. We keep this simple for
            # the hackathon.
            "task": "retrieval.passage",
            "dimensions": self.settings.embedding_dimensions,
        }
        async for attempt in _retrying():
            with attempt:
                async with httpx.AsyncClient(timeout=60.0) as http:
                    resp = await http.post(url, json=body, headers=headers)
                if resp.status_code >= 400:
                    raise EmbedderUnavailableError(
                        f"Jina embeddings failed: {resp.status_code} {resp.text[:300]}"
                    )
                data = resp.json()
                return [d["embedding"] for d in data.get("data", [])]
        raise EmbedderUnavailableError("Jina embeddings: retries exhausted")


class _LocalProvider:
    """Local sentence-transformers — no API, no cost.

    Lazy-loads the model on first use; subsequent calls reuse the cached
    instance. Install with ``pip install '.[local-embeddings]'`` or
    ``pip install sentence-transformers``.
    """

    name = "local"

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self._model: Any = None

    async def is_available(self) -> bool:
        try:
            import sentence_transformers  # noqa: F401
            return True
        except Exception:  # noqa: BLE001
            return False

    def _load(self) -> Any:
        if self._model is not None:
            return self._model
        try:
            from sentence_transformers import SentenceTransformer
        except Exception as exc:  # noqa: BLE001
            raise EmbedderUnavailableError(
                "`sentence-transformers` is not installed. Run "
                "`pip install '.[local-embeddings]'` or set "
                "HUNARMAND_EMBEDDING_PROVIDER to a configured remote provider."
            ) from exc
        log.info(
            "embedder.local.load",
            model=self.settings.embedding_model,
            dim=self.settings.embedding_dimensions,
        )
        self._model = SentenceTransformer(self.settings.embedding_model)
        return self._model

    async def embed(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        import asyncio

        model = self._load()
        # ``model.encode`` is CPU/GPU-bound — run in a thread so we don't
        # block the FastAPI event loop.
        loop = asyncio.get_running_loop()
        vectors = await loop.run_in_executor(
            None,
            lambda: model.encode(
                texts,
                show_progress_bar=False,
                normalize_embeddings=True,
                convert_to_numpy=True,
            ),
        )
        return [v.tolist() for v in vectors]


# ── Embedder facade ────────────────────────────────────────────────────────


class Embedder:
    """Provider-agnostic async embedder."""

    def __init__(
        self,
        settings: Settings | None = None,
        llm: LLMClient | None = None,
    ) -> None:
        self.settings = settings or get_settings()
        self.llm = llm or get_llm_client()
        provider = self.settings.embedding_provider
        self.provider: _OpenAIProvider | _JinaProvider | _LocalProvider
        if provider == "openai":
            self.provider = _OpenAIProvider(self.settings, self.llm)
        elif provider == "jina":
            self.provider = _JinaProvider(self.settings)
        elif provider == "local":
            self.provider = _LocalProvider(self.settings)
        else:
            raise EmbedderUnavailableError(f"Unknown embedding provider: {provider}")

    async def embed_texts(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        out: list[list[float]] = []
        # Defensive batching — most APIs accept far more, but a small
        # batch keeps memory pressure low for the local provider.
        batch_size = 64 if self.settings.embedding_provider == "local" else 100
        for i in range(0, len(texts), batch_size):
            batch = texts[i : i + batch_size]
            out.extend(await self.provider.embed(batch))
        if out and self.settings.embedding_dimensions != len(out[0]):
            log.warning(
                "embedder.dim_mismatch",
                provider=self.settings.embedding_provider,
                got=len(out[0]),
                expected=self.settings.embedding_dimensions,
                hint=(
                    "Set HUNARMAND_EMBEDDING_DIMENSIONS to match your model and "
                    "drop+recreate the vault_chunks table."
                ),
            )
        return out


_singleton: Embedder | None = None


def get_embedder() -> Embedder:
    global _singleton
    if _singleton is None:
        _singleton = Embedder()
    return _singleton
