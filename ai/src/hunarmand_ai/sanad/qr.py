"""QR payload encoding.

Wire format (compact, JWS-style):

    base64url(header_json) "." base64url(canonical_payload) "." base64url(signature)

* base64url is RFC 4648 §5 *unpadded*.
* ``header_json`` is the canonicalised ``SanadHeader``.
* ``canonical_payload`` is the canonicalised ``SanadMetadata``.
* ``signature`` is the raw 64-byte Ed25519 signature.

A verifier needs only:
* the QR string
* the master's public key, looked up by ``header.kid``

For *fully offline* verification, the verifier app pre-syncs the
public-key registry. The registry is itself signed by a long-lived
"root" key managed by Hunarmand.
"""

from __future__ import annotations

import base64
import io
import json

import qrcode
from qrcode.constants import ERROR_CORRECT_M

from ..schemas.sanad import SanadHeader, SanadMetadata
from .canonicalizer import canonicalize


QR_HEADER_TYP = "hunarmand-sanad+v1"


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64url_decode(value: str) -> bytes:
    padded = value + "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(padded.encode("ascii"))


def encode_qr_string(*, header: SanadHeader, payload: SanadMetadata, signature: bytes) -> str:
    header_bytes = canonicalize(header)
    payload_bytes = canonicalize(payload)
    return ".".join([_b64url(header_bytes), _b64url(payload_bytes), _b64url(signature)])


def decode_qr_string(qr_string: str) -> tuple[SanadHeader, SanadMetadata, bytes, bytes, bytes]:
    """Return (header, payload, signature, header_bytes, payload_bytes).

    ``header_bytes`` and ``payload_bytes`` are exactly the bytes that
    were signed. Any verifier MUST sign the same bytes; we expose them
    so downstream code does not need to re-canonicalise.
    """

    parts = qr_string.split(".")
    if len(parts) != 3:
        raise ValueError("Invalid Sanad QR string: expected 3 parts.")
    header_b64, payload_b64, sig_b64 = parts
    header_bytes = _b64url_decode(header_b64)
    payload_bytes = _b64url_decode(payload_b64)
    signature = _b64url_decode(sig_b64)
    header = SanadHeader.model_validate(json.loads(header_bytes.decode("utf-8")))
    payload = SanadMetadata.model_validate(json.loads(payload_bytes.decode("utf-8")))
    return header, payload, signature, header_bytes, payload_bytes


def signed_message(header_bytes: bytes, payload_bytes: bytes) -> bytes:
    """The exact byte sequence the signature covers.

    We sign ``header_bytes + b'.' + payload_bytes`` so verifiers can
    reproduce it from the wire format without re-canonicalising the
    objects (which would risk drift between languages).
    """

    return header_bytes + b"." + payload_bytes


def qr_image_base64_png(qr_string: str) -> str:
    """Return a base64-encoded PNG of the QR code for embedding in HTML."""

    qr = qrcode.QRCode(
        version=None,
        error_correction=ERROR_CORRECT_M,
        box_size=8,
        border=2,
    )
    qr.add_data(qr_string)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#1E3A5F", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("ascii")
