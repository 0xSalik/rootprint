"""Ask the Hunarmand endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_session
from ..fallbacks import build_ask_fallback, run_with_fallback
from ..rag import AskHunarmand
from ..schemas.rag import AskRequest, AskResponse

router = APIRouter(prefix="/ask", tags=["ask"])


@router.post("", response_model=AskResponse)
async def ask(
    req: AskRequest,
    session: AsyncSession = Depends(get_session),
) -> AskResponse:
    service = AskHunarmand(session=session)
    return await run_with_fallback(
        coro=service.ask(req),
        fallback=lambda: build_ask_fallback(req),
        policy="ask",
    )
