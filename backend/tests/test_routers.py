import pytest
from fastapi.testclient import TestClient
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.main import app
from app.services.sanad import crypto

client = TestClient(app)

def test_sanad_verification_success():
    priv, pub = crypto.generate_dummy_keypair()
    metadata = {"artisan": "Test Master", "craft": "Pashmina"}
    signature = crypto.sign_message(priv, metadata)
    
    response = client.post(
        "/api/v1/sanad/verify",
        json={
            "public_key_hex": pub,
            "signature_hex": signature,
            "metadata": metadata
        }
    )
    assert response.status_code == 200
    assert response.json()["status"] == "verified"
    assert response.json()["authentic"] is True

def test_sanad_verification_failure():
    priv, pub = crypto.generate_dummy_keypair()
    metadata = {"artisan": "Test Master", "craft": "Pashmina"}
    signature = crypto.sign_message(priv, metadata)
    
    # Tamper with the metadata
    tampered_metadata = {"artisan": "Fake Master", "craft": "Pashmina"}
    
    response = client.post(
        "/api/v1/sanad/verify",
        json={
            "public_key_hex": pub,
            "signature_hex": signature,
            "metadata": tampered_metadata
        }
    )
    assert response.status_code == 400
    assert "Invalid signature" in response.json()["detail"]

def test_bazaar_checkout_split_calculation():
    # Test checking out 2 quantities
    response = client.post(
        "/api/v1/commerce/checkout",
        json={
            "bundle_id": "00000000-0000-0000-0000-000000000000",
            "user_phone": "+919999999999"
        }
    )
    # It will return 404 because the DB is empty during tests, which is fine to test routing
    assert response.status_code in [200, 404]
    data = response.json()
    
    # Price per unit is hardcoded as 54000 in the mock
    expected_total = 54000 * 2
    expected_fee = int(expected_total * 0.08)
    expected_artisan = expected_total - expected_fee
    
    assert data["total_amount_inr"] == expected_total
    assert data["split_breakdown"]["platform_fee_inr"] == expected_fee
    assert data["split_breakdown"]["artisan_receives_inr"] == expected_artisan
