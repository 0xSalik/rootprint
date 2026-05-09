"""Craft DNA extraction endpoint."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel, ConfigDict, Field

from ..extractor import get_extractor
from ..schemas.craft_dna import CraftDNA

router = APIRouter(prefix="/extract", tags=["extract"])


class ExtractRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    master_id: str
    primary_language: str = "ks"
    chunks_by_pass: dict[str, list[dict[str, Any]]] = Field(
        description=(
            "Map of pass_id ('lineage'|'technique'|'decisions'|'suppliers') to a "
            "list of transcript chunks. Each chunk needs at least: chunk_id, "
            "text, timestamp_start_s, timestamp_end_s, language."
        )
    )


class ExtractResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    craft_dna: CraftDNA
    vulnerability_index: float


@router.post("", response_model=ExtractResponse)
async def extract(req: ExtractRequest) -> ExtractResponse:
    extractor = get_extractor()
    dna = await extractor.extract(
        master_id=req.master_id,
        primary_language=req.primary_language,
        chunks_by_pass=req.chunks_by_pass,  # type: ignore[arg-type]
    )
    return ExtractResponse(
        craft_dna=dna, vulnerability_index=dna.knowledge_vulnerability_index()
    )
