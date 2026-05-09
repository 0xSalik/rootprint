"""Relax sanads.craft_dna_id to nullable

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-05-09 19:15:00.000000

The original schema marked sanads.craft_dna_id as NOT NULL, but the live
mint flow (POST /api/v1/sanad/sign) signs Sanads from a structured payload
that may not yet be tied to a specific CraftDNA row (e.g. a master mints
provenance for a finished piece before completing the full vault interview).
Persisting the row with craft_dna_id = NULL keeps the cryptographic envelope
the source of truth, while the optional FK is still honoured when present.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "sanads",
        "craft_dna_id",
        existing_type=sa.dialects.postgresql.UUID(as_uuid=True),
        nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "sanads",
        "craft_dna_id",
        existing_type=sa.dialects.postgresql.UUID(as_uuid=True),
        nullable=False,
    )
