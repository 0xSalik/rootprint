"""Shared test configuration."""

from __future__ import annotations

import os

# Force a deterministic, dev-only KEK before any module imports it.
os.environ.setdefault("HUNARMAND_KEK_SECRET", "test-kek-secret-do-not-use-in-prod")
os.environ.setdefault("HUNARMAND_ENV", "test")
os.environ.setdefault("HUNARMAND_LOG_LEVEL", "WARNING")
# Suppress accidental network calls in tests by leaving API keys empty.
os.environ.setdefault("OPENAI_API_KEY", "")
