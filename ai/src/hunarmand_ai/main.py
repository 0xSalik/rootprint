"""FastAPI application factory."""

from __future__ import annotations

from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import __version__
from .config import get_settings
from .db import create_all_tables
from .logging import configure_logging, get_logger
from .routers import ALL_ROUTERS

configure_logging()
log = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):  # noqa: ANN201
    settings = get_settings()
    log.info(
        "hunarmand.startup",
        version=__version__,
        env=settings.env,
        llm=settings.llm_provider,
        asr_ladder=settings.asr_ladder_list,
    )
    if settings.env in {"development", "test"}:
        try:
            await create_all_tables()
        except Exception as exc:  # noqa: BLE001
            log.warning("hunarmand.db.init_skipped", error=str(exc))
    yield
    log.info("hunarmand.shutdown")


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="Hunarmand AI Core",
        version=__version__,
        description=(
            "Vault interviewer, Craft DNA extractor, ASR pipeline, RAG, and "
            "cryptographic Sanad service for the Hunarmand platform."
        ),
        lifespan=lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    for r in ALL_ROUTERS:
        app.include_router(r)
    return app


app = create_app()


def main() -> None:
    import uvicorn

    settings = get_settings()
    uvicorn.run(
        "hunarmand_ai.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.env == "development",
    )


if __name__ == "__main__":
    main()
