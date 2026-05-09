import asyncio
from sqlalchemy.ext.asyncio import async_sessionmaker
from app.core.database import engine
from app.models.models import CraftDNA
import random

async def seed():
    async_session = async_sessionmaker(engine, expire_on_commit=False)
    async with async_session() as session:
        # Create a dummy vector
        dummy_vector = [random.uniform(-1, 1) for _ in range(1536)]
        
        dna = CraftDNA(
            technique_name="Pashmina Winter Dyeing",
            translated_transcript="To dye the wool in the harsh Kashmir winter, you must add salt to the indigo vat to prevent freezing.",
            embedding=dummy_vector
        )
        session.add(dna)
        await session.commit()
        print("✅ Added 'Pashmina Winter Dyeing' technique to the database!")

asyncio.run(seed())
