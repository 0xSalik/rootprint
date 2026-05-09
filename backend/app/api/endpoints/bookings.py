"""Bookings — the buyer-side of the Ustaad layer.

The ``POST /api/v1/commerce/book`` endpoint already creates bookings.
This module exposes the read side so the frontend can render
"my bookings" pages.

* ``GET  /api/v1/bookings/me``       → all bookings I made (by phone).
* ``GET  /api/v1/bookings/{id}``     → single booking detail (by phone).
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.common import Page, PaginationParams
from app.core.database import get_db
from app.models.models import Booking, Master, Workshop

router = APIRouter()


class BookingPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    workshop_id: uuid.UUID
    user_phone: str
    booking_date: datetime
    status: Optional[str] = "confirmed"
    payment_id: Optional[str] = None
    num_participants: int
    created_at: datetime


class BookingWithWorkshop(BookingPublic):
    workshop_format: Optional[str] = None
    workshop_price: Optional[float] = None
    master_id: Optional[uuid.UUID] = None
    master_name: Optional[str] = None


@router.get("/me", response_model=Page[BookingWithWorkshop])
async def list_my_bookings(
    phone: str = Query(..., description="Caller's phone number — keys mock-OTP demo data."),
    pagination: PaginationParams = Depends(),
    db: AsyncSession = Depends(get_db),
) -> Page[BookingWithWorkshop]:
    """Return every booking made under the supplied phone number.

    Authenticated by phone for the hackathon. The frontend already has
    the phone in ``localStorage`` from the OTP login.
    """

    base = (
        select(Booking, Workshop, Master)
        .join(Workshop, Workshop.id == Booking.workshop_id)
        .join(Master, Master.id == Workshop.master_id, isouter=True)
        .where(Booking.user_phone == phone)
    )
    count_stmt = select(func.count()).select_from(Booking).where(Booking.user_phone == phone)

    total = (await db.execute(count_stmt)).scalar_one()
    rows = (
        await db.execute(
            base.order_by(Booking.created_at.desc())
            .limit(pagination.limit)
            .offset(pagination.offset)
        )
    ).all()

    items: list[BookingWithWorkshop] = []
    for b, w, m in rows:
        items.append(
            BookingWithWorkshop(
                id=b.id,
                workshop_id=b.workshop_id,
                user_phone=b.user_phone,
                booking_date=b.booking_date,
                status=b.status,
                payment_id=b.payment_id,
                num_participants=b.num_participants,
                created_at=b.created_at,
                workshop_format=w.format if w else None,
                workshop_price=w.price if w else None,
                master_id=m.id if m else None,
                master_name=m.name if m else None,
            )
        )
    return Page[BookingWithWorkshop](
        items=items, total=int(total), limit=pagination.limit, offset=pagination.offset
    )


@router.get("/{booking_id}", response_model=BookingWithWorkshop)
async def get_booking(
    booking_id: str,
    phone: str = Query(..., description="Caller's phone (must match booking owner)."),
    db: AsyncSession = Depends(get_db),
) -> BookingWithWorkshop:
    try:
        b_uuid = uuid.UUID(booking_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid booking id.") from exc

    row = (
        await db.execute(
            select(Booking, Workshop, Master)
            .join(Workshop, Workshop.id == Booking.workshop_id)
            .join(Master, Master.id == Workshop.master_id, isouter=True)
            .where(Booking.id == b_uuid)
        )
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Booking not found.")
    b, w, m = row
    if b.user_phone != phone:
        raise HTTPException(status_code=403, detail="This booking belongs to a different phone.")
    return BookingWithWorkshop(
        id=b.id,
        workshop_id=b.workshop_id,
        user_phone=b.user_phone,
        booking_date=b.booking_date,
        status=b.status,
        payment_id=b.payment_id,
        num_participants=b.num_participants,
        created_at=b.created_at,
        workshop_format=w.format if w else None,
        workshop_price=w.price if w else None,
        master_id=m.id if m else None,
        master_name=m.name if m else None,
    )
