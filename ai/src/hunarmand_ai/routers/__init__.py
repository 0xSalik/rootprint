"""FastAPI routers."""

from . import asr, ask, embed, extract, health, interview, sanad

ALL_ROUTERS = [
    health.router,
    asr.router,
    interview.router,
    extract.router,
    ask.router,
    embed.router,
    sanad.router,
]

__all__ = ["ALL_ROUTERS", "asr", "ask", "embed", "extract", "health", "interview", "sanad"]
