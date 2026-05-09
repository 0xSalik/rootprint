"""'Ask the Hunarmand' endpoint.

A thin authenticated proxy to the AI core's RAG-backed Q&A service.
Wrapped with a per-endpoint timeout — if the AI core is slow we surface
a curated answer so the frontend always has something to render.
"""

from __future__ import annotations

import logging
from typing import Optional
import uuid

from fastapi import APIRouter
from pydantic import BaseModel, ConfigDict

from app.clients.ai_core import get_ai_core_client
from app.fallbacks import build_ask_fallback, run_with_fallback

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
    coro = client.ask(
        master_id=str(req.master_id),
        question=req.question,
        answer_language=req.answer_language,
        top_k=req.top_k,
    )
    return await run_with_fallback(
        coro=coro,
        fallback=lambda: build_ask_fallback(
            master_id=str(req.master_id),
            question=req.question,
            answer_language=req.answer_language,
        ),
        policy="ask",
    )
