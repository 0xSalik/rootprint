"""RFC 8785 canonicalisation guarantees."""

from __future__ import annotations

import json
from datetime import datetime, timezone

from hunarmand_ai.sanad.canonicalizer import canonicalize, sha256_b64url
from hunarmand_ai.schemas.sanad import CraftLineageRef, SanadMetadata


def _payload() -> SanadMetadata:
    return SanadMetadata(
        sanad_id="KNH-PSH-2025-0042",
        piece_id="shawl-2025-0042",
        craft_category="pashmina_weaving",
        technique_ids=["tech-kani-buti"],
        technique_names=["Kani-buti twill-tapestry"],
        materials_summary=["Changthangi pashmina wool"],
        made_at_workshop="Kanihama",
        completed_on=datetime(2025, 4, 12, tzinfo=timezone.utc),
        issued_at=datetime(2025, 4, 13, tzinfo=timezone.utc),
        lineage=CraftLineageRef(
            master_id="m-1",
            master_name="Mohammad Yusuf",
            generation=4,
            village="Kanihama",
            lineage_chain=["Habibullah", "Ghulam Mohammad"],
        ),
        short_summary="Kani-buti pashmina shawl",
    )


def test_canonical_is_deterministic() -> None:
    p = _payload()
    a = canonicalize(p)
    b = canonicalize(p)
    assert a == b
    parsed = json.loads(a.decode("utf-8"))
    assert parsed["sanad_id"] == "KNH-PSH-2025-0042"


def test_canonical_orders_keys() -> None:
    """Mutating the input dict order must not change the canonical bytes."""

    p = _payload()
    base = canonicalize(p)
    # Re-serialise via dict and back to ensure key order doesn't matter.
    as_dict = json.loads(p.model_dump_json())
    shuffled = dict(reversed(list(as_dict.items())))
    again = canonicalize(shuffled)
    # The "again" call goes through canonicalize with a plain dict; both
    # must produce identical bytes.
    assert base == again


def test_sha256_b64url_is_unpadded() -> None:
    digest = sha256_b64url(b"hunarmand")
    assert "=" not in digest
    assert digest.replace("-", "").replace("_", "").isalnum()


def test_canonical_round_trips_unicode() -> None:
    """Canonicalisation must preserve non-ASCII (Koshur) characters."""

    p = _payload()
    p.short_summary = "Kani-buti pashmina shaal — کنی"
    canonical = canonicalize(p)
    parsed = json.loads(canonical.decode("utf-8"))
    assert "کنی" in parsed["short_summary"]
