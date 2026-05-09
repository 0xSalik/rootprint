from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
import sys
import os

# Add the parent directory to sys.path to import sanad module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from sanad import crypto, qr_engine

router = APIRouter()

class VerificationRequest(BaseModel):
    public_key_hex: str
    signature_hex: str
    metadata: dict

@router.post("/verify")
def verify_sanad_signature(req: VerificationRequest):
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
def get_sanad_qr(sanad_id: str):
    """
    Generates and returns the QR code for a specific Sanad ID.
    """
    qr_bytes = qr_engine.generate_sanad_qr(sanad_id)
    return Response(content=qr_bytes, media_type="image/png")

@router.get("/{sanad_id}")
def get_sanad_details(sanad_id: str):
    """
    Mock endpoint: Returns the provenance metadata for a piece.
    Eventually, this will query the database built by A1.
    """
    # Mock data for the "Kanihama Pashmina" demo
    return {
        "sanad_id": sanad_id,
        "artisan": "Mohammad Yusuf",
        "craft": "Pashmina",
        "lineage": "4th Generation",
        "technique": "1940s Srinagar Knot",
        "materials": "Gurez Valley Wool",
        "status": "Authentic",
        "signature_hex": "mock_signature_data_here"
    }
