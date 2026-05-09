"""Discovery feed — single round-trip aggregate for the homepage.

Returns a small, fixed-shape snapshot of "what's interesting on
Hunarmand right now" so the frontend can render a hero without
needing to wire 5 separate list endpoints.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.models import Bundle, Master, Sanad, Workshop

router = APIRouter()


class MasterCard(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    workshop_location: Optional[str] = None
    bio: Optional[str] = None


class WorkshopCard(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    master_id: uuid.UUID
    master_name: Optional[str] = None
    format: Optional[str] = None
    price: Optional[float] = None
    duration_mins: Optional[int] = None


class BundleCard(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    description: Optional[str] = None
    price: Optional[float] = None


class SanadCard(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    piece_name: str
    artisan_name: Optional[str] = None
    material_origin: Optional[str] = None
    created_at: datetime


class FeedResponse(BaseModel):
    masters: list[MasterCard] = Field(default_factory=list)
    workshops: list[WorkshopCard] = Field(default_factory=list)
    bundles: list[BundleCard] = Field(default_factory=list)
    sanads: list[SanadCard] = Field(default_factory=list)


@router.get("", response_model=FeedResponse)
async def get_feed(
    db: AsyncSession = Depends(get_db),
) -> FeedResponse:
    """Aggregate snapshot — top 6 of each resource."""

    # Masters
    masters = (
        await db.execute(
            select(Master).order_by(Master.created_at.desc()).limit(6)
        )
    ).scalars().all()

    # Workshops + master name
    ws_rows = (
        await db.execute(
            select(Workshop, Master)
            .join(Master, Master.id == Workshop.master_id)
            .where(Workshop.is_active.is_(True))
            .order_by(Workshop.id.desc())
            .limit(6)
        )
    ).all()

    # Bundles
    bundles = (
        await db.execute(
            select(Bundle).order_by(Bundle.created_at.desc()).limit(6)
        )
    ).scalars().all()

    # Public Sanads + artisan name
    sn_rows = (
        await db.execute(
            select(Sanad, Master)
            .join(Master, Master.id == Sanad.master_id, isouter=True)
            .where(Sanad.is_public.is_(True))
            .order_by(Sanad.created_at.desc())
            .limit(6)
        )
    ).all()

    return FeedResponse(
        masters=[MasterCard.model_validate(m) for m in masters],
        workshops=[
            WorkshopCard(
                id=w.id,
                master_id=w.master_id,
                master_name=m.name,
                format=w.format,
                price=w.price,
                duration_mins=w.duration_mins,
            )
            for w, m in ws_rows
        ],
        bundles=[BundleCard.model_validate(b) for b in bundles],
        sanads=[
            SanadCard(
                id=s.id,
                piece_name=s.piece_name,
                artisan_name=(m.name if m else None),
                material_origin=s.material_origin,
                created_at=s.created_at,
            )
            for s, m in sn_rows
        ],
    )
