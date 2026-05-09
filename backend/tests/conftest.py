"""Shared test config — keep envs deterministic, no external services."""

from __future__ import annotations

import os

os.environ.setdefault("AI_CORE_URL", "http://ai-core.test")
os.environ.setdefault("SECRET_KEY", "test-secret-key-do-not-use-in-prod")
os.environ.setdefault("RUN_INLINE_TASKS", "1")
os.environ.setdefault("HUNARMAND_LOG_LEVEL", "WARNING")
