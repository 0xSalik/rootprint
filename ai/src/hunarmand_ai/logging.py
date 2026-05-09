"""Structured logging using ``structlog``.

We stream JSON in production and human-pretty logs in development.
Every log record has the same shape so it is grep-able and ingestable.

We back ``structlog`` with the stdlib ``logging`` module so that:

* ``add_logger_name`` works (PrintLogger has no ``.name``),
* uvicorn's own access / error logs share the same handlers,
* tools like Sentry / OpenTelemetry / pytest log capture all hook in
  through their existing stdlib integrations.
"""

from __future__ import annotations

import logging
import sys

import structlog

from .config import get_settings


def configure_logging() -> None:
    settings = get_settings()
    level = getattr(logging, settings.log_level.upper(), logging.INFO)

    # Configure stdlib first so any logger structlog creates inherits
    # the right level and a single stdout handler.
    logging.basicConfig(
        level=level,
        format="%(message)s",
        stream=sys.stdout,
        force=True,  # avoid duplicate handlers when uvicorn --reload re-imports us
    )

    shared_processors: list[structlog.types.Processor] = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.TimeStamper(fmt="iso", utc=True),
    ]

    if settings.env in {"development", "test"}:
        renderer: structlog.types.Processor = structlog.dev.ConsoleRenderer(colors=True)
    else:
        renderer = structlog.processors.JSONRenderer()

    structlog.configure(
        processors=[*shared_processors, renderer],
        wrapper_class=structlog.stdlib.BoundLogger,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )


def get_logger(name: str | None = None) -> structlog.stdlib.BoundLogger:
    return structlog.get_logger(name) if name else structlog.get_logger()
