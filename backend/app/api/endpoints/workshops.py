"""Workshops — Ustaad layer.

REST resource view. Coexists with the legacy ``/api/v1/commerce/*``
endpoints which the original A2 frontend contract used.

* ``GET    /api/v1/workshops``       → public list
* ``POST   /api/v1/workshops``       → create (JWT, master)
* ``GET    /api/v1/workshops/{id}``  → detail
* ``PUT    /api/v1/workshops/{id}``  → update (JWT, owner)
* ``DELETE /api/v1/workshops/{id}``  → soft delete (JWT, owner)
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.common import Page, PaginationParams
from app.api.deps import get_current_master
from app.core.database import get_db
from app.models.models import Master, Workshop

router = APIRouter()


class WorkshopPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    master_id: uuid.UUID
    format: Optional[str] = None
    price: Optional[float] = None
    duration_mins: Optional[int] = None
    description: Optional[str] = None
    is_active: bool = True


class WorkshopWithMaster(WorkshopPublic):
    """Workshop plus a small chunk of the master's public info — useful for
    the discovery feed where the frontend wants to render a card without a
    second round-trip.
    """

    master_name: str
    master_workshop_location: Optional[str] = None


class CreateWorkshopRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    format: str = Field(min_length=1, max_length=120)
    price: float = Field(ge=0)
    duration_mins: int = Field(ge=1, le=24 * 60)
    description: Optional[str] = Field(default=None, max_length=2000)


class UpdateWorkshopRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    format: Optional[str] = Field(default=None, min_length=1, max_length=120)
    price: Optional[float] = Field(default=None, ge=0)
    duration_mins: Optional[int] = Field(default=None, ge=1, le=24 * 60)
    description: Optional[str] = Field(default=None, max_length=2000)
    is_active: Optional[bool] = None


@router.get("", response_model=Page[WorkshopWithMaster])
async def list_workshops(
    pagination: PaginationParams = Depends(),
    master_id: Optional[str] = Query(default=None, description="Filter to a single master."),
    is_active: bool = Query(default=True, description="Only return active workshops."),
    db: AsyncSession = Depends(get_db),
) -> Page[WorkshopWithMaster]:
    stmt = select(Workshop, Master).join(Master, Master.id == Workshop.master_id)
    count_stmt = select(func.count()).select_from(Workshop)
    if is_active:
        stmt = stmt.where(Workshop.is_active.is_(True))
        count_stmt = count_stmt.where(Workshop.is_active.is_(True))
    if master_id:
        try:
            master_uuid = uuid.UUID(master_id)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail="Invalid master_id.") from exc
        stmt = stmt.where(Workshop.master_id == master_uuid)
        count_stmt = count_stmt.where(Workshop.master_id == master_uuid)

    total = (await db.execute(count_stmt)).scalar_one()
    rows = (
        await db.execute(
            stmt.order_by(Workshop.id.desc()).limit(pagination.limit).offset(pagination.offset)
        )
    ).all()

    items: list[WorkshopWithMaster] = []
    for ws, m in rows:
        items.append(
            WorkshopWithMaster(
                id=ws.id,
                master_id=ws.master_id,
                format=ws.format,
                price=ws.price,
                duration_mins=ws.duration_mins,
                description=ws.description,
                is_active=bool(ws.is_active),
                master_name=m.name,
                master_workshop_location=m.workshop_location,
            )
        )
    return Page[WorkshopWithMaster](
        items=items, total=int(total), limit=pagination.limit, offset=pagination.offset
    )


@router.post("", response_model=WorkshopPublic, status_code=201)
async def create_workshop(
    req: CreateWorkshopRequest,
    current_master: Master = Depends(get_current_master),
    db: AsyncSession = Depends(get_db),
) -> WorkshopPublic:
    ws = Workshop(
        master_id=current_master.id,
        format=req.format,
        price=req.price,
        duration_mins=req.duration_mins,
        description=req.description,
        is_active=True,
    )
    db.add(ws)
    await db.commit()
    await db.refresh(ws)
    return WorkshopPublic.model_validate(ws)


@router.get("/{workshop_id}", response_model=WorkshopWithMaster)
async def get_workshop(
    workshop_id: str,
    db: AsyncSession = Depends(get_db),
) -> WorkshopWithMaster:
    try:
        ws_uuid = uuid.UUID(workshop_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid workshop id.") from exc
    row = (
        await db.execute(
            select(Workshop, Master).join(Master, Master.id == Workshop.master_id).where(
                Workshop.id == ws_uuid
            )
        )
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Workshop not found.")
    ws, m = row
    return WorkshopWithMaster(
        id=ws.id,
        master_id=ws.master_id,
        format=ws.format,
        price=ws.price,
        duration_mins=ws.duration_mins,
        description=ws.description,
        is_active=bool(ws.is_active),
        master_name=m.name,
        master_workshop_location=m.workshop_location,
    )


@router.put("/{workshop_id}", response_model=WorkshopPublic)
async def update_workshop(
    workshop_id: str,
    req: UpdateWorkshopRequest,
    current_master: Master = Depends(get_current_master),
    db: AsyncSession = Depends(get_db),
) -> WorkshopPublic:
    try:
        ws_uuid = uuid.UUID(workshop_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid workshop id.") from exc
    ws = await db.get(Workshop, ws_uuid)
    if not ws:
        raise HTTPException(status_code=404, detail="Workshop not found.")
    if ws.master_id != current_master.id:
        raise HTTPException(status_code=403, detail="You can only edit your own workshops.")
    for k, v in req.model_dump(exclude_none=True).items():
        setattr(ws, k, v)
    await db.commit()
    await db.refresh(ws)
    return WorkshopPublic.model_validate(ws)


@router.delete("/{workshop_id}", status_code=204)
async def delete_workshop(
    workshop_id: str,
    current_master: Master = Depends(get_current_master),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Soft-delete by flipping ``is_active=False``. Bookings stay intact."""

    try:
        ws_uuid = uuid.UUID(workshop_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid workshop id.") from exc
    ws = await db.get(Workshop, ws_uuid)
    if not ws:
        raise HTTPException(status_code=404, detail="Workshop not found.")
    if ws.master_id != current_master.id:
        raise HTTPException(status_code=403, detail="You can only delete your own workshops.")
    ws.is_active = False
    await db.commit()
