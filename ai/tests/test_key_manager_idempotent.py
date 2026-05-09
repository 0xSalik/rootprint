"""Regression: KeyManager.generate_for_master must be idempotent.

The frontend mint flow at /studio/sanads/new always calls
POST /sanad/keys before the first sign of a session. If the master
already has a (master_id, version) row, a fresh INSERT would crash on
the uq_master_key_version unique index — which is exactly what was
happening on the live Hugging Face Space, returning 500 to the artisan
and aborting the mint.

This test pins the contract:

  * First call creates a row (status='active').
  * Second call with the same (master_id, version) returns the *same*
    row — no exception, no duplicate, identical public key.
  * A different version creates a new row (rotation works).
"""

from __future__ import annotations

import uuid

import pytest
import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from hunarmand_ai.models.base import Base
from hunarmand_ai.models.key import MasterKeyRow  # noqa: F401  (Base.metadata side-effect)
from hunarmand_ai.sanad.keys import KeyManager


@pytest.fixture
async def session() -> AsyncSession:
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        # Tables that reference a 'masters' FK exist outside this minimal
        # test scope. We only need the master_keys table to exercise the
        # idempotency contract, so create just that.
        await conn.run_sync(
            lambda sync_conn: MasterKeyRow.__table__.create(
                bind=sync_conn, checkfirst=True
            )
        )
    sm = async_sessionmaker(engine, expire_on_commit=False)
    async with sm() as s:
        yield s
    await engine.dispose()


@pytest.mark.asyncio
async def test_generate_for_master_idempotent_same_version(session: AsyncSession) -> None:
    km = KeyManager()
    master_id = uuid.uuid4()

    first = await km.generate_for_master(session=session, master_id=master_id, version=1)
    await session.commit()

    second = await km.generate_for_master(session=session, master_id=master_id, version=1)

    assert second.id == first.id, "Same (master_id, version) must return the same row"
    assert second.public_key == first.public_key
    assert second.encrypted_private_key == first.encrypted_private_key
    assert second.version == 1

    # Sanity: only one row exists in the table.
    count = await session.scalar(sa.select(sa.func.count()).select_from(MasterKeyRow))
    assert count == 1


@pytest.mark.asyncio
async def test_generate_for_master_new_version_creates_row(session: AsyncSession) -> None:
    km = KeyManager()
    master_id = uuid.uuid4()

    v1 = await km.generate_for_master(session=session, master_id=master_id, version=1)
    await session.commit()
    v2 = await km.generate_for_master(session=session, master_id=master_id, version=2)
    await session.commit()

    assert v1.id != v2.id
    assert v1.public_key != v2.public_key
    assert v2.version == 2

    count = await session.scalar(sa.select(sa.func.count()).select_from(MasterKeyRow))
    assert count == 2
