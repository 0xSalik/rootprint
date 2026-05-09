"""High-level Sanad signing — ties the canonicaliser, key manager, and
QR encoder together.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from ..schemas.sanad import SanadEnvelope, SanadHeader, SanadMetadata
from .canonicalizer import canonicalize
from .keys import KeyManager, get_key_manager
from .qr import encode_qr_string, qr_image_base64_png, signed_message

log = structlog.get_logger(__name__)


def _utcnow() -> datetime:
    return datetime.now(tz=timezone.utc)


class SanadSigner:
    def __init__(self, key_manager: KeyManager | None = None) -> None:
        self._km = key_manager or get_key_manager()

    async def sign(
        self,
        *,
        session: AsyncSession,
        master_id: uuid.UUID | str,
        payload: SanadMetadata,
        sanad_base_url: str,
        include_qr_image: bool = True,
    ) -> SanadEnvelope:
        master_uuid = master_id if isinstance(master_id, uuid.UUID) else uuid.UUID(str(master_id))
        key_row = await self._km.get_active_key(session, master_uuid)
        kid = self._km.kid(master_uuid, key_row.version)

        header = SanadHeader(kid=kid)
        header_bytes = canonicalize(header)
        payload_bytes = canonicalize(payload)
        msg = signed_message(header_bytes, payload_bytes)
        signature = self._km.sign(key_row=key_row, message=msg)

        qr_string = encode_qr_string(header=header, payload=payload, signature=signature)
        qr_image = qr_image_base64_png(qr_string) if include_qr_image else None
        public_url = f"{sanad_base_url.rstrip('/')}/{payload.sanad_id}"

        log.info(
            "sanad.signed",
            master_id=str(master_uuid),
            sanad_id=payload.sanad_id,
            kid=kid,
        )
        return SanadEnvelope(
            header=header,
            payload=payload,
            signature=self._km.public_key_b64(signature),  # b64url-encoded for JSON transport
            qr_string=qr_string,
            qr_image_base64=qr_image,
            public_url=public_url,
        )
