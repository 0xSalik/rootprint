"""Sanad row — one per signed authentic piece."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, TimestampMixin


class SanadRow(Base, TimestampMixin):
    __tablename__ = "sanads"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    master_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("masters.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    key_version: Mapped[int] = mapped_column(Integer, nullable=False)
    sanad_id_public: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    piece_id: Mapped[str] = mapped_column(String(120), nullable=False)
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False)
    canonical_payload_b64: Mapped[str] = mapped_column(Text, nullable=False)
    signature_b64: Mapped[str] = mapped_column(Text, nullable=False)
    qr_string: Mapped[str] = mapped_column(Text, nullable=False)
    issued_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    completed_on: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
