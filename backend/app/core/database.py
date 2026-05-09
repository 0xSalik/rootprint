"""Async SQLAlchemy + asyncpg engine setup.

Includes URL normalisation so Neon's connection strings (which now ship
with ``?sslmode=require&channel_binding=require`` by default) work
out of the box. asyncpg cannot parse libpq-only query parameters and
will mis-interpret the database name otherwise — surfacing as::

    asyncpg.exceptions.InvalidCatalogNameError:
      database "neondb&channel_binding=require" does not exist

We strip those params and translate ``sslmode`` to asyncpg's own
``ssl`` connect-arg.
"""

from typing import Any
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base

from app.core.config import settings


_LIBPQ_ONLY_PARAMS = frozenset(
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
    """Return ``(url, connect_args)`` that asyncpg can consume."""

    if not url:
        return url, {}

    parsed = urlparse(url)
    scheme = parsed.scheme
    if scheme == "postgresql":
        scheme = "postgresql+asyncpg"
    elif scheme == "postgres":
        scheme = "postgresql+asyncpg"
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

    for key in list(params):
        if key in _LIBPQ_ONLY_PARAMS:
            params.pop(key)

    new_query = urlencode(params)
    new_url = urlunparse(
        (scheme, parsed.netloc, parsed.path, parsed.params, new_query, parsed.fragment)
    )
    return new_url, connect_args


_url, _connect_args = normalize_postgres_url(settings.SQLALCHEMY_DATABASE_URI)

engine = create_async_engine(
    _url,
    echo=False,
    pool_pre_ping=True,
    connect_args=_connect_args,
)

AsyncSessionLocal = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

Base = declarative_base()


# Dependency
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
