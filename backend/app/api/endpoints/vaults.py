"""Vaults — Capture-layer reads for the master's own dashboard.

* ``GET /api/v1/vaults/me``                   → list my vaults.
* ``GET /api/v1/vaults/{id}``                 → vault detail (with CraftDNA).
* ``GET /api/v1/vaults/{id}/status``          → just the status field
                                                  (frontend polls this while
                                                   processing).
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.common import Page, PaginationParams
from app.api.deps import get_current_master
from app.core.database import get_db
from app.models.models import CraftDNA, Master, Vault

router = APIRouter()


class VaultPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    master_id: uuid.UUID
    media_s3_key: Optional[str] = None
    status: Optional[str] = "pending"
    recorded_at: Optional[datetime] = None
    created_at: datetime


class CraftDNASummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    technique_name: Optional[str] = None
    translated_transcript: Optional[str] = None
    technique_graph: Optional[dict] = None
    supplier_graph: Optional[dict] = None
    created_at: datetime


class VaultDetail(VaultPublic):
    craft_dna: Optional[CraftDNASummary] = None


class VaultStatus(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    status: Optional[str] = "pending"
    has_craft_dna: bool = False


@router.get("/me", response_model=Page[VaultPublic])
async def list_my_vaults(
    pagination: PaginationParams = Depends(),
    current_master: Master = Depends(get_current_master),
    db: AsyncSession = Depends(get_db),
) -> Page[VaultPublic]:
    total = (
        await db.execute(
            select(func.count()).select_from(Vault).where(Vault.master_id == current_master.id)
        )
    ).scalar_one()
    rows = (
        await db.execute(
            select(Vault)
            .where(Vault.master_id == current_master.id)
            .order_by(Vault.created_at.desc())
            .limit(pagination.limit)
            .offset(pagination.offset)
        )
    ).scalars().all()
    return Page[VaultPublic](
        items=[VaultPublic.model_validate(r) for r in rows],
        total=int(total),
        limit=pagination.limit,
        offset=pagination.offset,
    )


@router.get("/{vault_id}", response_model=VaultDetail)
async def get_vault(
    vault_id: str,
    current_master: Master = Depends(get_current_master),
    db: AsyncSession = Depends(get_db),
) -> VaultDetail:
    try:
        v_uuid = uuid.UUID(vault_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid vault id.") from exc
    vault = await db.get(Vault, v_uuid)
    if not vault:
        raise HTTPException(status_code=404, detail="Vault not found.")
    if vault.master_id != current_master.id:
        raise HTTPException(status_code=403, detail="This vault belongs to a different master.")
    cd = (
        await db.execute(select(CraftDNA).where(CraftDNA.vault_id == vault.id))
    ).scalars().first()
    return VaultDetail(
        id=vault.id,
        master_id=vault.master_id,
        media_s3_key=vault.media_s3_key,
        status=vault.status,
        recorded_at=vault.recorded_at,
        created_at=vault.created_at,
        craft_dna=CraftDNASummary.model_validate(cd) if cd else None,
    )


@router.get("/{vault_id}/status", response_model=VaultStatus)
async def get_vault_status(
    vault_id: str,
    current_master: Master = Depends(get_current_master),
    db: AsyncSession = Depends(get_db),
) -> VaultStatus:
    """Lightweight status poll endpoint — the frontend polls this while a
    Vault is being processed by the AI core.
    """

    try:
        v_uuid = uuid.UUID(vault_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid vault id.") from exc
    vault = await db.get(Vault, v_uuid)
    if not vault:
        raise HTTPException(status_code=404, detail="Vault not found.")
    if vault.master_id != current_master.id:
        raise HTTPException(status_code=403, detail="This vault belongs to a different master.")
    has_dna = (
        await db.execute(
            select(func.count()).select_from(CraftDNA).where(CraftDNA.vault_id == vault.id)
        )
    ).scalar_one()
    return VaultStatus(id=vault.id, status=vault.status, has_craft_dna=bool(has_dna))
