"""External-service clients (the AI core, S3, etc.)."""

from .ai_core import AICoreClient, get_ai_core_client

__all__ = ["AICoreClient", "get_ai_core_client"]
