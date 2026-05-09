"""Orders — Bazaar buyer-side reads.

The ``POST /api/v1/commerce/checkout`` endpoint already creates orders.
This module exposes the read side so the buyer can see "my orders".

* ``GET /api/v1/orders/me``        → list my orders (by phone).
* ``GET /api/v1/orders/{id}``      → single order detail (by phone).
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
from app.models.models import Bundle, Order

router = APIRouter()


class OrderPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    bundle_id: Optional[uuid.UUID] = None
    user_phone: str
    status: Optional[str] = "pending"
    shipping_address: Optional[str] = None
    payment_id: Optional[str] = None
    created_at: datetime


class OrderWithBundle(OrderPublic):
    bundle_name: Optional[str] = None
    bundle_price: Optional[float] = None


@router.get("/me", response_model=Page[OrderWithBundle])
async def list_my_orders(
    phone: str = Query(..., description="Caller's phone."),
    pagination: PaginationParams = Depends(),
    db: AsyncSession = Depends(get_db),
) -> Page[OrderWithBundle]:
    total = (
        await db.execute(
            select(func.count()).select_from(Order).where(Order.user_phone == phone)
        )
    ).scalar_one()
    rows = (
        await db.execute(
            select(Order, Bundle)
            .join(Bundle, Bundle.id == Order.bundle_id, isouter=True)
            .where(Order.user_phone == phone)
            .order_by(Order.created_at.desc())
            .limit(pagination.limit)
            .offset(pagination.offset)
        )
    ).all()

    items = [
        OrderWithBundle(
            id=o.id,
            bundle_id=o.bundle_id,
            user_phone=o.user_phone,
            status=o.status,
            shipping_address=o.shipping_address,
            payment_id=o.payment_id,
            created_at=o.created_at,
            bundle_name=b.name if b else None,
            bundle_price=b.price if b else None,
        )
        for o, b in rows
    ]
    return Page[OrderWithBundle](
        items=items, total=int(total), limit=pagination.limit, offset=pagination.offset
    )


@router.get("/{order_id}", response_model=OrderWithBundle)
async def get_order(
    order_id: str,
    phone: str = Query(..., description="Caller's phone (must match order owner)."),
    db: AsyncSession = Depends(get_db),
) -> OrderWithBundle:
    try:
        o_uuid = uuid.UUID(order_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid order id.") from exc
    row = (
        await db.execute(
            select(Order, Bundle)
            .join(Bundle, Bundle.id == Order.bundle_id, isouter=True)
            .where(Order.id == o_uuid)
        )
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Order not found.")
    o, b = row
    if o.user_phone != phone:
        raise HTTPException(status_code=403, detail="This order belongs to a different phone.")
    return OrderWithBundle(
        id=o.id,
        bundle_id=o.bundle_id,
        user_phone=o.user_phone,
        status=o.status,
        shipping_address=o.shipping_address,
        payment_id=o.payment_id,
        created_at=o.created_at,
        bundle_name=b.name if b else None,
        bundle_price=b.price if b else None,
    )
