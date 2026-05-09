import nacl.signing
import nacl.encoding
import nacl.exceptions
import json

def verify_signature(public_key_hex: str, signature_hex: str, message: dict) -> bool:
    """
    Verifies the Ed25519 signature of a canonicalized JSON message.
    """
    try:
        verify_key = nacl.signing.VerifyKey(public_key_hex, encoder=nacl.encoding.HexEncoder)
        canonical_msg = json.dumps(message, sort_keys=True).encode('utf-8')
        verify_key.verify(canonical_msg, nacl.encoding.HexEncoder.decode(signature_hex))
        return True
    except nacl.exceptions.BadSignatureError:
        return False

def generate_dummy_keypair():
    """
    Generates a dummy Ed25519 keypair for testing purposes.
    Returns (private_key_hex, public_key_hex).
    """
    signing_key = nacl.signing.SigningKey.generate()
    verify_key = signing_key.verify_key
    return (
        signing_key.encode(encoder=nacl.encoding.HexEncoder).decode('utf-8'),
        verify_key.encode(encoder=nacl.encoding.HexEncoder).decode('utf-8')
    )

def sign_message(private_key_hex: str, message: dict) -> str:
    """
    Signs a canonicalized JSON message using a private key.
    Returns the signature in hex format.
    """
    signing_key = nacl.signing.SigningKey(private_key_hex, encoder=nacl.encoding.HexEncoder)
    canonical_msg = json.dumps(message, sort_keys=True).encode('utf-8')
    signed = signing_key.sign(canonical_msg)
    return nacl.encoding.HexEncoder.encode(signed.signature).decode('utf-8')

if __name__ == "__main__":
    # Quick sanity check
    priv, pub = generate_dummy_keypair()
    sample_metadata = {"artisan": "Mohammad Yusuf", "technique": "Sozni"}
    sig = sign_message(priv, sample_metadata)
    
    print("Validating true signature:", verify_signature(pub, sig, sample_metadata))
    print("Validating forged metadata:", verify_signature(pub, sig, {"artisan": "Fake", "technique": "Sozni"}))
