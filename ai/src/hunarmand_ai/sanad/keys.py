"""Master keypair lifecycle.

Each master gets one or more Ed25519 keypairs. Public keys are stored
in the clear (they are by design public). Private keys are encrypted
at rest with NaCl SecretBox using a key-encryption-key (KEK) derived
from ``HUNARMAND_KEK_SECRET``.

Rotation: a master may issue a new ``key_version``. Old Sanads continue
to verify against the old public key (looked up by ``kid``) so rotation
never invalidates history.
"""

from __future__ import annotations

import base64
import hashlib
import secrets
import uuid

import structlog
from nacl import encoding
from nacl.exceptions import BadSignatureError, CryptoError
from nacl.secret import SecretBox
from nacl.signing import SigningKey, VerifyKey
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import Settings, get_settings
from ..models.key import MasterKeyRow

log = structlog.get_logger(__name__)


__all__ = ["KeyManager", "get_key_manager", "BadSignatureError", "CryptoError"]


class KeyManager:
    """Manage master keypairs (create, load, sign, verify)."""

    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        self._kek = _derive_kek(self.settings.kek_secret)
        self._kek_fp = _kek_fingerprint(self._kek)
        self._secretbox = SecretBox(self._kek)

    @property
    def kek_fingerprint(self) -> str:
        return self._kek_fp

    # ── Generate ─────────────────────────────────────────────────────────
    async def generate_for_master(
        self,
        *,
        session: AsyncSession,
        master_id: uuid.UUID,
        version: int = 1,
    ) -> MasterKeyRow:
        signing_key = SigningKey.generate()
        verify_key = signing_key.verify_key
        nonce = secrets.token_bytes(SecretBox.NONCE_SIZE)

        encrypted_blob = self._secretbox.encrypt(bytes(signing_key), nonce).ciphertext
        row = MasterKeyRow(
            id=uuid.uuid4(),
            master_id=master_id,
            version=version,
            public_key=bytes(verify_key),
            encrypted_private_key=encrypted_blob,
            nonce=nonce,
            kek_fingerprint=self._kek_fp,
            status="active",
        )
        session.add(row)
        await session.flush()
        log.info(
            "key.generated", master_id=str(master_id), version=version, kid=self.kid(master_id, version)
        )
        return row

    # ── Load ─────────────────────────────────────────────────────────────
    async def get_active_key(
        self, session: AsyncSession, master_id: uuid.UUID
    ) -> MasterKeyRow:
        stmt = (
            select(MasterKeyRow)
            .where(MasterKeyRow.master_id == master_id, MasterKeyRow.status == "active")
            .order_by(MasterKeyRow.version.desc())
            .limit(1)
        )
        row = (await session.execute(stmt)).scalar_one_or_none()
        if not row:
            raise LookupError(f"No active key for master {master_id}")
        return row

    async def get_key_by_version(
        self, session: AsyncSession, master_id: uuid.UUID, version: int
    ) -> MasterKeyRow:
        stmt = select(MasterKeyRow).where(
            MasterKeyRow.master_id == master_id, MasterKeyRow.version == version
        )
        row = (await session.execute(stmt)).scalar_one_or_none()
        if not row:
            raise LookupError(f"No key for master {master_id} version {version}")
        return row

    # ── Sign / Verify ────────────────────────────────────────────────────
    def sign(self, *, key_row: MasterKeyRow, message: bytes) -> bytes:
        if key_row.kek_fingerprint != self._kek_fp:
            raise CryptoError(
                "KEK fingerprint mismatch — the key was encrypted with a different KEK."
            )
        seed = self._secretbox.decrypt(key_row.encrypted_private_key, key_row.nonce)
        signing_key = SigningKey(seed)
        signed = signing_key.sign(message)
        return signed.signature

    @staticmethod
    def verify(*, public_key_bytes: bytes, message: bytes, signature: bytes) -> bool:
        try:
            VerifyKey(public_key_bytes).verify(message, signature)
            return True
        except BadSignatureError:
            return False

    # ── Public-key registry helpers ──────────────────────────────────────
    @staticmethod
    def kid(master_id: uuid.UUID | str, version: int) -> str:
        return f"{master_id}:{version}"

    @staticmethod
    def parse_kid(kid: str) -> tuple[str, int]:
        master_id, _, version = kid.partition(":")
        if not master_id or not version.isdigit():
            raise ValueError(f"Invalid kid: {kid!r}")
        return master_id, int(version)

    @staticmethod
    def public_key_b64(public_key_bytes: bytes) -> str:
        return base64.urlsafe_b64encode(public_key_bytes).rstrip(b"=").decode("ascii")

    @staticmethod
    def public_key_from_b64(value: str) -> bytes:
        padded = value + "=" * (-len(value) % 4)
        return base64.urlsafe_b64decode(padded.encode("ascii"))

    @staticmethod
    def hex_public_key(public_key_bytes: bytes) -> str:
        return encoding.HexEncoder.encode(public_key_bytes).decode("ascii")


# ── KEK helpers ─────────────────────────────────────────────────────────────


def _derive_kek(secret: str) -> bytes:
    """Derive a 32-byte SecretBox key from a user-supplied secret.

    We use SHA-256 for determinism. In production, swap this for HKDF
    or KMS-managed keys.
    """

    return hashlib.sha256(secret.encode("utf-8")).digest()


def _kek_fingerprint(kek: bytes) -> str:
    return hashlib.sha256(kek).hexdigest()[:32]


_singleton: KeyManager | None = None


def get_key_manager() -> KeyManager:
    global _singleton
    if _singleton is None:
        _singleton = KeyManager()
    return _singleton
