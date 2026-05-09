"""Sanad endpoints — provenance + cryptographic verification.

This module unifies two patterns:

  * **AI-core-backed minting & verification** (``/keys``, ``/sign``,
    ``/verify``) — proxies to the deployed AI core service which uses
    Ed25519 + RFC 8785 JCS canonicalisation. JWT-authenticated for the
    minting routes; public for verification.

  * **DB-backed provenance lookup** (``/{sanad_id}``, ``/{sanad_id}/qr``)
    — reads the local Postgres ``sanads`` table and renders a buyer-
    facing detail JSON or a QR image that links to the public
    provenance page. No auth required.

We deliberately keep ``/verify`` aligned with the AI core's signing
scheme so the verifier and the signer agree on canonicalisation. The
local helpers in ``app.services.sanad.{crypto,qr_engine}`` are the
implementation of the GET endpoints; they are not exposed as a second
verify scheme.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, ConfigDict
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api.common import Page, PaginationParams
from app.api.deps import get_current_master
from app.clients.ai_core import AICoreClient, AICoreError, get_ai_core_client
from app.core.database import get_db
from app.models.models import Master, Sanad
from app.services.sanad import qr_engine

log = logging.getLogger(__name__)
router = APIRouter()


# ── Schemas ─────────────────────────────────────────────────────────────────


class GenerateKeysRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    version: int = 1


class SignRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    payload: dict[str, Any]
    include_qr_image: bool = True


class VerifyRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    qr_string: str
    public_key_b64: Optional[str] = None


# ── AI-core-backed minting & verification ──────────────────────────────────


@router.post("/keys")
async def generate_keys(
    req: GenerateKeysRequest,
    current_master: Master = Depends(get_current_master),
) -> dict:
    """Generate (or rotate) the master's Ed25519 keypair on the AI core.

    The master_id is taken from the JWT — the master can only mint keys
    for themselves.
    """

    client = get_ai_core_client()
    try:
        return await client.sanad_keys(master_id=str(current_master.id), version=req.version)
    except AICoreError as exc:
        log.warning("sanad.keys.failed master=%s err=%s", current_master.id, exc)
        raise HTTPException(status_code=502, detail=f"AI core error: {exc}") from exc


@router.post("/sign")
async def sign_sanad(
    req: SignRequest,
    current_master: Master = Depends(get_current_master),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Sign a Sanad metadata payload via the AI core's Ed25519 + JCS path,
    then persist a buyer-facing row in the backend's ``sanads`` table.

    Two side-effects:

    1. The AI core mints the cryptographic envelope (Ed25519 signature
       over the RFC 8785 canonical payload) and stores it in its own
       ``ai_sanads`` table for replay-style verification.
    2. We mirror the buyer-facing essentials (piece name, material
       origin, signature in hex, the payload as JSON) into the backend's
       ``sanads`` table so the artisan's dashboard
       (``GET /sanad?master_id=``), the public listing, and the
       URL-QR endpoint (``GET /sanad/{id}/qr``) all surface it
       immediately.

    The response augments the AI core envelope with the backend's
    ``sanad_db_id`` (UUID) and a pre-built ``provenance_url`` so the
    frontend can render both the offline-verifiable JWS QR *and* a
    convenient URL QR pointing at the provenance page.
    """

    client = get_ai_core_client()
    try:
        envelope = await client.sanad_sign(
            master_id=str(current_master.id),
            payload=req.payload,
            include_qr_image=req.include_qr_image,
        )
    except AICoreError as exc:
        log.warning("sanad.sign.failed master=%s err=%s", current_master.id, exc)
        raise HTTPException(status_code=502, detail=f"AI core error: {exc}") from exc

    # Mirror into the buyer-facing sanads table so the dashboard,
    # listing, and URL-QR routes can find the piece without bouncing
    # back to the AI core.
    payload = envelope.get("payload") or req.payload
    piece_name = (
        payload.get("short_summary")
        or (payload.get("technique_names") or [None])[0]
        or payload.get("sanad_id")
        or "Authenticated piece"
    )
    materials = payload.get("materials_summary") or []
    if isinstance(materials, list) and materials:
        material_origin = ", ".join(str(m) for m in materials)
    else:
        material_origin = payload.get("made_at_workshop")

    try:
        new_row = Sanad(
            master_id=current_master.id,
            craft_dna_id=None,
            piece_name=str(piece_name)[:200],
            material_origin=str(material_origin)[:200] if material_origin else None,
            crypto_signature=envelope.get("signature"),
            metadata_json=payload,
            is_public=True,
        )
    except Exception:
        # Construction itself can throw on type coercion errors. Log and
        # bail out gracefully — the AI core has already persisted the
        # crypto envelope on its side, so the artisan still has a
        # verifiable signature.
        log.exception(
            "sanad.sign.construct_failed master=%s",
            current_master.id,
        )
        return {**envelope, "sanad_db_id": None, "provenance_url": None}

    try:
        db.add(new_row)
        await db.commit()
        await db.refresh(new_row)
    except Exception:  # noqa: BLE001
        # Defensive net for legacy schemas (pre-b2c3d4e5f6a7) or any
        # other persistence error. log.exception captures the full
        # traceback so Render logs surface the root cause; the
        # response still returns the cryptographic envelope so the
        # caller doesn't see a 500.
        log.exception(
            "sanad.sign.persist_failed master=%s",
            current_master.id,
        )
        try:
            await db.rollback()
        except Exception:
            log.exception("sanad.sign.rollback_failed master=%s", current_master.id)
        return {**envelope, "sanad_db_id": None, "provenance_url": None}

    return {
        **envelope,
        "sanad_db_id": str(new_row.id),
        "provenance_url": f"/api/v1/sanad/{new_row.id}",
    }


@router.post("/verify")
async def verify_sanad(req: VerifyRequest) -> dict:
    """Verify a scanned Sanad QR string. Public — no auth required."""

    client = get_ai_core_client()
    try:
        return await client.sanad_verify(
            qr_string=req.qr_string,
            public_key_b64=req.public_key_b64,
        )
    except AICoreError as exc:
        log.warning("sanad.verify.failed err=%s", exc)
        raise HTTPException(status_code=502, detail=f"AI core error: {exc}") from exc


# ── DB-backed provenance lookups ───────────────────────────────────────────


class SanadCard(BaseModel):
    """Compact public Sanad shape for directory / feed listings."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    piece_name: str
    material_origin: Optional[str] = None
    is_public: bool
    artisan_name: Optional[str] = None
    artisan_id: Optional[uuid.UUID] = None
    created_at: datetime


@router.get("", response_model=Page[SanadCard])
async def list_public_sanads(
    pagination: PaginationParams = Depends(),
    master_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
) -> Page[SanadCard]:
    """Public Sanad directory — anyone can browse provenance certificates."""

    base = (
        select(Sanad, Master)
        .join(Master, Master.id == Sanad.master_id, isouter=True)
        .where(Sanad.is_public.is_(True))
    )
    count_stmt = (
        select(func.count()).select_from(Sanad).where(Sanad.is_public.is_(True))
    )
    if master_id:
        try:
            m_uuid = uuid.UUID(master_id)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail="Invalid master_id.") from exc
        base = base.where(Sanad.master_id == m_uuid)
        count_stmt = count_stmt.where(Sanad.master_id == m_uuid)

    total = (await db.execute(count_stmt)).scalar_one()
    rows = (
        await db.execute(
            base.order_by(Sanad.created_at.desc())
            .limit(pagination.limit)
            .offset(pagination.offset)
        )
    ).all()
    items = [
        SanadCard(
            id=s.id,
            piece_name=s.piece_name,
            material_origin=s.material_origin,
            is_public=bool(s.is_public),
            artisan_name=m.name if m else None,
            artisan_id=m.id if m else None,
            created_at=s.created_at,
        )
        for s, m in rows
    ]
    return Page[SanadCard](
        items=items, total=int(total), limit=pagination.limit, offset=pagination.offset
    )


@router.get("/{sanad_id}/qr")
async def get_sanad_qr(sanad_id: str) -> Response:
    """Render a QR PNG that links to the public provenance page."""

    qr_bytes = qr_engine.generate_sanad_qr(sanad_id)
    return Response(content=qr_bytes, media_type="image/png")


@router.get("/{sanad_id}")
async def get_sanad_details(sanad_id: str, db: AsyncSession = Depends(get_db)) -> dict:
    """Return the Sanad's metadata + the issuing master's name.

    The buyer-facing provenance page renders this object.
    """

    try:
        sanad_uuid = uuid.UUID(sanad_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid Sanad UUID format.") from exc

    result = await db.execute(select(Sanad).where(Sanad.id == sanad_uuid))
    sanad_record = result.scalars().first()
    if not sanad_record:
        raise HTTPException(status_code=404, detail="Sanad record not found.")

    master_result = await db.execute(select(Master).where(Master.id == sanad_record.master_id))
    master_record = master_result.scalars().first()

    return {
        "sanad_id": str(sanad_record.id),
        "piece_name": sanad_record.piece_name,
        "material_origin": sanad_record.material_origin,
        "signature_hex": sanad_record.crypto_signature,
        "is_public": sanad_record.is_public,
        "artisan": master_record.name if master_record else "Unknown",
        "metadata_json": sanad_record.metadata_json,
    }
