"""Vector retrieval over the Vault chunks for a single master.

We use pgvector's SQLAlchemy operators (``cosine_distance``) so the
embedding parameter is bound through the pgvector adapter — that's
the *only* path that turns a Python ``list[float]`` into the wire
format pgvector expects (the literal ``'[0.1,0.2,…]'`` string).

The earlier version of this module used a raw ``text(...)`` query with
``bindparam("emb")``. SQLAlchemy treated the parameter as a string, so
asyncpg saw a Python list where it wanted a str and exploded with::

    asyncpg.exceptions.DataError: invalid input for query argument $1:
      [0.0376..., -0.0038...] (expected str, got list)

The ORM query below avoids that entirely.

We convert the cosine *distance* (in [0, 2] for normalised vectors)
into a *similarity* in [0, 1] so the threshold logic in
``AskHunarmand`` reads naturally.
"""

from __future__ import annotations

import uuid

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import get_settings
from ..models.vault_chunk import VaultChunkRow
from ..schemas.rag import RetrievedChunk
from .embedder import Embedder, get_embedder

log = structlog.get_logger(__name__)


def _coerce_master_uuid(value: str | uuid.UUID) -> uuid.UUID | None:
    """Accept either a UUID or a parseable UUID string.

    Returns ``None`` for anything else (e.g. Swagger's default literal
    ``"string"``) so the caller can short-circuit to a refusal instead
    of raising a 500.
    """

    if isinstance(value, uuid.UUID):
        return value
    try:
        return uuid.UUID(str(value))
    except (ValueError, TypeError):
        return None


class VaultRetriever:
    def __init__(self, session: AsyncSession, embedder: Embedder | None = None) -> None:
        self.session = session
        self.embedder = embedder or get_embedder()
        self.settings = get_settings()

    async def retrieve(
        self,
        *,
        master_id: str | uuid.UUID,
        query: str,
        top_k: int | None = None,
    ) -> list[RetrievedChunk]:
        if not query.strip():
            return []

        master_uuid = _coerce_master_uuid(master_id)
        if master_uuid is None:
            log.warning(
                "retriever.invalid_master_id",
                master_id=str(master_id),
                hint="master_id must be a UUID; got non-UUID string",
            )
            return []

        top_k = top_k or self.settings.rag_top_k

        [embedding] = await self.embedder.embed_texts([query])

        # ORM-style query — pgvector's SQLAlchemy adapter handles the
        # list-to-Vector binding correctly for cosine_distance.
        distance = VaultChunkRow.embedding.cosine_distance(embedding)
        stmt = (
            select(VaultChunkRow, distance.label("distance"))
            .where(VaultChunkRow.master_id == master_uuid)
            .where(VaultChunkRow.embedding.is_not(None))
            .order_by(distance)
            .limit(top_k)
        )

        result = await self.session.execute(stmt)
        rows = result.all()

        return [
            RetrievedChunk(
                chunk_id=str(row[0].id),
                master_id=str(row[0].master_id),
                pass_id=row[0].pass_id,
                text=row[0].text,
                text_en=row[0].text_en,
                timestamp_start_s=float(row[0].timestamp_start_s),
                timestamp_end_s=float(row[0].timestamp_end_s),
                language=row[0].language,
                audio_uri=row[0].audio_uri,
                # cosine_distance in [0, 2] → similarity in [-1, 1].
                # Clamp to [0, 1] which is what the threshold logic expects.
                score=max(0.0, min(1.0, 1.0 - float(row[1]))),
            )
            for row in rows
        ]

    async def upsert_chunks(
        self,
        *,
        chunks: list[dict],
        embeddings: list[list[float]],
    ) -> int:
        if not chunks:
            return 0
        if len(chunks) != len(embeddings):
            raise ValueError("chunks and embeddings length mismatch")

        rows: list[VaultChunkRow] = []
        for chunk, emb in zip(chunks, embeddings, strict=True):
            row = VaultChunkRow(
                id=chunk.get("chunk_id"),
                master_id=chunk["master_id"],
                session_id=chunk.get("session_id"),
                pass_id=chunk["pass_id"],
                text=chunk["text"],
                text_en=chunk.get("text_en"),
                language=chunk.get("language", "ks"),
                timestamp_start_s=chunk["timestamp_start_s"],
                timestamp_end_s=chunk["timestamp_end_s"],
                audio_uri=chunk.get("audio_uri"),
                embedding=emb,
                extra=chunk.get("extra", {}),
            )
            rows.append(row)
        self.session.add_all(rows)
        await self.session.flush()
        return len(rows)
