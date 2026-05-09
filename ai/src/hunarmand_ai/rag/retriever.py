"""Vector retrieval over the Vault chunks for a single master.

We use pgvector cosine distance and convert it to a normalised
similarity score in [0, 1] so the threshold logic in
``AskHunarmand`` reads naturally.
"""

from __future__ import annotations

import structlog
from sqlalchemy import bindparam, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import get_settings
from ..models.vault_chunk import VaultChunkRow
from ..schemas.rag import RetrievedChunk
from .embedder import Embedder, get_embedder

log = structlog.get_logger(__name__)


class VaultRetriever:
    def __init__(self, session: AsyncSession, embedder: Embedder | None = None) -> None:
        self.session = session
        self.embedder = embedder or get_embedder()
        self.settings = get_settings()

    async def retrieve(
        self,
        *,
        master_id: str,
        query: str,
        top_k: int | None = None,
    ) -> list[RetrievedChunk]:
        if not query.strip():
            return []
        top_k = top_k or self.settings.rag_top_k

        [embedding] = await self.embedder.embed_texts([query])

        # We use raw SQL to project the cosine *similarity* (1 - distance)
        # so the score is comparable to the threshold settings.
        sql = text(
            """
            SELECT id, master_id, session_id, pass_id, text, text_en, language,
                   timestamp_start_s, timestamp_end_s, audio_uri,
                   1 - (embedding <=> :emb) AS similarity
              FROM vault_chunks
             WHERE master_id = :master_id
               AND embedding IS NOT NULL
             ORDER BY embedding <=> :emb
             LIMIT :limit
            """
        ).bindparams(
            bindparam("emb"),
            bindparam("master_id"),
            bindparam("limit"),
        )

        result = await self.session.execute(
            sql,
            {"emb": embedding, "master_id": master_id, "limit": top_k},
        )
        rows = result.mappings().all()

        return [
            RetrievedChunk(
                chunk_id=str(r["id"]),
                master_id=str(r["master_id"]),
                pass_id=r["pass_id"],
                text=r["text"],
                text_en=r["text_en"],
                timestamp_start_s=float(r["timestamp_start_s"]),
                timestamp_end_s=float(r["timestamp_end_s"]),
                language=r["language"],
                audio_uri=r["audio_uri"],
                score=float(r["similarity"]),
            )
            for r in rows
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
