"""Sign / verify chain — round trip + tamper detection."""

from __future__ import annotations

from datetime import datetime, timezone

from nacl.signing import SigningKey

from hunarmand_ai.sanad.canonicalizer import canonicalize
from hunarmand_ai.sanad.keys import KeyManager
from hunarmand_ai.sanad.qr import (
    decode_qr_string,
    encode_qr_string,
    signed_message,
)
from hunarmand_ai.schemas.sanad import (
    CraftLineageRef,
    SanadHeader,
    SanadMetadata,
)


def _payload() -> SanadMetadata:
    return SanadMetadata(
        sanad_id="KNH-PSH-2025-0042",
        piece_id="shawl-2025-0042",
        craft_category="pashmina_weaving",
        technique_ids=["tech-kani-buti"],
        technique_names=["Kani-buti twill-tapestry"],
        materials_summary=["Changthangi pashmina wool"],
        completed_on=datetime(2025, 4, 12, tzinfo=timezone.utc),
        issued_at=datetime(2025, 4, 13, tzinfo=timezone.utc),
        lineage=CraftLineageRef(master_id="m-1", master_name="Mohammad Yusuf"),
        short_summary="Kani-buti pashmina shawl",
    )


def _sign() -> tuple[str, bytes, SanadMetadata]:
    payload = _payload()
    header = SanadHeader(kid="m-1:1")
    sk = SigningKey.generate()
    msg = signed_message(canonicalize(header), canonicalize(payload))
    sig = sk.sign(msg).signature
    qr = encode_qr_string(header=header, payload=payload, signature=sig)
    return qr, bytes(sk.verify_key), payload


def test_round_trip_verifies() -> None:
    qr, pub, _ = _sign()
    h, p, sig, hb, pb = decode_qr_string(qr)
    assert KeyManager.verify(public_key_bytes=pub, message=signed_message(hb, pb), signature=sig)


def test_tampered_payload_fails() -> None:
    """Tampering the canonical payload bytes must fail signature verification.

    We re-encode a *modified* payload with the original signature so the
    JWS-style string still parses but the signed message no longer matches.
    """

    import base64
    from hunarmand_ai.sanad.canonicalizer import canonicalize

    qr, pub, payload = _sign()
    parts = qr.split(".")

    # Mutate one field in the payload, re-canonicalise, and splice the
    # bytes back into the QR string with the *original* signature.
    payload.short_summary = payload.short_summary + " (tampered)"
    bad_payload_bytes = canonicalize(payload)
    bad_payload_b64 = base64.urlsafe_b64encode(bad_payload_bytes).rstrip(b"=").decode("ascii")
    tampered = parts[0] + "." + bad_payload_b64 + "." + parts[2]

    h, p, sig, hb, pb = decode_qr_string(tampered)
    assert not KeyManager.verify(public_key_bytes=pub, message=signed_message(hb, pb), signature=sig)


def test_swapped_signature_fails() -> None:
    qr, pub, _ = _sign()
    other = SigningKey.generate()
    parts = qr.split(".")
    h, p, _sig, hb, pb = decode_qr_string(qr)
    other_sig = other.sign(signed_message(hb, pb)).signature
    assert not KeyManager.verify(
        public_key_bytes=pub,
        message=signed_message(hb, pb),
        signature=other_sig,
    )


def test_kid_round_trip() -> None:
    kid = KeyManager.kid("00000000-0000-4000-8000-000000000001", 7)
    master_id, version = KeyManager.parse_kid(kid)
    assert version == 7
    assert master_id == "00000000-0000-4000-8000-000000000001"


def test_public_key_b64_round_trip() -> None:
    sk = SigningKey.generate()
    pub_bytes = bytes(sk.verify_key)
    encoded = KeyManager.public_key_b64(pub_bytes)
    assert "=" not in encoded
    assert KeyManager.public_key_from_b64(encoded) == pub_bytes


def test_decode_rejects_malformed() -> None:
    import pytest

    with pytest.raises(ValueError):
        decode_qr_string("not-a-real-sanad")
