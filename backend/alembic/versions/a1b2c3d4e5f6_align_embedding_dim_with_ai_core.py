"""Align craft_dnas.embedding dim with AI core configuration

Revision ID: a1b2c3d4e5f6
Revises: e97367589b0f
Create Date: 2026-05-09 14:50:00.000000

The original migration hard-coded `Vector(1536)`. The AI core defaults
to `intfloat/multilingual-e5-small` (384 dim) for the free path; pgvector
enforces dimension at the column level, so the embedder and the column
must agree. This migration recreates the column at whatever
`HUNARMAND_EMBEDDING_DIMENSIONS` says (default 384).

If you switch to OpenAI's `text-embedding-3-small` (1536) or Jina v3
(1024), set HUNARMAND_EMBEDDING_DIMENSIONS *before* running the
upgrade; the migration will pick that value up.
"""

from typing import Sequence, Union
import os

from alembic import op
import sqlalchemy as sa
import pgvector


# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "e97367589b0f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _embedding_dim() -> int:
    raw = os.getenv("HUNARMAND_EMBEDDING_DIMENSIONS", "384")
    try:
        return int(raw)
    except ValueError:
        return 384


def upgrade() -> None:
    dim = _embedding_dim()
    # pgvector cannot ALTER an existing column's dim in-place; drop and
    # recreate. This wipes any embeddings already in the table — for the
    # hackathon that's fine because the seed script regenerates them.
    op.drop_column("craft_dnas", "embedding")
    op.add_column(
        "craft_dnas",
        sa.Column("embedding", pgvector.sqlalchemy.Vector(dim), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("craft_dnas", "embedding")
    op.add_column(
        "craft_dnas",
        sa.Column("embedding", pgvector.sqlalchemy.Vector(1536), nullable=True),
    )
