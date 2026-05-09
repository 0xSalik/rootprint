"""Alembic environment.

We share the runtime app's database URL normaliser (``normalize_postgres_url``
in ``app.core.database``) so that pasting Neon's raw connection string
into ``HUNARMAND_DATABASE_URL`` works for migrations the same way it
works for the live FastAPI app:

* bare ``postgresql://`` and the legacy ``postgres://`` alias are
  auto-promoted to ``postgresql+asyncpg://`` (otherwise SQLAlchemy
  infers ``psycopg2``, which is sync, and ``async_engine_from_config``
  raises::

    sqlalchemy.exc.InvalidRequestError:
      The asyncio extension requires an async driver to be used.
      The loaded 'psycopg2' is not async.

* libpq-only query params (``sslmode``, ``channel_binding``,
  ``application_name``, etc.) are stripped, and ``sslmode=require`` is
  translated to asyncpg's ``connect_args={"ssl": "require"}``.

This means a single ``HUNARMAND_DATABASE_URL`` value works for the
running app, alembic, and the demo seed script.
"""

import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine

from alembic import context

from app.core.config import settings
from app.core.database import Base, normalize_postgres_url
# Import all models here so Alembic can discover them.
from app.models import models  # noqa: F401

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here for 'autogenerate' support
target_metadata = Base.metadata

# Resolve + normalise the URL ONCE, so all alembic commands (upgrade,
# revision --autogenerate, downgrade) use the same connection params.
_RUNTIME_URL, _RUNTIME_CONNECT_ARGS = normalize_postgres_url(
    settings.SQLALCHEMY_DATABASE_URI
)

# Mirror the normalised URL into the Config so anything that reads
# ``sqlalchemy.url`` (offline mode, autogenerate metadata diff) sees it.
config.set_main_option("sqlalchemy.url", _RUNTIME_URL)


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    context.configure(
        url=_RUNTIME_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Create an async engine using the normalised URL + connect args."""

    connectable: AsyncEngine = create_async_engine(
        _RUNTIME_URL,
        poolclass=pool.NullPool,
        connect_args=_RUNTIME_CONNECT_ARGS,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
