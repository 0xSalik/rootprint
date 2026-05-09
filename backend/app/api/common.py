"""Shared API helpers — pagination + common response wrappers."""

from __future__ import annotations

from typing import Generic, TypeVar

from fastapi import Query
from pydantic import BaseModel, ConfigDict, Field

T = TypeVar("T")


class Page(BaseModel, Generic[T]):
    """Stable pagination envelope for every list endpoint."""

    model_config = ConfigDict(arbitrary_types_allowed=True)

    items: list[T]
    total: int = Field(ge=0)
    limit: int = Field(ge=1, le=100)
    offset: int = Field(ge=0)


class PaginationParams:
    """FastAPI dependency providing ``limit`` and ``offset`` query params."""

    def __init__(
        self,
        limit: int = Query(default=20, ge=1, le=100, description="Page size (max 100)."),
        offset: int = Query(default=0, ge=0, description="Number of items to skip."),
    ) -> None:
        self.limit = limit
        self.offset = offset
