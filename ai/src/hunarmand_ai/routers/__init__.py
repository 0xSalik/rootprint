"""FastAPI routers."""

from . import asr, ask, extract, health, interview, sanad

ALL_ROUTERS = [
    health.router,
    asr.router,
    interview.router,
    extract.router,
    ask.router,
    sanad.router,
]

__all__ = ["ALL_ROUTERS", "asr", "ask", "extract", "health", "interview", "sanad"]
