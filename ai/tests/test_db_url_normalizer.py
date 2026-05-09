"""Postgres URL normaliser — strip libpq-only params, promote drivers."""

from __future__ import annotations

import pytest

from hunarmand_ai.db import normalize_postgres_url


def test_neon_default_url_strips_both_libpq_params() -> None:
    """The exact format Neon hands you in the dashboard."""

    raw = (
        "postgresql://neondb_owner:abc@ep-snowy-pooler.aws.neon.tech/neondb"
        "?sslmode=require&channel_binding=require"
    )
    url, args = normalize_postgres_url(raw)
    assert url == "postgresql+asyncpg://neondb_owner:abc@ep-snowy-pooler.aws.neon.tech/neondb"
    assert args == {"ssl": "require"}


def test_already_async_url_with_only_channel_binding() -> None:
    raw = (
        "postgresql+asyncpg://u:p@host/db?channel_binding=require"
    )
    url, args = normalize_postgres_url(raw)
    assert url == "postgresql+asyncpg://u:p@host/db"
    assert args == {}  # no sslmode -> no ssl arg added


def test_postgres_legacy_alias_promoted() -> None:
    raw = "postgres://u:p@host/db"
    url, args = normalize_postgres_url(raw)
    assert url.startswith("postgresql+asyncpg://")
    assert args == {}


def test_url_without_query_passes_through() -> None:
    raw = "postgresql+asyncpg://u:p@host/db"
    url, args = normalize_postgres_url(raw)
    assert url == raw
    assert args == {}


def test_sslmode_disable_translated() -> None:
    raw = "postgresql+asyncpg://u:p@host/db?sslmode=disable"
    url, args = normalize_postgres_url(raw)
    assert "sslmode" not in url
    assert args == {"ssl": False}


def test_unknown_scheme_unchanged() -> None:
    raw = "mysql://u:p@host/db?foo=bar"
    url, args = normalize_postgres_url(raw)
    assert url == raw
    assert args == {}


def test_other_libpq_params_stripped() -> None:
    raw = (
        "postgresql+asyncpg://u:p@host/db"
        "?sslmode=require&channel_binding=require&application_name=hunarmand"
        "&connect_timeout=10&options=-c%20statement_timeout%3D5000"
    )
    url, args = normalize_postgres_url(raw)
    # All the libpq-only ones are gone.
    for forbidden in ("sslmode", "channel_binding", "application_name", "connect_timeout", "options"):
        assert forbidden not in url
    assert args == {"ssl": "require"}


def test_empty_url() -> None:
    url, args = normalize_postgres_url("")
    assert url == ""
    assert args == {}


@pytest.mark.parametrize(
    "raw,expected_db",
    [
        (
            "postgresql://u:p@host/neondb?sslmode=require&channel_binding=require",
            "/neondb",
        ),
        (
            "postgresql+asyncpg://u:p@host:5432/some_db_name",
            "/some_db_name",
        ),
    ],
)
def test_database_path_preserved(raw: str, expected_db: str) -> None:
    url, _ = normalize_postgres_url(raw)
    # The path (database name) must be preserved exactly.
    assert expected_db in url
