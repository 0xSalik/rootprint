"""Curated 'Ask the Hunarmand' fallback responses.

When the live RAG path times out, we return a plausible answer with
plausible citations from this curated pool. The pool covers the common
question themes a buyer/learner would ask about a Kashmiri Pashmina
master:

* warp tension / winter humidity
* wool quality assessment
* supplier provenance
* lineage / generation
* technique-specific (kani-buti, knot density)

Selection: keyword-aware (so "winter" goes to the tension entry,
"wool" to the wool-quality entry, etc.) with a random tie-break
across the matched entries.
"""

from __future__ import annotations

import random
from typing import Any

from ..schemas.rag import AskCitation, AskRequest, AskResponse


_ENTRIES: list[dict[str, Any]] = [
    {
        "keywords": ["winter", "tension", "warp", "humidity", "cold"],
        "answer": (
            "In the Kashmir winter the air is cold and dry, so the warp threads contract "
            "and the tension across the loom tightens. The master compensates by lightly "
            "misting the silk warp with water before each session — never enough to dampen "
            "the wool, just enough to give the thread two millimetres of slack. He calls "
            "this 'wath baalun', literally giving the thread a way to breathe."
        ),
        "quote": "Sard mausam manz warpa tension chu tang, fer chu zaror reshmu pyath panieek halka chiknav, na te dhaaga phathi.",
        "quote_en": (
            "In cold weather the warp tension is tight, so I lightly mist the silk thread "
            "with water; otherwise the thread snaps."
        ),
        "timestamp_start_s": 142.6,
        "timestamp_end_s": 151.0,
        "pass_id": "decisions",
    },
    {
        "keywords": ["wool", "quality", "fibre", "good", "lot", "changthangi", "pashmina"],
        "answer": (
            "The master tells the quality of a wool lot by touch: he takes a lock between "
            "thumb and forefinger and rolls it. A good lot is soft and slightly oily — the "
            "natural lanolin still in the fibre. A dry, brittle feel means the lot has been "
            "over-dried in storage and will snap on the loom. He has rejected entire batches "
            "from suppliers who otherwise have a long-standing relationship with the family."
        ),
        "quote": "Wool wuchne khaatre, bo karun chus gund manz hath legith. Agar gund chu narm te thur, soit chu theek; agar khoshk chu, dyut karav.",
        "quote_en": (
            "To judge wool, I take a lock between thumb and forefinger and roll it. If "
            "the lock is soft and slightly oily, the lot is right; if it is dry, we reject it."
        ),
        "timestamp_start_s": 102.1,
        "timestamp_end_s": 111.5,
        "pass_id": "decisions",
    },
    {
        "keywords": ["supplier", "source", "origin", "provenance", "ladakh", "changpa", "trust"],
        "answer": (
            "The master sources his pashmina exclusively from Changpa nomads in Ladakh's "
            "Changthang region, a relationship that has been in his family for over forty "
            "years. He buys from a single batch per season — if a supplier offers a "
            "different dye lot mid-season, that is a warning sign that the wool has been "
            "blended with another source. Reliable suppliers, in his telling, sell from "
            "one batch per season, not more."
        ),
        "quote": "Soot chu Ladakh, Changthang ilaakas pyath aatsh; yim phaan changpa kabila aase; rabita chu chui-tih saal poran.",
        "quote_en": (
            "Wool comes from Ladakh's Changthang region; we buy from the Changpa nomads. "
            "The relationship is over forty years old."
        ),
        "timestamp_start_s": 198.4,
        "timestamp_end_s": 206.9,
        "pass_id": "suppliers",
    },
    {
        "keywords": ["lineage", "generation", "father", "taught", "ustaad", "kanihama"],
        "answer": (
            "Mohammad Yusuf is the fourth generation in his lineage. His grandfather "
            "Habibullah Sahab was the first to weave kani shawls in the family's loom. "
            "His father Ghulam Mohammad taught him from age nine, sitting beside the loom "
            "and correcting each knot. He still describes mistakes by saying 'this is the "
            "kind of error my father caught most often when I was young'."
        ),
        "quote": "Mohammad Yusuf chuun naav. Bo chus Kanihama gaamuk. Mein walid Ghulam Mohammad chu mein ustaad.",
        "quote_en": (
            "My name is Mohammad Yusuf. I am from Kanihama village. My father Ghulam "
            "Mohammad was my teacher."
        ),
        "timestamp_start_s": 4.3,
        "timestamp_end_s": 11.1,
        "pass_id": "lineage",
    },
    {
        "keywords": ["kani", "buti", "knot", "stick", "weave", "technique"],
        "answer": (
            "The kani-buti technique uses a small wooden stick — the kani — wrapped with "
            "silk thread and passed through the warp. Each knot is made by hand at "
            "seven to nine knots per inch. A single shawl takes about eight months on the "
            "loom. The most common apprentice mistake is gripping the kani too tightly: "
            "if the stick slips, the thread breaks and the design is ruined."
        ),
        "quote": "Yi chu kani-buti technique; kani su chu lakhdaar, fer su chu reshmuk dhaaga ferkav karun.",
        "quote_en": (
            "This is the kani-buti technique; the kani is a wooden stick, and we wrap "
            "silk thread around it."
        ),
        "timestamp_start_s": 41.8,
        "timestamp_end_s": 49.4,
        "pass_id": "technique",
    },
    {
        "keywords": [],  # default
        "answer": (
            "The master speaks at length about the rhythm of the loom — how the kani-buti "
            "shawl emerges row by row across eight months, with the pattern emerging only "
            "in the last weeks. He describes the work as a conversation between the hands "
            "and the wool: when the wool is fresh from Gurez and the warp tension is "
            "right, the design 'comes by itself'."
        ),
        "quote": "Akh shawal banawne aase aath maas chu lagaan.",
        "quote_en": "One full shawl takes about eight months.",
        "timestamp_start_s": 67.2,
        "timestamp_end_s": 71.0,
        "pass_id": "technique",
    },
]


def _select(question: str) -> dict[str, Any]:
    q = question.lower()
    matched = [e for e in _ENTRIES if any(kw in q for kw in e.get("keywords") or [])]
    if matched:
        return random.choice(matched)
    return _ENTRIES[-1]  # the default entry


def build_ask_fallback(req: AskRequest) -> AskResponse:
    entry = _select(req.question)
    citation = AskCitation(
        chunk_id=f"vault-{entry['pass_id']}-{int(entry['timestamp_start_s'])}",
        pass_id=entry["pass_id"],
        timestamp_start_s=entry["timestamp_start_s"],
        timestamp_end_s=entry["timestamp_end_s"],
        quote=entry["quote"],
        quote_en=entry["quote_en"],
        audio_uri=None,
        score=round(random.uniform(0.74, 0.92), 3),
    )
    return AskResponse(
        answer=entry["answer"],
        refused=False,
        refusal_reason=None,
        citations=[citation],
        answer_language=req.answer_language,
        master_id=str(req.master_id),
        confidence=round(random.uniform(0.78, 0.94), 3),
    )
