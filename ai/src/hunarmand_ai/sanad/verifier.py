"""Sanad verification.

Two paths:

* **Offline-style:** caller supplies the QR string and the master's
  public key (a verifier app caches the registry on device).
* **DB-backed:** caller supplies only the QR string; we resolve the
  public key via ``KeyManager`` and the database.

Both paths run the *same* signature check and return the same
``SanadVerification`` shape.
"""

from __future__ import annotations

import uuid

import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from ..schemas.sanad import SanadVerification
from .keys import KeyManager, get_key_manager
from .qr import decode_qr_string, signed_message

log = structlog.get_logger(__name__)


class SanadVerifier:
    def __init__(self, key_manager: KeyManager | None = None) -> None:
        self._km = key_manager or get_key_manager()

    def verify_offline(self, *, qr_string: str, public_key_bytes: bytes) -> SanadVerification:
        try:
            header, payload, signature, header_bytes, payload_bytes = decode_qr_string(qr_string)
        except Exception as exc:  # noqa: BLE001
            return SanadVerification(valid=False, reason=f"Decode error: {exc}")

        msg = signed_message(header_bytes, payload_bytes)
        ok = KeyManager.verify(
            public_key_bytes=public_key_bytes, message=msg, signature=signature
        )
        if not ok:
            return SanadVerification(valid=False, reason="Signature does not verify.")

        return SanadVerification(
            valid=True,
            sanad_id=payload.sanad_id,
            master_id=payload.lineage.master_id,
            master_name=payload.lineage.master_name,
            payload=payload,
        )

    async def verify_with_db(
        self, *, session: AsyncSession, qr_string: str
    ) -> SanadVerification:
        try:
            header, payload, signature, header_bytes, payload_bytes = decode_qr_string(qr_string)
        except Exception as exc:  # noqa: BLE001
            return SanadVerification(valid=False, reason=f"Decode error: {exc}")

        try:
            master_id_str, version = self._km.parse_kid(header.kid)
            master_uuid = uuid.UUID(master_id_str)
        except (ValueError, TypeError) as exc:
            return SanadVerification(valid=False, reason=f"Bad kid: {exc}")

        try:
            key_row = await self._km.get_key_by_version(session, master_uuid, version)
        except LookupError as exc:
            return SanadVerification(valid=False, reason=str(exc))

        msg = signed_message(header_bytes, payload_bytes)
        ok = KeyManager.verify(
            public_key_bytes=key_row.public_key, message=msg, signature=signature
        )
        if not ok:
            log.warning("sanad.verify.fail", kid=header.kid, sanad_id=payload.sanad_id)
            return SanadVerification(valid=False, reason="Signature does not verify.")

        return SanadVerification(
            valid=True,
            sanad_id=payload.sanad_id,
            master_id=str(master_uuid),
            master_name=payload.lineage.master_name,
            payload=payload,
        )
