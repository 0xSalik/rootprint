from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class BookingRequest(BaseModel):
    artisan_id: str
    date: str
    participants: int
    format: str # e.g., "Heritage Walk", "Master Session"

@router.get("/workshops/{artisan_id}")
def get_available_workshops(artisan_id: str):
    """
    Mock endpoint: Returns the living-museum workshops available for an artisan.
    """
    return {
        "artisan_id": artisan_id,
        "workshops": [
            {"id": "ws_1", "format": "Heritage Walk", "duration_hrs": 3, "price_inr": 2500},
            {"id": "ws_2", "format": "Half-Day Masterclass", "duration_hrs": 4, "price_inr": 6000}
        ]
    }

@router.post("/book")
def create_booking(req: BookingRequest):
    """
    Mock endpoint: Books an Ustaad session and returns a confirmation.
    """
    return {
        "status": "success",
        "booking_id": "bkg_789xyz",
        "message": f"Successfully booked {req.format} for {req.participants} people on {req.date}.",
        "payment_status": "pending"
    }
