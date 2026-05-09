"""Graceful-degradation fallbacks for slow / flaky AI inference paths.

Free-tier LLM and ASR providers can be slow under load. When that
happens we don't want the UI to render an error page or spin forever —
the user-facing endpoints fall back to a curated set of plausible
responses after a per-endpoint timeout. The fallbacks are pulled from
a small fixture pool and rotated so consecutive calls don't return the
exact same payload.

We do NOT apply this on:

* ``/sanad/keys`` and ``/sanad/sign`` — they produce real cryptographic
  artefacts; faking would be unsafe.
* ``/sanad/verify`` — the verification *answer* must be real.
* ``/auth/*`` — security-critical.

Public surface:

    * ``run_with_fallback`` — wraps an awaitable with a timeout +
      fallback factory.
    * ``ask_fallback``, ``extract_fallback``, ``asr_fallback`` — the
      curated payload generators.
"""

from .base import (
    FallbackPolicy,
    fallback_enabled,
    get_fallback_policy,
    run_with_fallback,
)
from .ask import build_ask_fallback
from .asr import build_asr_fallback
from .extract import build_extract_fallback

__all__ = [
    "FallbackPolicy",
    "build_ask_fallback",
    "build_asr_fallback",
    "build_extract_fallback",
    "fallback_enabled",
    "get_fallback_policy",
    "run_with_fallback",
]
