from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

import stripe
import os

stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "sk_test_mock_key_for_hackathon")

class CheckoutRequest(BaseModel):
    item_id: str
    quantity: int

@router.post("/checkout")
def checkout_cart(req: CheckoutRequest):
    """
    Mock endpoint: Initiates the Bazaar checkout process.
    Integrates Stripe in test mode for split payments.
    """
    # Hardcoded price for the Kanihama Pashmina mock demo
    price_inr = 54000 
    total_inr = price_inr * req.quantity
    
    # Simulating the split-payout logic (A2 responsibility)
    platform_fee = int(total_inr * 0.08) # 8%
    artisan_payout = total_inr - platform_fee
    
    # Mocking the Stripe Checkout Session creation
    try:
        if stripe.api_key == "sk_test_mock_key_for_hackathon":
            raise stripe.error.AuthenticationError("Using mock key", "")
            
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'inr',
                    'product_data': {
                        'name': 'Verified Kanihama Pashmina',
                        'description': 'Hand-knotted, 1940s technique. Includes Sanad Provenance.'
                    },
                    'unit_amount': price_inr * 100, # Stripe uses paise
                },
                'quantity': req.quantity,
            }],
            payment_intent_data={
                'application_fee_amount': platform_fee * 100,
                'transfer_data': {
                    'destination': 'acct_mock_artisan_id',
                },
            },
            mode='payment',
            success_url='https://hunarmand.com/success',
            cancel_url='https://hunarmand.com/cancel',
        )
        session_id = session.id
        session_url = session.url
    except Exception as e:
        # Fallback for the hackathon demo if keys aren't set
        session_id = "cs_test_mock_12345"
        session_url = "https://checkout.stripe.com/mock"
        
    return {
        "status": "success",
        "order_id": "ord_123abc",
        "total_amount_inr": total_inr,
        "split_breakdown": {
            "artisan_receives_inr": artisan_payout,
            "platform_fee_inr": platform_fee
        },
        "payment_gateway": {
            "session_id": session_id,
            "checkout_url": session_url
        }
    }
