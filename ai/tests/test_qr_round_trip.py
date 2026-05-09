"""QR encode / decode round trip."""

from __future__ import annotations

from datetime import datetime, timezone

from nacl.signing import SigningKey

from hunarmand_ai.sanad.canonicalizer import canonicalize
from hunarmand_ai.sanad.qr import (
    decode_qr_string,
    encode_qr_string,
    qr_image_base64_png,
    signed_message,
)
from hunarmand_ai.schemas.sanad import (
    CraftLineageRef,
    SanadHeader,
    SanadMetadata,
)


def _make() -> tuple[SanadHeader, SanadMetadata, bytes, bytes]:
    payload = SanadMetadata(
        sanad_id="ID-1",
        piece_id="P-1",
        craft_category="pashmina_weaving",
        completed_on=datetime(2025, 4, 12, tzinfo=timezone.utc),
        issued_at=datetime(2025, 4, 13, tzinfo=timezone.utc),
        lineage=CraftLineageRef(master_id="m-1", master_name="Mohammad Yusuf"),
        short_summary="Demo piece",
    )
    header = SanadHeader(kid="m-1:1")
    sk = SigningKey.generate()
    msg = signed_message(canonicalize(header), canonicalize(payload))
    sig = sk.sign(msg).signature
    return header, payload, sig, bytes(sk.verify_key)


def test_round_trip_preserves_payload() -> None:
    header, payload, sig, _pub = _make()
    qr = encode_qr_string(header=header, payload=payload, signature=sig)
    h, p, sig2, hb, pb = decode_qr_string(qr)
    assert h.kid == header.kid
    assert p.sanad_id == payload.sanad_id
    assert sig2 == sig


def test_qr_image_renders() -> None:
    header, payload, sig, _ = _make()
    qr = encode_qr_string(header=header, payload=payload, signature=sig)
    img_b64 = qr_image_base64_png(qr)
    assert img_b64.startswith("iVBOR") or len(img_b64) > 100  # PNG magic in b64
