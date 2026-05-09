"""Sanad endpoints (A2's layer).

These are thin authenticated proxies to the AI core's cryptographic
Sanad service:

    /api/v1/sanad/keys     -> AI core /sanad/keys     (creates Ed25519 keypair)
    /api/v1/sanad/sign     -> AI core /sanad/sign     (returns signed envelope + QR)
    /api/v1/sanad/verify   -> AI core /sanad/verify   (validates a QR string)

We require a backend JWT for ``/keys`` and ``/sign`` (only the master
themselves should mint Sanads in their name) and leave ``/verify``
unauthenticated so any buyer can verify a QR they scanned.
"""

from __future__ import annotations

from typing import Any, Optional
import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict

from app.api.deps import get_current_master
from app.clients.ai_core import AICoreClient, AICoreError, get_ai_core_client
from app.models.models import Master

log = logging.getLogger(__name__)
router = APIRouter()


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


@router.post("/keys")
async def generate_keys(
    req: GenerateKeysRequest,
    current_master: Master = Depends(get_current_master),
) -> dict:
    """Generate (or rotate) the master's Ed25519 keypair on the AI core.

    The master_id is taken from the JWT — the master can only ever mint
    keys for themselves through this endpoint.
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
) -> dict:
    """Sign a Sanad metadata payload.

    Forwards the JWT-authenticated master's id to the AI core. The
    payload must include the fields documented at the AI core's
    ``/docs`` (``sanad_id``, ``piece_id``, ``craft_category``,
    ``completed_on``, ``issued_at``, ``lineage``, ``short_summary`` are
    required).
    """

    client = get_ai_core_client()
    try:
        return await client.sanad_sign(
            master_id=str(current_master.id),
            payload=req.payload,
            include_qr_image=req.include_qr_image,
        )
    except AICoreError as exc:
        log.warning("sanad.sign.failed master=%s err=%s", current_master.id, exc)
        raise HTTPException(status_code=502, detail=f"AI core error: {exc}") from exc


@router.post("/verify")
async def verify_sanad(req: VerifyRequest) -> dict:
    """Verify a scanned Sanad QR — public, no auth required."""

    client = get_ai_core_client()
    try:
        return await client.sanad_verify(
            qr_string=req.qr_string,
            public_key_b64=req.public_key_b64,
        )
    except AICoreError as exc:
        log.warning("sanad.verify.failed err=%s", exc)
        raise HTTPException(status_code=502, detail=f"AI core error: {exc}") from exc
