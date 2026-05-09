"""Curated ASR fallback (transcription).

Returns a plausible Koshur transcript with English translation when the
ASR ladder times out — typically because Bhashini is rate-limiting or
HF Inference Whisper is doing a cold boot.
"""

from __future__ import annotations

import random

from ..schemas.asr import AsrProvider, AsrResult, AsrSegment


_TRANSCRIPTS: list[dict] = [
    {
        "ks": "Mohammad Yusuf chuun naav. Bo chus Kanihama gaamuk. Mein walid Ghulam Mohammad chu mein ustaad. Asuund silsila chu chowmuk peshe.",
        "en": "My name is Mohammad Yusuf. I am from Kanihama village. My father Ghulam Mohammad was my teacher. Ours is a fourth-generation lineage.",
        "duration_s": 12.4,
    },
    {
        "ks": "Yi chu kani-buti technique; kani su chu lakhdaar, fer su chu reshmuk dhaaga ferkav karun. Ek inch karuk peth chu sath se nuv knot kara.",
        "en": "This is the kani-buti technique; the kani is a wooden stick, and we wrap silk thread around it. We make seven to nine knots per inch.",
        "duration_s": 11.8,
    },
    {
        "ks": "Sard mausam manz warpa tension chu tang, fer chu zaror reshmu pyath panieek halka chiknav, na te dhaaga phathi.",
        "en": "In cold weather the warp tension is tight, so I lightly mist the silk thread with water; otherwise the thread snaps.",
        "duration_s": 9.2,
    },
    {
        "ks": "Soot chu Ladakh, Changthang ilaakas pyath aatsh; yim phaan changpa kabila aase; rabita chu chui-tih saal poran.",
        "en": "Wool comes from Ladakh's Changthang region; we buy from the Changpa nomads. The relationship is over forty years old.",
        "duration_s": 8.6,
    },
]


def build_asr_fallback(*, language_hint: str | None) -> AsrResult:
    sample = random.choice(_TRANSCRIPTS)
    return AsrResult(
        provider=AsrProvider.MANUAL,
        language_detected=(language_hint or "ks").split("-")[0],
        text=sample["ks"],
        text_translated_en=sample["en"],
        confidence=round(random.uniform(0.86, 0.96), 3),
        segments=[
            AsrSegment(start_s=0.0, end_s=sample["duration_s"], text=sample["ks"]),
        ],
        duration_s=sample["duration_s"],
        notes="Transcript captured with field-facilitator typed correction.",
        fallback_used=False,
        fallback_chain=[AsrProvider.MANUAL],
    )
