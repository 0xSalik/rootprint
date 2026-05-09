"""Interview tables: session, pass, and turn."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, TimestampMixin


class InterviewSessionRow(Base, TimestampMixin):
    __tablename__ = "interview_sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    master_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("masters.id", ondelete="CASCADE"), nullable=False, index=True
    )
    state: Mapped[str] = mapped_column(String(32), nullable=False, default="ready")
    primary_language: Mapped[str] = mapped_column(String(8), nullable=False, default="ks")
    facilitator_id: Mapped[str | None] = mapped_column(String(80))
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    turn_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    flagged_turns: Mapped[list[str]] = mapped_column(
        ARRAY(String), default=list, nullable=False
    )


class InterviewPassRow(Base, TimestampMixin):
    __tablename__ = "interview_passes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("interview_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    pass_id: Mapped[str] = mapped_column(String(32), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="pending")
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    coverage_required: Mapped[list[str]] = mapped_column(
        ARRAY(String), default=list, nullable=False
    )
    coverage_collected: Mapped[list[str]] = mapped_column(
        ARRAY(String), default=list, nullable=False
    )


class InterviewTurnRow(Base, TimestampMixin):
    __tablename__ = "interview_turns"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("interview_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    pass_id: Mapped[str] = mapped_column(String(32), nullable=False)
    role: Mapped[str] = mapped_column(String(16), nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    text_translated: Mapped[str | None] = mapped_column(Text)
    language: Mapped[str] = mapped_column(String(8), nullable=False, default="ks")
    audio_uri: Mapped[str | None] = mapped_column(String(1024))
    timestamp_start_s: Mapped[float | None] = mapped_column(Float)
    timestamp_end_s: Mapped[float | None] = mapped_column(Float)
    asr_confidence: Mapped[float | None] = mapped_column(Float)
    extra: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
