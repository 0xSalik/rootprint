"""Top-level Sanad service the routers depend on."""

from __future__ import annotations

import uuid

import structlog
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import get_settings
from ..models.sanad import SanadRow
from ..schemas.sanad import SanadEnvelope, SanadHeader, SanadMetadata, SanadVerification
from .canonicalizer import canonicalize
from .keys import KeyManager, get_key_manager
from .qr import encode_qr_string, qr_image_base64_png
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
        """Sign the payload and persist a row, idempotently on ``sanad_id``.

        ``ai_sanads.sanad_id_public`` is unique. Without idempotency, a
        second click on a form that hasn't regenerated its sanad_id (or
        a network retry) would crash on the unique constraint and
        return 500 to the artisan. Two cases to handle:

          * Same ``sanad_id`` + same canonical payload → return the
            existing envelope. This is a true replay (the bytes the
            buyer would scan are byte-identical to the prior mint).

          * Same ``sanad_id`` + different canonical payload → reject
            with 409 Conflict. Two distinct pieces cannot share an id;
            the caller must mint with a fresh id.

        We do the SELECT before signing so we don't burn an Ed25519
        signature for a row we'd never persist; we still race-recover
        on ``IntegrityError`` in case two concurrent requests slip
        through.
        """

        master_uuid = master_id if isinstance(master_id, uuid.UUID) else uuid.UUID(str(master_id))
        canonical_payload_b64 = _b64url(canonicalize(payload))

        existing = await self._lookup_by_public_id(
            session=session,
            master_id=master_uuid,
            sanad_id_public=payload.sanad_id,
        )
        if existing is not None:
            return self._envelope_from_row(
                row=existing,
                expected_canonical=canonical_payload_b64,
                include_qr_image=include_qr_image,
            )

        envelope = await self._signer.sign(
            session=session,
            master_id=master_uuid,
            payload=payload,
            sanad_base_url=self.settings.sanad_base_url,
            include_qr_image=include_qr_image,
        )
        key_row = await self._km.get_active_key(session, master_uuid)
        row = SanadRow(
            id=uuid.uuid4(),
            master_id=master_uuid,
            key_version=key_row.version,
            sanad_id_public=payload.sanad_id,
            piece_id=payload.piece_id,
            payload=payload.model_dump(mode="json"),
            canonical_payload_b64=canonical_payload_b64,
            signature_b64=envelope.signature,
            qr_string=envelope.qr_string,
            issued_at=payload.issued_at,
            completed_on=payload.completed_on,
        )
        session.add(row)
        try:
            await session.flush()
        except IntegrityError:
            # Race: another request inserted the same sanad_id_public
            # between our lookup and our flush. Roll back, re-fetch the
            # winner, and validate it matches our payload.
            await session.rollback()
            existing = await self._lookup_by_public_id(
                session=session,
                master_id=master_uuid,
                sanad_id_public=payload.sanad_id,
            )
            if existing is None:
                raise
            return self._envelope_from_row(
                row=existing,
                expected_canonical=canonical_payload_b64,
                include_qr_image=include_qr_image,
            )
        return envelope

    # ── Helpers ─────────────────────────────────────────────────────────
    @staticmethod
    async def _lookup_by_public_id(
        *,
        session: AsyncSession,
        master_id: uuid.UUID,
        sanad_id_public: str,
    ) -> SanadRow | None:
        stmt = select(SanadRow).where(
            SanadRow.master_id == master_id,
            SanadRow.sanad_id_public == sanad_id_public,
        )
        return (await session.execute(stmt)).scalar_one_or_none()

    def _envelope_from_row(
        self,
        *,
        row: SanadRow,
        expected_canonical: str,
        include_qr_image: bool,
    ) -> SanadEnvelope:
        if row.canonical_payload_b64 != expected_canonical:
            log.warning(
                "sanad.sign.id_conflict",
                master_id=str(row.master_id),
                sanad_id=row.sanad_id_public,
            )
            raise HTTPException(
                status_code=409,
                detail=(
                    f"Sanad id {row.sanad_id_public!r} is already minted with a "
                    "different payload. Mint with a fresh id."
                ),
            )
        log.info(
            "sanad.sign.replay",
            master_id=str(row.master_id),
            sanad_id=row.sanad_id_public,
            kid=self._km.kid(row.master_id, row.key_version),
        )
        payload = SanadMetadata.model_validate(row.payload)
        header = SanadHeader(kid=self._km.kid(row.master_id, row.key_version))
        if row.qr_string:
            qr_string = row.qr_string
        else:
            # Defensive: very old rows pre-dating the qr_string column
            # being NOT NULL would be missing it; rebuild.
            import base64

            signature = base64.urlsafe_b64decode(row.signature_b64 + "=" * (-len(row.signature_b64) % 4))
            qr_string = encode_qr_string(header=header, payload=payload, signature=signature)
        qr_image = qr_image_base64_png(qr_string) if include_qr_image else None
        sanad_base = self.settings.sanad_base_url.rstrip("/")
        return SanadEnvelope(
            header=header,
            payload=payload,
            signature=row.signature_b64,
            qr_string=qr_string,
            qr_image_base64=qr_image,
            public_url=f"{sanad_base}/{row.sanad_id_public}",
        )

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
