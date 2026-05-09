"""Top-level Sanad service the routers depend on."""

from __future__ import annotations

import uuid

import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import get_settings
from ..models.sanad import SanadRow
from ..schemas.sanad import SanadEnvelope, SanadMetadata, SanadVerification
from .canonicalizer import canonicalize
from .keys import KeyManager, get_key_manager
from .qr import qr_image_base64_png
from .signer import SanadSigner
from .verifier import SanadVerifier

log = structlog.get_logger(__name__)


class SanadService:
    def __init__(self, key_manager: KeyManager | None = None) -> None:
        self.settings = get_settings()
        self._km = key_manager or get_key_manager()
        self._signer = SanadSigner(self._km)
        self._verifier = SanadVerifier(self._km)

    @property
    def key_manager(self) -> KeyManager:
        return self._km

    # ── Sign + persist ──────────────────────────────────────────────────
    async def sign_and_store(
        self,
        *,
        session: AsyncSession,
        master_id: str | uuid.UUID,
        payload: SanadMetadata,
        include_qr_image: bool = True,
    ) -> SanadEnvelope:
        envelope = await self._signer.sign(
            session=session,
            master_id=master_id,
            payload=payload,
            sanad_base_url=self.settings.sanad_base_url,
            include_qr_image=include_qr_image,
        )
        master_uuid = master_id if isinstance(master_id, uuid.UUID) else uuid.UUID(str(master_id))
        key_row = await self._km.get_active_key(session, master_uuid)
        canonical_payload = canonicalize(payload)
        row = SanadRow(
            id=uuid.uuid4(),
            master_id=master_uuid,
            key_version=key_row.version,
            sanad_id_public=payload.sanad_id,
            piece_id=payload.piece_id,
            payload=payload.model_dump(mode="json"),
            canonical_payload_b64=_b64url(canonical_payload),
            signature_b64=envelope.signature,
            qr_string=envelope.qr_string,
            issued_at=payload.issued_at,
            completed_on=payload.completed_on,
        )
        session.add(row)
        await session.flush()
        return envelope

    # ── Verify ──────────────────────────────────────────────────────────
    async def verify(
        self, *, session: AsyncSession, qr_string: str
    ) -> SanadVerification:
        return await self._verifier.verify_with_db(session=session, qr_string=qr_string)

    def verify_offline(self, *, qr_string: str, public_key_bytes: bytes) -> SanadVerification:
        return self._verifier.verify_offline(
            qr_string=qr_string, public_key_bytes=public_key_bytes
        )

    @staticmethod
    def regenerate_qr_image(qr_string: str) -> str:
        return qr_image_base64_png(qr_string)


def _b64url(data: bytes) -> str:
    import base64

    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


_singleton: SanadService | None = None


def get_sanad_service() -> SanadService:
    global _singleton
    if _singleton is None:
        _singleton = SanadService()
    return _singleton
