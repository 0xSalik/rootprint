"""Sanad (cryptographic provenance) schemas.

A **Sanad** is the verifiable proof that a specific physical artefact
(shawl, carpet, papier-mâché box) was made in the lineage of a specific
master whose Craft DNA lives in the Vault.

We use Ed25519 signatures with **RFC 8785 JSON Canonicalization** so that
verification is deterministic offline by any phone with libsodium.

Wire format on the QR code (compact, JWS-ish):

    H.B64URL(payload).B64URL(signature)

where ``H`` = base64url-encoded ``SanadHeader``.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

NonEmptyStr = Annotated[str, StringConstraints(min_length=1, strip_whitespace=True)]


class _Base(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class SanadAlg(str, Enum):
    ED25519 = "EdDSA"


class SanadHeader(_Base):
    """The signature envelope header.

    ``alg`` is fixed at EdDSA (Ed25519). ``kid`` identifies the public
    key — we use ``"<master_id>:<key_version>"`` so a master can rotate
    keys and old Sanads keep verifying.
    """

    alg: SanadAlg = SanadAlg.ED25519
    kid: NonEmptyStr = Field(description="Key identifier: '<master_id>:<key_version>'.")
    typ: str = Field(default="hunarmand-sanad+v1")


class CraftLineageRef(_Base):
    """A compact pointer to a lineage chain, included in the Sanad payload."""

    master_id: NonEmptyStr
    master_name: NonEmptyStr
    generation: int | None = Field(default=None, ge=1, le=20)
    village: str | None = None
    lineage_chain: list[NonEmptyStr] = Field(
        default_factory=list,
        description="Names of master's predecessors, oldest first.",
    )


class SanadMetadata(_Base):
    """The signed payload — every field flows into the canonical JSON
    that gets hashed and signed.
    """

    sanad_id: NonEmptyStr
    piece_id: NonEmptyStr
    craft_category: NonEmptyStr
    technique_ids: list[NonEmptyStr] = Field(default_factory=list)
    technique_names: list[NonEmptyStr] = Field(default_factory=list)
    materials_summary: list[NonEmptyStr] = Field(default_factory=list)
    made_at_workshop: str | None = None
    completed_on: datetime
    issued_at: datetime
    lineage: CraftLineageRef
    short_summary: NonEmptyStr = Field(
        max_length=240,
        description="One-sentence buyer-facing description, included so the QR can show it offline.",
    )
    fair_price_band: str | None = Field(
        default=None, description="E.g. 'INR 38000–55000', set by Price Intelligence."
    )
    extras: dict[str, str | int | float | bool] = Field(
        default_factory=dict,
        description="Reserved for forward-compatible additions; canonicalized into the signature.",
    )


class SanadEnvelope(_Base):
    """The full envelope returned by ``/sanad/sign``.

    All three fields are encoded into the QR string. The verifier needs
    only ``payload``, ``signature``, and a way to look up the master's
    public key by ``header.kid`` — which can be cached offline.
    """

    header: SanadHeader
    payload: SanadMetadata
    signature: NonEmptyStr = Field(description="Base64URL-encoded Ed25519 signature.")
    qr_string: NonEmptyStr = Field(description="Compact JWS-style string used as QR payload.")
    qr_image_base64: str | None = Field(
        default=None, description="PNG of the QR code, base64-encoded; optional for clients."
    )
    public_url: str | None = Field(
        default=None, description="Resolves to the public Sanad provenance page."
    )


class SanadVerification(_Base):
    """Output of ``/sanad/verify``."""

    valid: bool
    sanad_id: NonEmptyStr | None = None
    master_id: NonEmptyStr | None = None
    master_name: NonEmptyStr | None = None
    reason: str | None = None
    payload: SanadMetadata | None = None
