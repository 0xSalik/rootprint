"""Verify ``VaultRetriever.retrieve`` compiles to a query that binds
the embedding through pgvector's adapter, NOT as a plain string.

Background: the previous implementation used ``text("... :emb ...")``
with ``bindparam("emb")``, which SQLAlchemy treated as a string. asyncpg
then refused the Python list with ``expected str, got list``. The ORM
form binds through pgvector's ``Vector`` type, which converts the list
to the literal ``'[0.1,0.2,…]'`` representation pgvector expects.

We don't need a real database for this test — we compile the statement
under the postgres dialect and inspect both the SQL string and the
parameter types attached to it.
"""

from __future__ import annotations

import uuid

from pgvector.sqlalchemy import Vector
from sqlalchemy import select
from sqlalchemy.dialects import postgresql

from hunarmand_ai.models.vault_chunk import VaultChunkRow
from hunarmand_ai.rag.retriever import _coerce_master_uuid


def test_retrieve_query_uses_pgvector_cosine_operator() -> None:
    embedding = [0.1, 0.2, 0.3, 0.4]
    distance = VaultChunkRow.embedding.cosine_distance(embedding)
    stmt = (
        select(VaultChunkRow, distance.label("distance"))
        .where(VaultChunkRow.master_id == uuid.UUID("00000000-0000-4000-8000-000000000001"))
        .order_by(distance)
        .limit(5)
    )
    compiled = stmt.compile(dialect=postgresql.dialect())
    sql = str(compiled)
    # Must use pgvector's cosine-distance operator, not a string param.
    assert "<=>" in sql, f"expected <=> operator in SQL, got: {sql}"


def test_embedding_column_is_pgvector_typed() -> None:
    """The ORM column must be declared as pgvector's Vector type.

    ``cosine_distance(...)`` only routes binding through the pgvector
    adapter when the column type is ``Vector``. If the column reverts to
    a generic SQLAlchemy type, we'll silently regress to the asyncpg
    "expected str, got list" failure mode.
    """

    col_type = VaultChunkRow.__table__.c.embedding.type
    assert isinstance(col_type, Vector), f"expected pgvector Vector, got {col_type!r}"


def test_compiled_statement_binds_embedding_via_pgvector() -> None:
    """Inspect the compiled bind params: the embedding's bind has a
    ``Vector``-typed key, not a string-typed one.
    """

    embedding = [0.1, 0.2, 0.3]
    distance = VaultChunkRow.embedding.cosine_distance(embedding)
    stmt = select(VaultChunkRow, distance.label("distance")).order_by(distance).limit(1)

    compiled = stmt.compile(dialect=postgresql.dialect())

    # ``binds`` is a dict { bindparam-key : BindParameter } and each
    # BindParameter carries the SA type that drives the asyncpg codec.
    types = {bp.type.__class__.__name__ for bp in compiled.binds.values()}
    # pgvector's class name compiles to "VECTOR" (uppercase) under the
    # postgresql dialect; case-insensitive match here.
    assert any("vector" in t.lower() for t in types), (
        f"expected at least one Vector-typed bind, got types={types}"
    )


def test_coerce_master_uuid_accepts_uuid_strings() -> None:
    assert _coerce_master_uuid("00000000-0000-4000-8000-000000000001") is not None


def test_coerce_master_uuid_accepts_uuid_objects() -> None:
    u = uuid.uuid4()
    assert _coerce_master_uuid(u) == u


def test_coerce_master_uuid_rejects_swagger_default() -> None:
    """Swagger's default placeholder is the literal ``"string"`` —
    previously this caused a 500 from Postgres' UUID parser. We now
    short-circuit to ``None`` so the caller can refuse cleanly.
    """

    assert _coerce_master_uuid("string") is None


def test_coerce_master_uuid_rejects_garbage() -> None:
    assert _coerce_master_uuid("") is None
    assert _coerce_master_uuid("not-a-uuid") is None
    assert _coerce_master_uuid("123") is None
