from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from pydantic import BaseModel
import uuid
from datetime import datetime

from app.schemas.auth import SendOTPRequest, VerifyOTPRequest, Token
from app.core.database import get_db
from app.models.models import Master
from app.core.security import create_access_token
from app.api.deps import get_current_master

router = APIRouter()

# Schema for the GET /masters response
class MasterResponse(BaseModel):
    id: uuid.UUID
    phone: str
    name: str
    created_at: datetime

    class Config:
        from_attributes = True

# In a real app, this would be backed by a Redis cache
mock_otp_store = {}

@router.post("/send-otp")
async def send_otp(request: SendOTPRequest):
    # Mock sending OTP
    mock_otp_store[request.phone] = "123456" # Hardcoded for hackathon
    return {"message": "OTP sent successfully (mocked: 123456)"}

@router.post("/verify-otp", response_model=Token)
async def verify_otp(request: VerifyOTPRequest, db: AsyncSession = Depends(get_db)):
    stored_otp = mock_otp_store.get(request.phone)
    if not stored_otp or stored_otp != request.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    # Check if master exists, if not, create one
    result = await db.execute(select(Master).where(Master.phone == request.phone))
    master = result.scalars().first()
    
    if not master:
        master = Master(phone=request.phone, name="New Artisan")
        db.add(master)
        await db.commit()
        await db.refresh(master)
        
    # Clear OTP
    if request.phone in mock_otp_store:
        del mock_otp_store[request.phone]
    
    access_token = create_access_token(subject=str(master.id))
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=MasterResponse)
async def get_my_profile(current_master: Master = Depends(get_current_master)):
    """
    Test GET Request: Retrieves your own profile using your JWT Token.
    """
    return current_master

@router.get("/masters", response_model=List[MasterResponse])
async def list_all_masters(db: AsyncSession = Depends(get_db)):
    """
    Test GET Request: Lists all master artisans currently in the database.
    Does not require a token. You can open this directly in your browser.
    """
    result = await db.execute(select(Master))
    masters = result.scalars().all()
    return masters
