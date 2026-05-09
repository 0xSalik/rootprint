"""``BACKEND_CORS_ORIGINS`` must parse cleanly from any sane env shape.

Pydantic-settings v2's eager JSON-decode of complex field types
(``List[AnyHttpUrl]``) blew up on the comma-separated form Render
passes; we keep this test so the regression can't sneak back in.
"""

from __future__ import annotations

import importlib
import os
import sys

import pytest


def _reload_settings():
    """Re-import config under the current env so each test sees its own."""

    if "app.core.config" in sys.modules:
        del sys.modules["app.core.config"]
    return importlib.import_module("app.core.config").settings


@pytest.fixture(autouse=True)
def _restore_env():
    """Snapshot + restore the CORS env var around each test."""

    sentinel = object()
    prev = os.environ.get("BACKEND_CORS_ORIGINS", sentinel)
    yield
    if prev is sentinel:
        os.environ.pop("BACKEND_CORS_ORIGINS", None)
    else:
        os.environ["BACKEND_CORS_ORIGINS"] = prev  # type: ignore[arg-type]


def test_comma_separated_form_does_not_crash() -> None:
    os.environ["BACKEND_CORS_ORIGINS"] = "https://app.vercel.app,http://localhost:3000"
    s = _reload_settings()
    assert s.cors_origins_list == [
        "https://app.vercel.app",
        "http://localhost:3000",
    ]


def test_single_origin() -> None:
    os.environ["BACKEND_CORS_ORIGINS"] = "https://app.vercel.app"
    s = _reload_settings()
    assert s.cors_origins_list == ["https://app.vercel.app"]


def test_wildcard() -> None:
    os.environ["BACKEND_CORS_ORIGINS"] = "*"
    s = _reload_settings()
    assert s.cors_origins_list == ["*"]


def test_json_array_form_also_works() -> None:
    os.environ["BACKEND_CORS_ORIGINS"] = '["https://a.vercel.app","https://b.vercel.app"]'
    s = _reload_settings()
    assert s.cors_origins_list == ["https://a.vercel.app", "https://b.vercel.app"]


def test_empty_means_deny_all() -> None:
    os.environ["BACKEND_CORS_ORIGINS"] = ""
    s = _reload_settings()
    assert s.cors_origins_list == []


def test_unset_means_deny_all() -> None:
    os.environ.pop("BACKEND_CORS_ORIGINS", None)
    s = _reload_settings()
    assert s.cors_origins_list == []


def test_trailing_slashes_normalised() -> None:
    os.environ["BACKEND_CORS_ORIGINS"] = "https://a.vercel.app/,http://localhost:3000/"
    s = _reload_settings()
    assert s.cors_origins_list == ["https://a.vercel.app", "http://localhost:3000"]


def test_extra_whitespace_tolerated() -> None:
    os.environ["BACKEND_CORS_ORIGINS"] = " https://a.vercel.app ,  http://localhost:3000  "
    s = _reload_settings()
    assert s.cors_origins_list == ["https://a.vercel.app", "http://localhost:3000"]
