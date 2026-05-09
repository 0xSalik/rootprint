"""Master cryptographic keypair row.

Private keys are stored encrypted-at-rest using NaCl SecretBox with a
KEK (key-encryption-key) loaded from environment. Public keys are stored
in the clear so the verifier can sync them as a public registry.
"""

from __future__ import annotations

import uuid

from sqlalchemy import ForeignKey, Integer, LargeBinary, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, TimestampMixin


class MasterKeyRow(Base, TimestampMixin):
    __tablename__ = "master_keys"
    __table_args__ = (UniqueConstraint("master_id", "version", name="uq_master_key_version"),)

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    master_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("masters.id", ondelete="CASCADE"), nullable=False, index=True
    )
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    public_key: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    encrypted_private_key: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    nonce: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    kek_fingerprint: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="active")
