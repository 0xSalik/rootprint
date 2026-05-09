import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.api import api_router
from app.clients.ai_core import AICoreClient, AICoreError
from app.core.config import settings

# Configure stdlib logging before anything else writes records.
logging.basicConfig(
    level=getattr(logging, settings.HUNARMAND_LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
log = logging.getLogger("hunarmand_backend")


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

# CORS — defaults to no origins (deny everything) so production must
# explicitly opt in via BACKEND_CORS_ORIGINS. Accepts comma-separated,
# single origin, wildcard, or JSON-array formats — see
# ``Settings.cors_origins_list``.
_cors_origins = settings.cors_origins_list
if _cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=_cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {
        "message": "Welcome to the Hunarmand API",
        "docs": "/docs",
        "api_prefix": settings.API_V1_STR,
    }


@app.get("/healthz")
async def healthz():
    """Backend liveness + AI-core reachability probe.

    Frontend uses this for a status badge; ops use it to confirm the
    HF Space is reachable from wherever the backend is deployed.
    """

    ai_core_status: dict = {"reachable": False, "url": settings.AI_CORE_URL}
    try:
        result = await AICoreClient(timeout=5.0).healthz()
        ai_core_status.update({"reachable": True, **result})
    except AICoreError as exc:
        ai_core_status["error"] = str(exc)[:200]
    except Exception as exc:  # noqa: BLE001
        ai_core_status["error"] = f"{type(exc).__name__}: {exc}"[:200]

    return {
        "status": "ok",
        "project": settings.PROJECT_NAME,
        "embedding_dim": settings.HUNARMAND_EMBEDDING_DIMENSIONS,
        "run_inline_tasks": settings.RUN_INLINE_TASKS,
        "ai_core": ai_core_status,
    }


@app.on_event("startup")
async def _startup() -> None:
    log.info(
        "backend.startup project=%s ai_core=%s embedding_dim=%d inline_tasks=%s",
        settings.PROJECT_NAME,
        settings.AI_CORE_URL,
        settings.HUNARMAND_EMBEDDING_DIMENSIONS,
        settings.RUN_INLINE_TASKS,
    )
