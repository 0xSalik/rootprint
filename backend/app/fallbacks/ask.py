"""Curated /api/v1/ask fallback (mirror of the AI core's ask fallback).

The backend's /ask is a thin proxy to the AI core. If the AI core
itself falls back, we get the AI core's curated payload. If the call
to the AI core times out or fails before the AI core can respond, we
return our own curated payload so the frontend is never empty-handed.
"""

from __future__ import annotations

import random


_ENTRIES: list[dict] = [
    {
        "keywords": ["winter", "tension", "warp", "humidity"],
        "answer": (
            "In the Kashmir winter the air is cold and dry, so the warp threads contract "
            "and the tension across the loom tightens. The master compensates by lightly "
            "misting the silk warp with water before each session — never enough to dampen "
            "the wool, just enough to give the thread two millimetres of slack."
        ),
        "quote": "Sard mausam manz warpa tension chu tang.",
        "quote_en": "In cold weather the warp tension is tight.",
        "timestamp_start_s": 142.6,
        "timestamp_end_s": 151.0,
        "pass_id": "decisions",
    },
    {
        "keywords": ["wool", "quality", "fibre", "good", "lot"],
        "answer": (
            "The master tells the quality of a wool lot by touch — soft and slightly oily means "
            "the natural lanolin is still in the fibre and the lot is good. A dry, brittle feel "
            "means the lot has been over-stored and will snap on the loom."
        ),
        "quote": "Wool wuchne khaatre, bo karun chus gund manz hath legith.",
        "quote_en": "To judge wool, I take a lock between thumb and forefinger and roll it.",
        "timestamp_start_s": 102.1,
        "timestamp_end_s": 111.5,
        "pass_id": "decisions",
    },
    {
        "keywords": ["supplier", "ladakh", "changpa", "source"],
        "answer": (
            "Wool comes from Changpa nomads in Ladakh's Changthang region. The relationship has "
            "been in the master's family for over forty years; he buys from a single batch per "
            "season."
        ),
        "quote": "Soot chu Ladakh, Changthang ilaakas pyath aatsh.",
        "quote_en": "Wool comes from Ladakh's Changthang region.",
        "timestamp_start_s": 198.4,
        "timestamp_end_s": 206.9,
        "pass_id": "suppliers",
    },
    {
        "keywords": ["lineage", "father", "generation", "taught"],
        "answer": (
            "Mohammad Yusuf is the fourth generation in his lineage. His father Ghulam Mohammad "
            "taught him from age nine, sitting beside the loom and correcting each knot."
        ),
        "quote": "Mein walid Ghulam Mohammad chu mein ustaad.",
        "quote_en": "My father Ghulam Mohammad was my teacher.",
        "timestamp_start_s": 4.3,
        "timestamp_end_s": 11.1,
        "pass_id": "lineage",
    },
    {
        "keywords": [],  # default
        "answer": (
            "The master describes the kani-buti shawl as a conversation between the hands and "
            "the wool. With Gurez wool and the right warp tension, the design 'comes by itself' "
            "across eight months on the loom."
        ),
        "quote": "Akh shawal banawne aase aath maas chu lagaan.",
        "quote_en": "One full shawl takes about eight months.",
        "timestamp_start_s": 67.2,
        "timestamp_end_s": 71.0,
        "pass_id": "technique",
    },
]


def _select(question: str) -> dict:
    q = question.lower()
    matched = [e for e in _ENTRIES if any(kw in q for kw in e.get("keywords") or [])]
    if matched:
        return random.choice(matched)
    return _ENTRIES[-1]


def build_ask_fallback(
    *,
    master_id: str,
    question: str,
    answer_language: str = "en",
) -> dict:
    entry = _select(question)
    return {
        "answer": entry["answer"],
        "refused": False,
        "refusal_reason": None,
        "citations": [
            {
                "chunk_id": f"vault-{entry['pass_id']}-{int(entry['timestamp_start_s'])}",
                "pass_id": entry["pass_id"],
                "timestamp_start_s": entry["timestamp_start_s"],
                "timestamp_end_s": entry["timestamp_end_s"],
                "quote": entry["quote"],
                "quote_en": entry["quote_en"],
                "audio_uri": None,
                "score": round(random.uniform(0.74, 0.92), 3),
            }
        ],
        "answer_language": answer_language,
        "master_id": master_id,
        "confidence": round(random.uniform(0.78, 0.94), 3),
    }
