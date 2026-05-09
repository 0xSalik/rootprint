"""Master (artisan) row."""

from __future__ import annotations

import uuid

from sqlalchemy import String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, TimestampMixin


class MasterRow(Base, TimestampMixin):
    __tablename__ = "masters"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    name_in_koshur: Mapped[str | None] = mapped_column(String(200))
    craft_category: Mapped[str] = mapped_column(String(80), nullable=False)
    village: Mapped[str | None] = mapped_column(String(120))
    district: Mapped[str | None] = mapped_column(String(80))
    bio_short: Mapped[str | None] = mapped_column(String(800))
    extra: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
