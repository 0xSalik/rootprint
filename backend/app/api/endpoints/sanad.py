import uuid
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.models.models import Sanad, Master
from app.services.sanad import crypto, qr_engine

router = APIRouter()

class VerificationRequest(BaseModel):
    public_key_hex: str
    signature_hex: str
    metadata: dict

@router.post("/verify")
async def verify_sanad_signature(req: VerificationRequest):
    """
    Verifies the Ed25519 signature of the physical piece's metadata.
    """
    is_valid = crypto.verify_signature(
        req.public_key_hex, 
        req.signature_hex, 
        req.metadata
    )
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid signature. Potential counterfeit.")
    
    return {"status": "verified", "authentic": True}

@router.get("/{sanad_id}/qr")
async def get_sanad_qr(sanad_id: str):
    """
    Generates and returns the QR code for a specific Sanad ID.
    """
    qr_bytes = qr_engine.generate_sanad_qr(sanad_id)
    return Response(content=qr_bytes, media_type="image/png")

@router.get("/{sanad_id}")
async def get_sanad_details(sanad_id: str, db: AsyncSession = Depends(get_db)):
    """
    Queries the database for the Sanad metadata and its associated Master Artisan.
    """
    try:
        sanad_uuid = uuid.UUID(sanad_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Sanad UUID format.")
        
    result = await db.execute(select(Sanad).where(Sanad.id == sanad_uuid))
    sanad_record = result.scalars().first()
    
    if not sanad_record:
        raise HTTPException(status_code=404, detail="Sanad record not found.")
        
    master_result = await db.execute(select(Master).where(Master.id == sanad_record.master_id))
    master_record = master_result.scalars().first()
    
    return {
        "sanad_id": str(sanad_record.id),
        "piece_name": sanad_record.piece_name,
        "material_origin": sanad_record.material_origin,
        "signature_hex": sanad_record.crypto_signature,
        "is_public": sanad_record.is_public,
        "artisan": master_record.name if master_record else "Unknown",
        "metadata_json": sanad_record.metadata_json
    }
