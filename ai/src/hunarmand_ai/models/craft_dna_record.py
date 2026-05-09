"""Persisted Craft DNA — append-only, one row per (master, version)."""

from __future__ import annotations

import uuid

from sqlalchemy import Float, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, TimestampMixin


class CraftDNARecord(Base, TimestampMixin):
    __tablename__ = "craft_dna_records"
    __table_args__ = (
        UniqueConstraint("master_id", "version", name="uq_craft_dna_master_version"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    master_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("masters.id", ondelete="CASCADE"), nullable=False, index=True
    )
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False)
    vulnerability_index: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
