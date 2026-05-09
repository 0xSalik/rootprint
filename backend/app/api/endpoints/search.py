from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from pydantic import BaseModel
import uuid

from app.core.database import get_db
from app.models.models import CraftDNA

router = APIRouter()

class SearchResult(BaseModel):
    id: uuid.UUID
    master_id: uuid.UUID
    technique_name: str
    translated_transcript: str
    similarity_score: float

    class Config:
        from_attributes = True

# --- MOCK EMBEDDING FUNCTION ---
# In a real scenario, this uses the OpenAI API
# import openai
# from app.core.config import settings
# openai.api_key = settings.OPENAI_API_KEY
# 
# async def generate_embedding(text: str) -> List[float]:
#     response = await openai.Embedding.acreate(
#         input=text, model="text-embedding-3-small"
#     )
#     return response["data"][0]["embedding"]
# -------------------------------

async def generate_mock_embedding(text: str) -> List[float]:
    """Generates a dummy 1536-dimensional vector for testing."""
    import random
    # Just returning a randomized vector of length 1536
    return [random.uniform(-1, 1) for _ in range(1536)]


@router.get("/techniques", response_model=List[SearchResult])
async def search_techniques(
    query: str,
    limit: int = 5,
    db: AsyncSession = Depends(get_db)
):
    """
    Semantic Search using pgvector.
    Converts the text query into an embedding and queries the CraftDNA table 
    using L2 distance (<-> operator) to find the closest matches.
    """
    if not query:
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    # Generate the vector embedding for the search query
    query_vector = await generate_mock_embedding(query)

    # Perform a similarity search on pgvector
    # Order by L2 distance (CraftDNA.embedding <-> query_vector)
    stmt = (
        select(
            CraftDNA, 
            CraftDNA.embedding.l2_distance(query_vector).label("distance")
        )
        .order_by(CraftDNA.embedding.l2_distance(query_vector))
        .limit(limit)
    )

    result = await db.execute(stmt)
    rows = result.all()

    # Format the results
    search_results = []
    for craft_dna, distance in rows:
        # Distance is smaller for closer matches. We can optionally convert it to a similarity score.
        search_results.append({
            "id": craft_dna.id,
            "master_id": craft_dna.master_id,
            "technique_name": craft_dna.technique_name or "Unknown Technique",
            "translated_transcript": craft_dna.translated_transcript or "",
            "similarity_score": 1.0 - (distance / 2.0) # Naive conversion for L2 distance (0 to 2)
        })

    return search_results
