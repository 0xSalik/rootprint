"""Semantic search over CraftDNA rows.

Uses pgvector's L2 distance operator (``<->``). Query embeddings come
from the AI core's ``/embed`` endpoint so the model used for query
vectors matches the model used to populate the column at ingest time
(``intfloat/multilingual-e5-small`` by default — 384 dims).

The response shape ``[{id, master_id, technique_name, translated_transcript,
similarity_score}, ...]`` is **unchanged from the original A1 contract**
in HANDOVER.md, so the frontend integration is byte-for-byte identical.
"""

from __future__ import annotations

import logging
from typing import List
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.clients.ai_core import AICoreClient, AICoreError, get_ai_core_client
from app.core.config import settings
from app.core.database import get_db
from app.fallbacks import build_search_fallback, run_with_fallback
from app.models.models import CraftDNA

log = logging.getLogger(__name__)
router = APIRouter()


class SearchResult(BaseModel):
    id: uuid.UUID
    master_id: uuid.UUID
    technique_name: str
    translated_transcript: str
    similarity_score: float

    class Config:
        from_attributes = True


async def _embed_query(client: AICoreClient, query: str) -> list[float]:
    """Get a real embedding for the query, with a defensive fallback.

    If the AI core is unreachable we degrade to a deterministic
    pseudo-vector so the endpoint stays available — search results
    will be useless but the frontend's UI contract is preserved.
    """

    try:
        resp = await client.embed([query])
    except AICoreError as exc:
        log.warning("search.embed_failed err=%s", exc)
        return _fallback_vector(query)

    embeddings = resp.get("embeddings") or []
    dim = int(resp.get("dimensions") or 0)
    if not embeddings or not embeddings[0]:
        return _fallback_vector(query)
    if dim and dim != settings.HUNARMAND_EMBEDDING_DIMENSIONS:
        log.warning(
            "search.dim_mismatch ai_core=%d backend=%d (rejecting; check HUNARMAND_EMBEDDING_DIMENSIONS)",
            dim, settings.HUNARMAND_EMBEDDING_DIMENSIONS,
        )
        return _fallback_vector(query)
    return embeddings[0]


def _fallback_vector(query: str) -> list[float]:
    """Deterministic placeholder vector seeded by the query text.

    Useful only as a last-resort fallback. Real semantic search needs
    the AI core to be reachable.
    """

    import hashlib
    import struct

    digest = hashlib.sha256(query.encode("utf-8")).digest()
    seed = struct.unpack(">I", digest[:4])[0]
    rng = _Lcg(seed)
    return [rng.next_unit() for _ in range(settings.HUNARMAND_EMBEDDING_DIMENSIONS)]


class _Lcg:
    """Tiny linear congruential generator — deterministic, no numpy."""

    def __init__(self, seed: int) -> None:
        self.state = seed or 1

    def next_unit(self) -> float:
        self.state = (self.state * 1103515245 + 12345) & 0x7FFFFFFF
        return (self.state / 0x7FFFFFFF) * 2.0 - 1.0


async def _real_search(
    *,
    query: str,
    limit: int,
    db: AsyncSession,
) -> list[dict]:
    client = get_ai_core_client()
    query_vector = await _embed_query(client, query)

    stmt = (
        select(
            CraftDNA,
            CraftDNA.embedding.l2_distance(query_vector).label("distance"),
        )
        .where(CraftDNA.embedding.isnot(None))
        .order_by(CraftDNA.embedding.l2_distance(query_vector))
        .limit(limit)
    )
    result = await db.execute(stmt)
    rows = result.all()

    out: list[dict] = []
    for craft_dna, distance in rows:
        similarity = max(0.0, min(1.0, 1.0 - (float(distance) / 2.0)))
        out.append(
            {
                "id": craft_dna.id,
                "master_id": craft_dna.master_id,
                "technique_name": craft_dna.technique_name or "Unknown Technique",
                "translated_transcript": craft_dna.translated_transcript or "",
                "similarity_score": similarity,
            }
        )
    # If the seeded DB is empty, surface curated content so the
    # frontend has results to render.
    if not out:
        return build_search_fallback(query=query, limit=limit)
    return out


@router.get("/techniques", response_model=List[SearchResult])
async def search_techniques(
    query: str,
    limit: int = 5,
    db: AsyncSession = Depends(get_db),
):
    """
    Semantic search using pgvector.

    Embeds the query via the AI core (``/embed``) and orders CraftDNA
    rows by L2 distance. If the AI core is slow or pgvector is empty
    we surface curated technique results so the frontend never has to
    render an empty list.

    Response shape locked by ``test_search_contract.py``.
    """

    if not query:
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    return await run_with_fallback(
        coro=_real_search(query=query, limit=limit, db=db),
        fallback=lambda: build_search_fallback(query=query, limit=limit),
        policy="search",
    )
