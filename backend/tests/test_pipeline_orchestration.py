"""End-to-end pipeline orchestration — drives ``process_vault`` against
a mocked AI core (respx) and a mocked S3 fixture. We bypass the real
DB layer by patching ``_persist_craft_dna`` so the test is independent
of Postgres.
"""

from __future__ import annotations

import pathlib

import pytest
import respx
from httpx import Response

from app.worker import pipeline as pipeline_mod


@pytest.mark.asyncio
@respx.mock
async def test_pipeline_drives_ai_core_and_persists(monkeypatch, tmp_path: pathlib.Path) -> None:
    # ── Fixture: a fake "audio" file we'll pretend was at S3 ────────────
    fixture_dir = tmp_path / "vault-fixtures"
    fixture_dir.mkdir()
    fake = fixture_dir / "abc.wav"
    fake.write_bytes(b"RIFFfakefakefake")
    monkeypatch.setattr(pipeline_mod.os.path, "exists", lambda p: True)
    monkeypatch.setattr(
        pipeline_mod, "_download_from_s3", lambda key: str(fake)
    )

    # ── Mock the AI core endpoints ──────────────────────────────────────
    base = "http://ai-core.test"
    monkeypatch.setenv("AI_CORE_URL", base)
    # Force the singleton to pick the new URL
    from app.clients import ai_core as ac_mod

    ac_mod._singleton = None  # type: ignore[attr-defined]

    respx.post(f"{base}/asr/transcribe").mock(
        return_value=Response(
            200,
            json={
                "provider": "groq",
                "language_detected": "ks",
                "text": "kani-buti chu hath sund",
                "text_translated_en": "kani-buti is by hand",
                "confidence": 0.91,
                "segments": [
                    {"start_s": 0.0, "end_s": 2.5, "text": "kani-buti chu hath sund"},
                ],
                "duration_s": 2.5,
                "fallback_used": False,
                "fallback_chain": ["groq"],
            },
        )
    )

    respx.post(f"{base}/extract").mock(
        return_value=Response(
            200,
            json={
                "craft_dna": {
                    "schema_version": "1.0.0",
                    "master_id": "m-1",
                    "captured_at": "2026-01-01T00:00:00Z",
                    "primary_language": "ks",
                    "available_languages": ["ks", "ur", "en"],
                    "identity": {
                        "full_name": "Mohammad Yusuf",
                        "craft_category": "pashmina_weaving",
                    },
                    "lineage": [],
                    "techniques": [
                        {
                            "id": "t-1",
                            "name_local": "kani-buti",
                            "name_english": "kani-buti weaving",
                            "summary": "twill-tapestry weaving with kani sticks",
                            "rarity": "medium",
                            "steps": [],
                            "failure_modes": [],
                            "citations": [],
                        }
                    ],
                    "tools": [],
                    "materials": [],
                    "suppliers": [],
                    "environmental_tunings": [],
                    "decision_rules": [],
                    "failure_logs": [],
                },
                "vulnerability_index": 0.4,
            },
        )
    )

    respx.post(f"{base}/embed").mock(
        return_value=Response(
            200,
            json={
                "provider": "local",
                "model": "intfloat/multilingual-e5-small",
                "dimensions": 384,
                "embeddings": [[0.1] * 384],
            },
        )
    )

    # ── Stub the DB write so we don't need Postgres ────────────────────
    persisted: dict = {}

    async def fake_persist(**kwargs):
        persisted.update(kwargs)

    monkeypatch.setattr(pipeline_mod, "_persist_craft_dna", fake_persist)

    out = await pipeline_mod.process_vault(
        vault_id="00000000-0000-4000-8000-000000000001",
        s3_key="vaults/test/abc.wav",
    )

    assert out["status"] == "completed"
    assert out["asr_provider"] == "groq"
    assert persisted["technique_name"] == "kani-buti weaving"
    assert persisted["transcript"].startswith("kani-buti")
    assert persisted["translated_transcript"].startswith("kani-buti")
    assert persisted["technique_graph"]["techniques"][0]["id"] == "t-1"
    assert len(persisted["embedding"]) == 384
