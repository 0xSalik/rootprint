import pytest
import sys
import os

# Ensure the backend module is in path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.services.sanad import crypto

def test_generate_keypair():
    priv, pub = crypto.generate_dummy_keypair()
    assert priv is not None
    assert pub is not None
    assert len(priv) > 0
    assert len(pub) > 0

def test_sign_and_verify_success():
    priv, pub = crypto.generate_dummy_keypair()
    metadata = {
        "artisan": "Mohammad Yusuf",
        "technique": "Sozni"
    }
    
    # Sign the message
    signature = crypto.sign_message(priv, metadata)
    assert signature is not None
    
    # Verify the signature
    is_valid = crypto.verify_signature(pub, signature, metadata)
    assert is_valid is True

def test_verify_forged_metadata():
    priv, pub = crypto.generate_dummy_keypair()
    metadata = {
        "artisan": "Mohammad Yusuf",
        "technique": "Sozni"
    }
    
    signature = crypto.sign_message(priv, metadata)
    
    # Attempt to verify with tampered data
    forged_metadata = {
        "artisan": "Fake Artisan",
        "technique": "Sozni"
    }
    
    is_valid = crypto.verify_signature(pub, signature, forged_metadata)
    assert is_valid is False

def test_verify_wrong_key():
    priv1, pub1 = crypto.generate_dummy_keypair()
    priv2, pub2 = crypto.generate_dummy_keypair()
    
    metadata = {"artisan": "Mohammad Yusuf"}
    
    # Sign with key 1
    signature = crypto.sign_message(priv1, metadata)
    
    # Attempt to verify with key 2
    is_valid = crypto.verify_signature(pub2, signature, metadata)
    assert is_valid is False
