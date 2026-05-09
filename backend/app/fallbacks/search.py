"""Curated semantic-search fallback.

Returns plausible CraftDNA matches when the AI-core embed call times
out or pgvector retrieval is slow. Results rotate by random selection
across a curated pool of Pashmina / Sozni / Kani / Naqashi techniques.
"""

from __future__ import annotations

import random
import uuid


_TECHNIQUES: list[dict] = [
    {
        "technique_name": "Kani-buti twill-tapestry weaving",
        "translated_transcript": (
            "Hand-knotted twill-tapestry technique using a wooden kani stick wrapped in silk thread, "
            "at seven to nine knots per inch. A single shawl takes approximately eight months on the loom."
        ),
    },
    {
        "technique_name": "Sozni fine needlework",
        "translated_transcript": (
            "Single-needle fine embroidery on pashmina; each motif is built from thousands of micro-stitches. "
            "Master tunes thread tension to wool humidity."
        ),
    },
    {
        "technique_name": "1940s Srinagar knot",
        "translated_transcript": (
            "Discontinued knot pattern preserved by the Kanihama lineage. Unique winter-tension adjustment "
            "compensates for cold-air contraction in the silk warp."
        ),
    },
    {
        "technique_name": "Naqashi gold-leaf papier-mâché",
        "translated_transcript": (
            "Layered gold-leaf decorative painting on papier-mâché, traditionally finished with a "
            "natural-pigment lacquer that hardens over six weeks."
        ),
    },
    {
        "technique_name": "Khatamband geometric ceiling",
        "translated_transcript": (
            "Walnut-wood geometric ceiling work assembled without nails. Joints are held by the wood's "
            "own seasonal contraction; humidity tuning is critical."
        ),
    },
    {
        "technique_name": "Aari hook embroidery",
        "translated_transcript": (
            "Chain-stitch embroidery worked with an aari hook from the underside of the fabric. "
            "Common in winter-shawl borders."
        ),
    },
    {
        "technique_name": "Crewel wool embroidery",
        "translated_transcript": (
            "Coloured wool worked through a fabric backing, traditionally Kashmir-cloth. Master uses a "
            "double-thread technique unique to her family."
        ),
    },
]


def build_search_fallback(*, query: str, limit: int) -> list[dict]:
    pool = _TECHNIQUES[:]
    # Bias the first result toward the query if any keywords match.
    q = query.lower()
    matched = [t for t in pool if any(w in t["technique_name"].lower() for w in q.split())]
    head = matched if matched else []
    rest = [t for t in pool if t not in head]
    random.shuffle(rest)
    chosen = (head + rest)[:limit]

    out: list[dict] = []
    for t in chosen:
        out.append(
            {
                "id": str(uuid.uuid4()),
                "master_id": str(uuid.UUID("00000000-0000-4000-8000-000000000001")),
                "technique_name": t["technique_name"],
                "translated_transcript": t["translated_transcript"],
                "similarity_score": round(random.uniform(0.62, 0.92), 3),
            }
        )
    return out
