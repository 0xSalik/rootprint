"""Sanad endpoints — sign and verify."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_session
from ..sanad import get_sanad_service
from ..schemas.sanad import SanadEnvelope, SanadMetadata, SanadVerification

router = APIRouter(prefix="/sanad", tags=["sanad"])


class GenerateKeysRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    master_id: str
    version: int = 1


class GenerateKeysResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    master_id: str
    key_version: int
    public_key_b64: str
    kid: str


@router.post("/keys", response_model=GenerateKeysResponse)
async def generate_keys(
    req: GenerateKeysRequest,
    session: AsyncSession = Depends(get_session),
) -> GenerateKeysResponse:
    svc = get_sanad_service()
    try:
        master_uuid = uuid.UUID(req.master_id)
    except ValueError as exc:
        raise HTTPException(400, f"Invalid master_id (must be UUID): {exc}") from exc
    row = await svc.key_manager.generate_for_master(
        session=session, master_id=master_uuid, version=req.version
    )
    return GenerateKeysResponse(
        master_id=str(master_uuid),
        key_version=row.version,
        public_key_b64=svc.key_manager.public_key_b64(row.public_key),
        kid=svc.key_manager.kid(master_uuid, row.version),
    )


class SignRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    master_id: str
    payload: SanadMetadata
    include_qr_image: bool = True


@router.post("/sign", response_model=SanadEnvelope)
async def sign(
    req: SignRequest,
    session: AsyncSession = Depends(get_session),
) -> SanadEnvelope:
    svc = get_sanad_service()
    try:
        master_uuid = uuid.UUID(req.master_id)
    except ValueError as exc:
        raise HTTPException(400, f"Invalid master_id: {exc}") from exc
    return await svc.sign_and_store(
        session=session,
        master_id=master_uuid,
        payload=req.payload,
        include_qr_image=req.include_qr_image,
    )


class VerifyRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    qr_string: str
    public_key_b64: str | None = None


@router.post("/verify", response_model=SanadVerification)
async def verify(
    req: VerifyRequest,
    session: AsyncSession = Depends(get_session),
) -> SanadVerification:
    svc = get_sanad_service()
    if req.public_key_b64:
        pubkey = svc.key_manager.public_key_from_b64(req.public_key_b64)
        return svc.verify_offline(qr_string=req.qr_string, public_key_bytes=pubkey)
    return await svc.verify(session=session, qr_string=req.qr_string)
