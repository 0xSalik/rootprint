"""Async SQLAlchemy + pgvector wiring.

URL normalisation
-----------------

asyncpg does not understand libpq-only query parameters
(``sslmode``, ``channel_binding``, ``application_name``, etc.).
SQLAlchemy passes the URL straight through to asyncpg, which then
mis-parses the database name and dies with::

    asyncpg.exceptions.InvalidCatalogNameError:
      database "neondb&channel_binding=require" does not exist

Neon's connection strings now ship with ``?sslmode=require&channel_binding=require``
out of the box, so every new teammate hits this. We sanitise the URL
on startup:

* drop libpq-only query params,
* translate ``sslmode=require|verify-ca|verify-full`` -> asyncpg's
  ``connect_args={"ssl": "require"}``,
* auto-promote bare ``postgresql://`` to ``postgresql+asyncpg://`` so
  pasting Neon's raw URL Just Works.
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Any
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

import structlog
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from .config import get_settings

log = structlog.get_logger(__name__)


_LIBPQ_ONLY_PARAMS: frozenset[str] = frozenset(
    {
        "sslmode",
        "channel_binding",
        "application_name",
        "connect_timeout",
        "options",
        "passfile",
        "service",
        "sslcompression",
        "sslcert",
        "sslkey",
        "sslrootcert",
        "sslcrl",
        "gssencmode",
        "krbsrvname",
        "target_session_attrs",
    }
)


def normalize_postgres_url(url: str) -> tuple[str, dict[str, Any]]:
    """Return a ``(url, connect_args)`` pair that asyncpg can consume."""

    if not url:
        return url, {}

    parsed = urlparse(url)
    scheme = parsed.scheme

    # Auto-promote bare drivers to asyncpg.
    if scheme == "postgresql":
        scheme = "postgresql+asyncpg"
    elif scheme == "postgres":  # legacy alias
        scheme = "postgresql+asyncpg"

    # Only do anything for postgres URLs.
    if not scheme.startswith("postgresql"):
        return url, {}

    params = dict(parse_qsl(parsed.query, keep_blank_values=False))

    connect_args: dict[str, Any] = {}
    sslmode = params.pop("sslmode", None)
    if sslmode in {"require", "verify-ca", "verify-full"}:
        connect_args["ssl"] = "require"
    elif sslmode == "prefer":
        connect_args["ssl"] = "prefer"
    elif sslmode == "disable":
        connect_args["ssl"] = False

    stripped: list[str] = []
    for key in list(params):
        if key in _LIBPQ_ONLY_PARAMS:
            params.pop(key)
            stripped.append(key)

    new_query = urlencode(params)
    new_url = urlunparse(
        (
            scheme,
            parsed.netloc,
            parsed.path,
            parsed.params,
            new_query,
            parsed.fragment,
        )
    )

    if stripped or scheme != parsed.scheme:
        log.info(
            "db.url.normalized",
            scheme_changed=scheme != parsed.scheme,
            stripped_libpq_params=stripped,
            translated_sslmode=sslmode,
        )

    return new_url, connect_args


def _build_engine() -> tuple[object, async_sessionmaker[AsyncSession]]:
    settings = get_settings()
    url, connect_args = normalize_postgres_url(settings.database_url)
    engine = create_async_engine(
        url,
        echo=False,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
        connect_args=connect_args,
    )
    factory = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    return engine, factory


_engine, _session_factory = _build_engine()


def get_engine() -> object:
    return _engine


def get_session_factory() -> async_sessionmaker[AsyncSession]:
    return _session_factory


async def get_session() -> AsyncIterator[AsyncSession]:
    """FastAPI dependency for an open session."""

    async with _session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


@asynccontextmanager
async def session_scope() -> AsyncIterator[AsyncSession]:
    """Async-context-manager flavour for scripts and background jobs."""

    async with _session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def create_all_tables() -> None:
    """Create AI-core-owned tables (and the pgvector extension).

    Production-on-the-shared-Neon-DB note
    --------------------------------------

    The Hunarmand backend service owns the canonical schemas for
    ``masters`` and ``sanads`` (Track-A's models). The AI core
    declares ``MasterRow`` only as a SQLAlchemy ORM target for FK
    constraints (it is never read or written by AI-core code), and
    ``SanadRow`` lives under a non-colliding name (``ai_sanads``) so
    the two services can share the same Postgres database.

    To avoid colliding with the backend's alembic migrations:

    * ``masters`` is in the skip-list — the backend's alembic creates
      it. AI-core FKs to ``masters.id`` resolve against that.
    * Every other AI-core table (``master_keys``, ``vault_chunks``,
      ``interview_*``, ``craft_dna_records``, ``ai_sanads``) is
      created here on first boot.

    Set ``HUNARMAND_SKIP_AUTO_MIGRATE=1`` to disable this entirely if
    you'd rather drive every table through alembic.
    """

    from sqlalchemy import text  # local import avoids polluting top-level
    from .models.base import Base  # noqa: WPS433 — circular at import time

    # Tables owned by the backend service when sharing a DB.
    skip = {"masters"}

    async with _engine.begin() as conn:  # type: ignore[union-attr]
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        ai_only_tables = [
            t for t in Base.metadata.sorted_tables if t.name not in skip
        ]
        await conn.run_sync(
            lambda c: Base.metadata.create_all(c, tables=ai_only_tables)
        )
