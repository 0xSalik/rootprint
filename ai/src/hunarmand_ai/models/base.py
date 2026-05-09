"""SQLAlchemy declarative base and shared mixins."""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import DateTime
from sqlalchemy.orm import DeclarativeBase, Mapped, declared_attr, mapped_column


def _utcnow() -> datetime:
    return datetime.now(tz=timezone.utc)


class Base(DeclarativeBase):
    """Project-wide declarative base."""

    @declared_attr.directive
    def __tablename__(cls) -> str:  # noqa: N805 — SA convention
        # Convert CamelCase to snake_case once.
        name = cls.__name__
        out: list[str] = []
        for i, char in enumerate(name):
            if char.isupper() and i and not name[i - 1].isupper():
                out.append("_")
            out.append(char.lower())
        return "".join(out)


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False
    )
