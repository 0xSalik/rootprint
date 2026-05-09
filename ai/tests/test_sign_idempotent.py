"""Regression: SanadService.sign_and_store must be idempotent on sanad_id.

Two clicks on the studio mint form (or a network retry) used to crash
on the unique index ``ai_sanads_sanad_id_public_key`` and return 500
to the artisan. The contract under test:

  * Same ``sanad_id`` + same canonical payload → returns the existing
    envelope without inserting a duplicate row. Signature is stable
    (replays are byte-identical) so a buyer scanning the QR sees the
    same provenance both times.

  * Same ``sanad_id`` + different canonical payload → raises an
    HTTPException(409) so the caller knows to mint with a fresh id.

  * Different ``sanad_id`` → fresh row.
"""

from __future__ import annotations

import os
import uuid
from datetime import datetime, timezone

import pytest
import sqlalchemy as sa
from fastapi import HTTPException
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from hunarmand_ai.models.key import MasterKeyRow
from hunarmand_ai.models.sanad import SanadRow
from hunarmand_ai.sanad.service import SanadService
from hunarmand_ai.schemas.sanad import CraftLineageRef, SanadMetadata


@compiles(JSONB, "sqlite")
def _jsonb_to_sqlite(element, compiler, **kw):  # noqa: D401, ARG001
    """Render JSONB as JSON for the in-memory SQLite test engine."""
    return "JSON"


@pytest.fixture
async def session() -> AsyncSession:
    # Predictable sanad_base_url so the assertion on public_url is stable.
    os.environ.setdefault("HUNARMAND_SANAD_BASE_URL", "https://hunarmand.test/sanad")
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(
            lambda sync: MasterKeyRow.__table__.create(bind=sync, checkfirst=True)
        )
        await conn.run_sync(
            lambda sync: SanadRow.__table__.create(bind=sync, checkfirst=True)
        )
    sm = async_sessionmaker(engine, expire_on_commit=False)
    async with sm() as s:
        yield s
    await engine.dispose()


def _payload(sanad_id: str, *, summary: str = "Kani-buti pashmina shawl") -> SanadMetadata:
    return SanadMetadata(
        sanad_id=sanad_id,
        piece_id=f"PCE-{sanad_id}",
        craft_category="pashmina_weaving",
        technique_names=["kani_weave"],
        materials_summary=["pashmina"],
        completed_on=datetime(2026, 4, 25, tzinfo=timezone.utc),
        issued_at=datetime(2026, 5, 9, 19, 0, tzinfo=timezone.utc),
        lineage=CraftLineageRef(master_id="m", master_name="Mohammad Yusuf"),
        short_summary=summary,
    )


@pytest.mark.asyncio
async def test_sign_replay_returns_existing_envelope(session: AsyncSession) -> None:
    svc = SanadService()
    master_id = uuid.uuid4()
    await svc.key_manager.generate_for_master(session=session, master_id=master_id, version=1)
    await session.commit()

    payload = _payload("SND-2026-IDEM")
    first = await svc.sign_and_store(session=session, master_id=master_id, payload=payload)
    await session.commit()

    second = await svc.sign_and_store(session=session, master_id=master_id, payload=payload)

    assert first.signature == second.signature
    assert first.qr_string == second.qr_string
    assert first.public_url == second.public_url

    count = await session.scalar(
        sa.select(sa.func.count()).select_from(SanadRow).where(
            SanadRow.sanad_id_public == "SND-2026-IDEM"
        )
    )
    assert count == 1


@pytest.mark.asyncio
async def test_sign_id_conflict_returns_409(session: AsyncSession) -> None:
    svc = SanadService()
    master_id = uuid.uuid4()
    await svc.key_manager.generate_for_master(session=session, master_id=master_id, version=1)
    await session.commit()

    await svc.sign_and_store(
        session=session,
        master_id=master_id,
        payload=_payload("SND-2026-CONFLICT", summary="First piece"),
    )
    await session.commit()

    with pytest.raises(HTTPException) as exc_info:
        await svc.sign_and_store(
            session=session,
            master_id=master_id,
            payload=_payload("SND-2026-CONFLICT", summary="Different piece"),
        )
    assert exc_info.value.status_code == 409
    assert "already minted" in exc_info.value.detail


@pytest.mark.asyncio
async def test_sign_distinct_ids_each_create_a_row(session: AsyncSession) -> None:
    svc = SanadService()
    master_id = uuid.uuid4()
    await svc.key_manager.generate_for_master(session=session, master_id=master_id, version=1)
    await session.commit()

    a = await svc.sign_and_store(session=session, master_id=master_id, payload=_payload("SND-A"))
    await session.commit()
    b = await svc.sign_and_store(session=session, master_id=master_id, payload=_payload("SND-B"))
    await session.commit()

    assert a.signature != b.signature
    count = await session.scalar(sa.select(sa.func.count()).select_from(SanadRow))
    assert count == 2
