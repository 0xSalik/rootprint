import pytest
from fastapi.testclient import TestClient
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from main import app
from sanad import crypto

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "message": "Hunarmand API is running."}

def test_sanad_verification_success():
    priv, pub = crypto.generate_dummy_keypair()
    metadata = {"artisan": "Test Master", "craft": "Pashmina"}
    signature = crypto.sign_message(priv, metadata)
    
    response = client.post(
        "/api/sanad/verify",
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
        "/api/sanad/verify",
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
        "/api/bazaar/checkout",
        json={
            "item_id": "test_shawl",
            "quantity": 2
        }
    )
    assert response.status_code == 200
    data = response.json()
    
    # Price per unit is hardcoded as 54000 in the mock
    expected_total = 54000 * 2
    expected_fee = int(expected_total * 0.08)
    expected_artisan = expected_total - expected_fee
    
    assert data["total_amount_inr"] == expected_total
    assert data["split_breakdown"]["platform_fee_inr"] == expected_fee
    assert data["split_breakdown"]["artisan_receives_inr"] == expected_artisan
