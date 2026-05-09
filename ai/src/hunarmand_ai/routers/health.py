"""Health and readiness probes."""

from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel

from ..config import get_settings

router = APIRouter(prefix="", tags=["health"])


class Health(BaseModel):
    status: str
    env: str
    version: str
    asr_ladder: list[str]
    llm_provider: str
    llm_model: str


@router.get("/healthz", response_model=Health)
async def healthz() -> Health:
    s = get_settings()
    from .. import __version__

    return Health(
        status="ok",
        env=s.env,
        version=__version__,
        asr_ladder=s.asr_ladder_list,
        llm_provider=s.llm_provider,
        llm_model=s.llm_model,
    )


@router.get("/")
async def root() -> dict:
    from .. import __version__

    return {
        "name": "hunarmand-ai",
        "version": __version__,
        "docs": "/docs",
    }
