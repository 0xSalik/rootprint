"""Guarantee the AI core doesn't fight the backend over shared DB tables.

The backend service owns the canonical ``masters`` and ``sanads``
tables on the shared Neon DB. The AI core:

* declares ``MasterRow`` only as an ORM target for FK resolution; the
  table is in the auto-create skip-list so alembic owns it.
* uses ``ai_sanads`` (not ``sanads``) for its own signing-side
  records.

If anyone ever:
  * removes ``masters`` from the skip-list, or
  * renames ``SanadRow.__tablename__`` back to ``sanads``,

the next deploy on the shared DB will explode with
``DuplicateTableError`` (or worse, succeed but write to the wrong
table). This test catches both.
"""

from __future__ import annotations

from hunarmand_ai.models.base import Base
from hunarmand_ai.models.sanad import SanadRow


def test_sanadrow_uses_ai_sanads_table() -> None:
    assert SanadRow.__tablename__ == "ai_sanads", (
        "SanadRow must use 'ai_sanads' so it doesn't collide with the "
        "backend's 'sanads' table on a shared Postgres DB."
    )


def test_create_all_tables_skips_masters() -> None:
    """Verify the source skip-list is intact."""

    import inspect

    from hunarmand_ai import db as db_module

    src = inspect.getsource(db_module.create_all_tables)
    assert '"masters"' in src and "skip" in src, (
        "create_all_tables() must declare a skip-set containing 'masters' "
        "so we don't fight the backend's alembic migration on the shared DB."
    )


def test_metadata_does_not_redefine_backend_sanads() -> None:
    """Belt-and-braces: the AI core's metadata must not have a 'sanads'
    table (only 'ai_sanads').
    """

    table_names = {t.name for t in Base.metadata.sorted_tables}
    assert "sanads" not in table_names, (
        "AI core metadata must not declare 'sanads' — that's the backend's "
        "table. The AI core writes Sanad rows under 'ai_sanads'."
    )
    assert "ai_sanads" in table_names
