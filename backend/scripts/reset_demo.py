"""Reset and seed the demo dataset.

Run once after pointing ``HUNARMAND_DATABASE_URL`` at your Neon project:

    python -m scripts.reset_demo

This wipes any existing demo rows and re-inserts a known-good
"Mohammad Yusuf, Kanihama Pashmina" master with one Workshop and one
Bundle (with a signed Sanad). After it runs:

* ``GET /api/v1/commerce/workshops/<demo-master-id>`` returns one
  workshop (`Heritage Walk` at Rs.\u00a02,500).
* ``POST /api/v1/commerce/checkout`` against the seeded bundle returns
  a real ``order_id``.
* ``GET /api/v1/sanad/<demo-sanad-id>`` returns the master's name +
  metadata.

The IDs are deterministic so the frontend can hard-code them in the
demo flow.
"""

from __future__ import annotations

import asyncio
import json
import sys
import uuid
from datetime import datetime

from sqlalchemy import delete

# Allow the script to be run as ``python scripts/reset_demo.py`` from
# the backend root, not just as ``python -m scripts.reset_demo``.
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import AsyncSessionLocal, engine
from app.models.models import (
    Bundle,
    Master,
    Order,
    Sanad,
    Vault,
    Workshop,
)
from app.services.sanad import crypto


# Deterministic demo UUIDs — frontend hard-codes these.
DEMO_MASTER_ID = uuid.UUID("00000000-0000-4000-8000-000000000001")
DEMO_VAULT_ID = uuid.UUID("00000000-0000-4000-8000-0000000000a1")
DEMO_WORKSHOP_ID = uuid.UUID("00000000-0000-4000-8000-0000000000b1")
DEMO_SANAD_ID = uuid.UUID("00000000-0000-4000-8000-0000000000c1")
DEMO_BUNDLE_ID = uuid.UUID("00000000-0000-4000-8000-0000000000d1")


CRAFT_DNA = {
    "artisan_name": "Mohammad Yusuf",
    "lineage": "4th Generation",
    "village": "Kanihama",
    "craft": "Pashmina",
    "technique": "Kani-buti, Srinagar 1940s knot",
    "materials": "Gurez Valley wool, Banarasi silk warp, natural madder dye",
    "environmental_tuning": "winter humidity → +2 warp tension",
}


async def wipe() -> None:
    async with AsyncSessionLocal() as session:
        # Delete in FK-safe order.
        await session.execute(delete(Order).where(Order.bundle_id == DEMO_BUNDLE_ID))
        await session.execute(delete(Bundle).where(Bundle.id == DEMO_BUNDLE_ID))
        await session.execute(delete(Sanad).where(Sanad.id == DEMO_SANAD_ID))
        await session.execute(delete(Workshop).where(Workshop.id == DEMO_WORKSHOP_ID))
        await session.execute(delete(Vault).where(Vault.id == DEMO_VAULT_ID))
        await session.execute(delete(Master).where(Master.id == DEMO_MASTER_ID))
        await session.commit()


async def seed() -> None:
    priv_key, pub_key = crypto.generate_dummy_keypair()
    signature_hex = crypto.sign_message(priv_key, CRAFT_DNA)

    async with AsyncSessionLocal() as session:
        master = Master(
            id=DEMO_MASTER_ID,
            phone="+919999999999",
            name="Mohammad Yusuf",
            lineage_id="kanihama-yusuf-4g",
            workshop_location="Kanihama, Budgam, J&K",
            bio=(
                "Fourth-generation kani-buti pashmina master. Trained on the loom "
                "from age nine. Sources Gurez Valley wool from the same Changpa "
                "supplier his father used."
            ),
            ed25519_public_key=pub_key,
        )
        session.add(master)

        vault = Vault(
            id=DEMO_VAULT_ID,
            master_id=master.id,
            media_s3_key="vaults/demo/kanihama_yusuf.mp4",
            status="completed",
        )
        session.add(vault)

        workshop = Workshop(
            id=DEMO_WORKSHOP_ID,
            master_id=master.id,
            format="Heritage Walk",
            price=2500.0,
            duration_mins=180,
            description=(
                "Three-hour guided walk through the Kanihama loom-houses, "
                "ending at Mohammad Yusuf's workshop for a kani demonstration."
            ),
            is_active=True,
        )
        session.add(workshop)

        sanad = Sanad(
            id=DEMO_SANAD_ID,
            master_id=master.id,
            craft_dna_id=None,  # demo doesn't depend on a real CraftDNA row
            piece_name="Kani-buti pashmina shawl",
            material_origin="Gurez Valley wool, Banarasi silk warp",
            crypto_signature=signature_hex,
            metadata_json=CRAFT_DNA,
            is_public=True,
        )
        # craft_dna_id is non-null in the model. Skip if your schema
        # enforces it; for the demo we relax this with a dummy CraftDNA.
        # If you've already run alembic, the FK is enforced — comment
        # out the line above and create a CraftDNA row first.
        try:
            session.add(sanad)
            await session.flush()
        except Exception:  # noqa: BLE001
            await session.rollback()
            print(
                "[!] Sanad row needs a craft_dna_id. Run /api/v1/media/process-webhook "
                "with the demo vault first, then re-run this script."
            )

        bundle = Bundle(
            id=DEMO_BUNDLE_ID,
            name="The Kanihama Pashmina Set",
            description="Verified hand-knotted shawl + walnut-wood gift box.",
            price=54000.0,
            sanad_ids=[DEMO_SANAD_ID],
        )
        session.add(bundle)

        await session.commit()

    print(json.dumps(
        {
            "demo_master_id": str(DEMO_MASTER_ID),
            "demo_workshop_id": str(DEMO_WORKSHOP_ID),
            "demo_sanad_id": str(DEMO_SANAD_ID),
            "demo_bundle_id": str(DEMO_BUNDLE_ID),
            "demo_master_phone": "+919999999999",
            "ed25519_public_key_hex": pub_key,
            "demo_signature_hex": signature_hex,
            "craft_dna": CRAFT_DNA,
        },
        indent=2,
    ))


async def main() -> None:
    await wipe()
    await seed()
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
