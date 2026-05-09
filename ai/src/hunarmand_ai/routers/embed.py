"""Embedding endpoint.

A thin HTTP shim over ``hunarmand_ai.rag.embedder.Embedder`` so external
services (the Hunarmand backend, primarily) can request query-time
embeddings without taking a hard dependency on the AI core's Python
package or shipping their own embedding model.

The ``provider`` and ``dimensions`` fields in the response let the
caller verify that they are about to insert vectors into a pgvector
column with a matching dimension.
"""

from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel, ConfigDict, Field

from ..config import get_settings
from ..rag import get_embedder

router = APIRouter(prefix="/embed", tags=["embed"])


class EmbedRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    inputs: list[str] = Field(min_length=1, max_length=256)


class EmbedResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    provider: str
    model: str
    dimensions: int
    embeddings: list[list[float]]


@router.post("", response_model=EmbedResponse)
async def embed(req: EmbedRequest) -> EmbedResponse:
    settings = get_settings()
    embedder = get_embedder()
    vectors = await embedder.embed_texts(req.inputs)
    return EmbedResponse(
        provider=settings.embedding_provider,
        model=settings.embedding_model,
        dimensions=settings.embedding_dimensions,
        embeddings=vectors,
    )
