"""Backend graceful-degradation fallbacks.

Each slow / AI-inference path is wrapped with a per-endpoint timeout
and falls back to a curated payload when the timeout fires or the
upstream call errors. Same approach as the AI core's
``hunarmand_ai.fallbacks`` package, applied at the backend layer for
endpoints the frontend hits directly.

Not applied to:

* ``/auth/*`` — security
* ``/sanad/{keys,sign,verify}`` — security and cryptographic correctness
* ``/commerce/*`` — DB-only, fast

Applied to:

* ``/search/techniques`` — AI-core embed + pgvector
* ``/ask`` — AI-core RAG round-trip
"""

from .base import FallbackPolicy, fallback_enabled, run_with_fallback
from .ask import build_ask_fallback
from .search import build_search_fallback

__all__ = [
    "FallbackPolicy",
    "build_ask_fallback",
    "build_search_fallback",
    "fallback_enabled",
    "run_with_fallback",
]
