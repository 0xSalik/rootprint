"""Timeout + fallback wrapper used by every slow endpoint."""

from __future__ import annotations

import asyncio
import os
import random
from dataclasses import dataclass
from typing import Awaitable, Callable, TypeVar

import structlog

log = structlog.get_logger(__name__)

T = TypeVar("T")


@dataclass(frozen=True)
class FallbackPolicy:
    """Per-endpoint timeout + enable flag."""

    name: str
    timeout_s: float
    enabled: bool = True


_DEFAULT_TIMEOUT = float(os.getenv("HUNARMAND_FALLBACK_TIMEOUT_DEFAULT", "8"))


_POLICIES: dict[str, FallbackPolicy] = {
    "ask": FallbackPolicy(
        name="ask",
        timeout_s=float(os.getenv("HUNARMAND_FALLBACK_TIMEOUT_ASK", "10")),
    ),
    "extract": FallbackPolicy(
        name="extract",
        timeout_s=float(os.getenv("HUNARMAND_FALLBACK_TIMEOUT_EXTRACT", "20")),
    ),
    "asr": FallbackPolicy(
        name="asr",
        timeout_s=float(os.getenv("HUNARMAND_FALLBACK_TIMEOUT_ASR", "15")),
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
    """Race ``coro`` against the policy's timeout.

    On timeout OR any exception raised by ``coro``, return
    ``fallback`` (calling it if it's callable). The reason is logged
    via structlog so operators can see in production logs how often
    the fallback path fires.

    If fallbacks are globally disabled (``HUNARMAND_FALLBACK_ENABLED=0``)
    the original coroutine runs to completion / failure and we re-raise
    its exception. Useful for debugging / CI.
    """

    pol = policy if isinstance(policy, FallbackPolicy) else get_fallback_policy(policy)

    if not fallback_enabled() or not pol.enabled:
        return await coro  # type: ignore[no-any-return]

    try:
        return await asyncio.wait_for(coro, timeout=pol.timeout_s)
    except asyncio.TimeoutError:
        log.warning("fallback.fired", endpoint=pol.name, reason="timeout", timeout_s=pol.timeout_s)
        return _materialise(fallback)
    except Exception as exc:  # noqa: BLE001
        log.warning(
            "fallback.fired",
            endpoint=pol.name,
            reason=type(exc).__name__,
            error=str(exc)[:200],
        )
        return _materialise(fallback)


def _materialise(fallback: Callable[[], T] | T) -> T:
    if callable(fallback):
        return fallback()  # type: ignore[no-any-return]
    return fallback  # type: ignore[return-value]


# ── Rotation helpers ────────────────────────────────────────────────────────


def pick_one(pool: list[T], seed_key: str | None = None) -> T:
    """Pick one item from ``pool``.

    If ``seed_key`` is supplied (e.g. master_id + question), the choice
    is deterministic for that key but mixed with a process-local nonce
    so consecutive cold-starts see different items. Otherwise just a
    random pick.
    """

    if not pool:
        raise ValueError("fallback pool is empty")
    if seed_key is None:
        return random.choice(pool)
    rng = random.Random((seed_key + os.getenv("HUNARMAND_RUN_NONCE", "")).encode("utf-8"))
    return rng.choice(pool)
