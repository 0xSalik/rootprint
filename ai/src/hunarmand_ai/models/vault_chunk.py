"""Vault transcript chunks indexed for RAG retrieval."""

from __future__ import annotations

import uuid

from pgvector.sqlalchemy import Vector
from sqlalchemy import Float, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from ..config import get_settings
from .base import Base, TimestampMixin

_dim = get_settings().embedding_dimensions


class VaultChunkRow(Base, TimestampMixin):
    __tablename__ = "vault_chunks"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    master_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("masters.id", ondelete="CASCADE"), nullable=False, index=True
    )
    session_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("interview_sessions.id", ondelete="SET NULL"), index=True
    )
    pass_id: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    text_en: Mapped[str | None] = mapped_column(Text)
    language: Mapped[str] = mapped_column(String(8), nullable=False, default="ks")
    timestamp_start_s: Mapped[float] = mapped_column(Float, nullable=False)
    timestamp_end_s: Mapped[float] = mapped_column(Float, nullable=False)
    audio_uri: Mapped[str | None] = mapped_column(String(1024))

    embedding: Mapped[list[float] | None] = mapped_column(Vector(_dim))
    extra: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
