"""'Ask the Hunarmand' endpoint.

A thin authenticated proxy to the AI core's RAG-backed Q&A service.
Buyers / learners ask a question about a specific master's Vault and
get a citation-grounded answer — or a refusal if the corpus doesn't
support the question.

We keep this open (no JWT required) because the frontend exposes it on
the public Sanad provenance page where any buyer can ask follow-up
questions about an authenticated piece. If you'd rather gate it, swap
the dependency to ``get_current_master`` like the other Sanad routes.
"""

from __future__ import annotations

import logging
from typing import Optional
import uuid

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict

from app.clients.ai_core import AICoreError, get_ai_core_client

log = logging.getLogger(__name__)
router = APIRouter()


class AskRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    master_id: uuid.UUID
    question: str
    answer_language: str = "en"
    top_k: Optional[int] = None


@router.post("")
async def ask(req: AskRequest) -> dict:
    client = get_ai_core_client()
    try:
        return await client.ask(
            master_id=str(req.master_id),
            question=req.question,
            answer_language=req.answer_language,
            top_k=req.top_k,
        )
    except AICoreError as exc:
        log.warning("ask.failed master=%s err=%s", req.master_id, exc)
        raise HTTPException(status_code=502, detail=f"AI core error: {exc}") from exc
