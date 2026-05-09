import uuid
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import stripe
import os
from datetime import datetime

from app.core.database import get_db
from app.models.models import Workshop, Booking, Bundle, Order, Master
from app.api.deps import get_current_master

router = APIRouter()
stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "sk_test_mock_key_for_hackathon")

class BookingRequest(BaseModel):
    workshop_id: str
    user_phone: str
    date: str
    participants: int

class CheckoutRequest(BaseModel):
    bundle_id: str
    user_phone: str

@router.get("/workshops/{master_id}")
async def get_available_workshops(master_id: str, db: AsyncSession = Depends(get_db)):
    try:
        m_uuid = uuid.UUID(master_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid master ID.")
        
    result = await db.execute(select(Workshop).where(Workshop.master_id == m_uuid, Workshop.is_active == True))
    workshops = result.scalars().all()
    
    return {
        "master_id": master_id,
        "workshops": [
            {
                "id": str(ws.id),
                "format": ws.format,
                "duration_mins": ws.duration_mins,
                "price": ws.price,
                "description": ws.description
            } for ws in workshops
        ]
    }

@router.post("/book")
async def create_booking(req: BookingRequest, db: AsyncSession = Depends(get_db)):
    try:
        ws_uuid = uuid.UUID(req.workshop_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid workshop ID.")
        
    ws_result = await db.execute(select(Workshop).where(Workshop.id == ws_uuid))
    workshop = ws_result.scalars().first()
    if not workshop:
        raise HTTPException(status_code=404, detail="Workshop not found.")
        
    try:
        # Handle simple dates like "2026-05-15T10:00:00"
        dt = datetime.fromisoformat(req.date.replace("Z", "+00:00"))
    except ValueError:
        # Fallback to current time if parsing fails for mock requests
        dt = datetime.utcnow()

    new_booking = Booking(
        workshop_id=ws_uuid,
        user_phone=req.user_phone,
        booking_date=dt,
        num_participants=req.participants,
        status="pending"
    )
    db.add(new_booking)
    await db.commit()
    await db.refresh(new_booking)
    
    return {
        "status": "success",
        "booking_id": str(new_booking.id),
        "message": f"Successfully booked {workshop.format} for {req.participants} people.",
        "payment_status": "pending"
    }

@router.post("/checkout")
async def checkout_cart(req: CheckoutRequest, db: AsyncSession = Depends(get_db)):
    try:
        b_uuid = uuid.UUID(req.bundle_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid bundle ID.")
        
    bundle_result = await db.execute(select(Bundle).where(Bundle.id == b_uuid))
    bundle = bundle_result.scalars().first()
    if not bundle:
        raise HTTPException(status_code=404, detail="Bundle not found.")
        
    price_inr = int(bundle.price)
    platform_fee = int(price_inr * 0.08) # 8%
    artisan_payout = price_inr - platform_fee
    
    # Create the Order
    new_order = Order(
        bundle_id=b_uuid,
        user_phone=req.user_phone,
        status="pending"
    )
    db.add(new_order)
    await db.commit()
    await db.refresh(new_order)
    
    try:
        if stripe.api_key == "sk_test_mock_key_for_hackathon":
            raise stripe.error.AuthenticationError("Using mock key", "")
            
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'inr',
                    'product_data': {
                        'name': bundle.name,
                        'description': bundle.description or "Verified authentic craft."
                    },
                    'unit_amount': price_inr * 100,
                },
                'quantity': 1,
            }],
            payment_intent_data={
                'application_fee_amount': platform_fee * 100,
                'transfer_data': {
                    'destination': 'acct_mock_artisan_id',
                },
            },
            mode='payment',
            success_url=f'https://hunarmand.com/success?order_id={new_order.id}',
            cancel_url='https://hunarmand.com/cancel',
        )
        session_id = session.id
        session_url = session.url
    except Exception as e:
        session_id = "cs_test_mock_12345"
        session_url = "https://checkout.stripe.com/mock"
        
    return {
        "status": "success",
        "order_id": str(new_order.id),
        "total_amount_inr": price_inr,
        "split_breakdown": {
            "artisan_receives_inr": artisan_payout,
            "platform_fee_inr": platform_fee
        },
        "payment_gateway": {
            "session_id": session_id,
            "checkout_url": session_url
        }
    }
