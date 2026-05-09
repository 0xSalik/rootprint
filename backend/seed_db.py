import asyncio
from sqlalchemy.ext.asyncio import async_sessionmaker
from app.core.database import engine
from app.models.models import CraftDNA
import random

async def seed():
    async_session = async_sessionmaker(engine, expire_on_commit=False)
    async with async_session() as session:
        # Get any existing master from the database
        from sqlalchemy.future import select
        from app.models.models import Master, Vault
        result = await session.execute(select(Master))
        master = result.scalars().first()
        
        if not master:
            print("❌ No Master found! Please login via /verify-otp first.")
            return

        # Create a dummy Vault first (since CraftDNA requires a vault_id)
        vault = Vault(
            master_id=master.id,
            media_s3_key="vaults/dummy/video.mp4",
            status="processed"
        )
        session.add(vault)
        await session.flush() # Flushes to get the vault.id

        # Create a dummy vector
        dummy_vector = [random.uniform(-1, 1) for _ in range(1536)]
        
        dna = CraftDNA(
            master_id=master.id,
            vault_id=vault.id, # Fixed: Now passing the required vault_id
            technique_name="Pashmina Winter Dyeing",
            translated_transcript="To dye the wool in the harsh Kashmir winter, you must add salt to the indigo vat to prevent freezing.",
            embedding=dummy_vector
        )
        session.add(dna)
        await session.commit()
        print("✅ Added 'Pashmina Winter Dyeing' technique to the database!")

asyncio.run(seed())
