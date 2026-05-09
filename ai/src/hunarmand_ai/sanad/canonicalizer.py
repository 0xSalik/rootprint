"""Deterministic JSON canonicalisation (RFC 8785, JCS).

Why we care:
* Two systems must hash the *same* bytes for the *same* logical payload,
  no matter the language, library, or insertion order.
* RFC 8785 (https://datatracker.ietf.org/doc/html/rfc8785) defines
  exactly that.

We delegate to the ``rfc8785`` package when available; if a future
version of Python or the package breaks, we fall back to a minimal
in-house implementation that handles the subset we need (no NaN/Inf,
no bigints, plain ASCII keys).
"""

from __future__ import annotations

import base64
import hashlib
import json
from typing import Any

try:
    import rfc8785  # type: ignore[import-untyped]

    _HAS_RFC8785 = True
except Exception:  # noqa: BLE001
    _HAS_RFC8785 = False


def canonicalize(payload: Any) -> bytes:
    """Return the RFC 8785 canonical form as UTF-8 bytes."""

    if _HAS_RFC8785:
        return rfc8785.dumps(_to_jsonable(payload))
    return _fallback_canonicalize(payload)


def sha256_b64url(data: bytes) -> str:
    digest = hashlib.sha256(data).digest()
    return base64.urlsafe_b64encode(digest).rstrip(b"=").decode("ascii")


def _to_jsonable(obj: Any) -> Any:
    """Convert pydantic models / sets / datetimes / UUIDs to JSON-safe."""

    from datetime import date, datetime
    from decimal import Decimal
    from uuid import UUID

    if hasattr(obj, "model_dump"):
        return _to_jsonable(obj.model_dump(mode="json"))
    if isinstance(obj, dict):
        return {str(k): _to_jsonable(v) for k, v in obj.items()}
    if isinstance(obj, list | tuple):
        return [_to_jsonable(v) for v in obj]
    if isinstance(obj, set | frozenset):
        return sorted(_to_jsonable(v) for v in obj)
    if isinstance(obj, datetime):
        return obj.isoformat().replace("+00:00", "Z")
    if isinstance(obj, date):
        return obj.isoformat()
    if isinstance(obj, UUID):
        return str(obj)
    if isinstance(obj, Decimal):
        # Canonical numeric — same as RFC 8785 number rules.
        return float(obj)
    if isinstance(obj, bytes | bytearray):
        return base64.urlsafe_b64encode(bytes(obj)).rstrip(b"=").decode("ascii")
    return obj


def _fallback_canonicalize(obj: Any) -> bytes:
    obj = _to_jsonable(obj)
    return json.dumps(
        obj,
        sort_keys=True,
        ensure_ascii=False,
        separators=(",", ":"),
        allow_nan=False,
    ).encode("utf-8")
