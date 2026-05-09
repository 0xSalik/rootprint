"""Bundles — Bazaar layer storefront resources.

* ``GET  /api/v1/bundles``       → public listing.
* ``GET  /api/v1/bundles/{id}``  → bundle detail (with linked Sanad summaries).
* ``POST /api/v1/bundles``       → create bundle (JWT, master).
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.common import Page, PaginationParams
from app.api.deps import get_current_master
from app.core.database import get_db
from app.models.models import Bundle, Master, Sanad

router = APIRouter()


class BundlePublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    description: Optional[str] = None
    price: Optional[float] = None
    sanad_ids: list[uuid.UUID] = Field(default_factory=list)
    created_at: datetime


class SanadSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    piece_name: str
    material_origin: Optional[str] = None
    is_public: bool
    artisan_name: Optional[str] = None


class BundleDetail(BundlePublic):
    sanads: list[SanadSummary] = Field(default_factory=list)


class CreateBundleRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str = Field(min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=2000)
    price: float = Field(ge=0)
    sanad_ids: list[uuid.UUID] = Field(default_factory=list)


@router.get("", response_model=Page[BundlePublic])
async def list_bundles(
    pagination: PaginationParams = Depends(),
    db: AsyncSession = Depends(get_db),
) -> Page[BundlePublic]:
    total = (await db.execute(select(func.count()).select_from(Bundle))).scalar_one()
    rows = (
        await db.execute(
            select(Bundle)
            .order_by(Bundle.created_at.desc())
            .limit(pagination.limit)
            .offset(pagination.offset)
        )
    ).scalars().all()
    return Page[BundlePublic](
        items=[BundlePublic.model_validate(r) for r in rows],
        total=int(total),
        limit=pagination.limit,
        offset=pagination.offset,
    )


@router.post("", response_model=BundlePublic, status_code=201)
async def create_bundle(
    req: CreateBundleRequest,
    current_master: Master = Depends(get_current_master),  # noqa: ARG001 — auth gate only
    db: AsyncSession = Depends(get_db),
) -> BundlePublic:
    bundle = Bundle(
        name=req.name,
        description=req.description,
        price=req.price,
        sanad_ids=req.sanad_ids,
    )
    db.add(bundle)
    await db.commit()
    await db.refresh(bundle)
    return BundlePublic.model_validate(bundle)


@router.get("/{bundle_id}", response_model=BundleDetail)
async def get_bundle(bundle_id: str, db: AsyncSession = Depends(get_db)) -> BundleDetail:
    try:
        b_uuid = uuid.UUID(bundle_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid bundle id.") from exc
    bundle = await db.get(Bundle, b_uuid)
    if not bundle:
        raise HTTPException(status_code=404, detail="Bundle not found.")

    sanad_rows: list[tuple[Sanad, Optional[Master]]] = []
    if bundle.sanad_ids:
        sanad_rows = (
            await db.execute(
                select(Sanad, Master)
                .join(Master, Master.id == Sanad.master_id, isouter=True)
                .where(Sanad.id.in_(bundle.sanad_ids))
            )
        ).all()

    sanads = [
        SanadSummary(
            id=s.id,
            piece_name=s.piece_name,
            material_origin=s.material_origin,
            is_public=bool(s.is_public),
            artisan_name=m.name if m else None,
        )
        for s, m in sanad_rows
    ]
    return BundleDetail(
        id=bundle.id,
        name=bundle.name,
        description=bundle.description,
        price=bundle.price,
        sanad_ids=list(bundle.sanad_ids or []),
        created_at=bundle.created_at,
        sanads=sanads,
    )
