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
        embedding_provider=settings.embedding_provider,
        asr_ladder=settings.asr_ladder_list,
    )

    # Auto-create tables and the pgvector extension on every boot. The
    # operations are idempotent (`CREATE TABLE IF NOT EXISTS`,
    # `CREATE EXTENSION IF NOT EXISTS vector`), so this is safe on
    # restart and on first deploy alike. Set
    # ``HUNARMAND_SKIP_AUTO_MIGRATE=1`` to opt out (e.g. when you run
    # Alembic externally).
    import os

    if os.getenv("HUNARMAND_SKIP_AUTO_MIGRATE", "").lower() not in {"1", "true", "yes"}:
        try:
            await create_all_tables()
            log.info("hunarmand.db.ready")
        except Exception as exc:  # noqa: BLE001
            # Don't crash the app — `/healthz` will still answer and the
            # operator can fix DATABASE_URL via the Space's secrets UI
            # without rebuilding.
            log.warning("hunarmand.db.init_failed", error=str(exc))

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
