"""Masters (artisans) — public directory + own-profile management.

* ``GET  /api/v1/masters``               → public listing (filterable).
* ``GET  /api/v1/masters/{id}``          → public profile.
* ``PUT  /api/v1/masters/me``            → update your own profile (JWT).
* ``GET  /api/v1/masters/me/full``       → JWT-authenticated full profile
                                            (alias for /auth/me with
                                            additional fields).
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.common import Page, PaginationParams
from app.api.deps import get_current_master
from app.core.database import get_db
from app.models.models import Master

router = APIRouter()


class MasterPublic(BaseModel):
    """Public-facing master profile (no phone, no PII)."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    lineage_id: Optional[str] = None
    workshop_location: Optional[str] = None
    bio: Optional[str] = None
    ed25519_public_key: Optional[str] = None
    created_at: datetime


class MasterPrivate(MasterPublic):
    """Includes phone — only returned to the master themselves."""

    phone: str


class UpdateMasterRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: Optional[str] = Field(default=None, max_length=200)
    lineage_id: Optional[str] = Field(default=None, max_length=200)
    workshop_location: Optional[str] = Field(default=None, max_length=200)
    bio: Optional[str] = Field(default=None, max_length=2000)


@router.get("", response_model=Page[MasterPublic])
async def list_masters(
    pagination: PaginationParams = Depends(),
    q: Optional[str] = Query(
        default=None, description="Free-text match on name / location / bio."
    ),
    location: Optional[str] = Query(
        default=None, description="Filter by workshop location (case-insensitive)."
    ),
    db: AsyncSession = Depends(get_db),
) -> Page[MasterPublic]:
    """Public artisan directory. Supports free-text search + location filter."""

    stmt = select(Master)
    count_stmt = select(func.count()).select_from(Master)
    if q:
        ilike = f"%{q}%"
        clause = or_(
            Master.name.ilike(ilike),
            Master.workshop_location.ilike(ilike),
            Master.bio.ilike(ilike),
            Master.lineage_id.ilike(ilike),
        )
        stmt = stmt.where(clause)
        count_stmt = count_stmt.where(clause)
    if location:
        clause = Master.workshop_location.ilike(f"%{location}%")
        stmt = stmt.where(clause)
        count_stmt = count_stmt.where(clause)

    total = (await db.execute(count_stmt)).scalar_one()
    rows = (
        await db.execute(
            stmt.order_by(Master.created_at.desc()).limit(pagination.limit).offset(pagination.offset)
        )
    ).scalars().all()
    return Page[MasterPublic](
        items=[MasterPublic.model_validate(r) for r in rows],
        total=int(total),
        limit=pagination.limit,
        offset=pagination.offset,
    )


@router.put("/me", response_model=MasterPrivate)
async def update_my_profile(
    req: UpdateMasterRequest,
    current_master: Master = Depends(get_current_master),
    db: AsyncSession = Depends(get_db),
) -> MasterPrivate:
    """Update your own profile fields. JWT required."""

    fields = req.model_dump(exclude_none=True)
    for k, v in fields.items():
        setattr(current_master, k, v)
    await db.commit()
    await db.refresh(current_master)
    return MasterPrivate.model_validate(current_master)


@router.get("/me/full", response_model=MasterPrivate)
async def get_my_full_profile(
    current_master: Master = Depends(get_current_master),
) -> MasterPrivate:
    """Full master profile including phone. JWT required."""

    return MasterPrivate.model_validate(current_master)


@router.get("/{master_id}", response_model=MasterPublic)
async def get_master(
    master_id: str,
    db: AsyncSession = Depends(get_db),
) -> MasterPublic:
    try:
        master_uuid = uuid.UUID(master_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid master_id (must be UUID).") from exc
    row = await db.get(Master, master_uuid)
    if not row:
        raise HTTPException(status_code=404, detail="Master not found.")
    return MasterPublic.model_validate(row)
