"""Timeout + fallback wrapper for slow backend endpoints."""

from __future__ import annotations

import asyncio
import logging
import os
import random
from dataclasses import dataclass
from typing import Awaitable, Callable, TypeVar

log = logging.getLogger(__name__)

T = TypeVar("T")


@dataclass(frozen=True)
class FallbackPolicy:
    name: str
    timeout_s: float
    enabled: bool = True


_DEFAULT_TIMEOUT = float(os.getenv("HUNARMAND_FALLBACK_TIMEOUT_DEFAULT", "8"))

_POLICIES: dict[str, FallbackPolicy] = {
    "search": FallbackPolicy(
        name="search",
        timeout_s=float(os.getenv("HUNARMAND_FALLBACK_TIMEOUT_SEARCH", "8")),
    ),
    "ask": FallbackPolicy(
        name="ask",
        timeout_s=float(os.getenv("HUNARMAND_FALLBACK_TIMEOUT_ASK", "12")),
    ),
}


def fallback_enabled() -> bool:
    raw = os.getenv("HUNARMAND_FALLBACK_ENABLED", "1").strip().lower()
    return raw in {"1", "true", "yes", "on"}


def get_fallback_policy(name: str) -> FallbackPolicy:
    return _POLICIES.get(
        name, FallbackPolicy(name=name, timeout_s=_DEFAULT_TIMEOUT, enabled=True)
    )


async def run_with_fallback(
    *,
    coro: Awaitable[T],
    fallback: Callable[[], T] | T,
    policy: FallbackPolicy | str,
) -> T:
    pol = policy if isinstance(policy, FallbackPolicy) else get_fallback_policy(policy)

    if not fallback_enabled() or not pol.enabled:
        return await coro  # type: ignore[no-any-return]

    try:
        return await asyncio.wait_for(coro, timeout=pol.timeout_s)
    except asyncio.TimeoutError:
        log.warning("fallback.fired endpoint=%s reason=timeout timeout_s=%s", pol.name, pol.timeout_s)
        return _materialise(fallback)
    except Exception as exc:  # noqa: BLE001
        log.warning(
            "fallback.fired endpoint=%s reason=%s error=%s",
            pol.name, type(exc).__name__, str(exc)[:200],
        )
        return _materialise(fallback)


def _materialise(fallback: Callable[[], T] | T) -> T:
    if callable(fallback):
        return fallback()  # type: ignore[no-any-return]
    return fallback  # type: ignore[return-value]


def pick_one(pool: list[T]) -> T:
    if not pool:
        raise ValueError("fallback pool is empty")
    return random.choice(pool)
