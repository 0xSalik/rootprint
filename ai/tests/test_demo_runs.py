"""Smoke test the offline demo path runs without LLM/DB."""

from __future__ import annotations

import asyncio
import os
from pathlib import Path

from hunarmand_ai.demo import run_demo


def test_offline_demo_runs(tmp_path: Path, monkeypatch) -> None:
    fixture = Path(__file__).resolve().parents[1] / "fixtures" / "demo_session.json"
    monkeypatch.chdir(tmp_path)
    asyncio.run(run_demo(fixture_path=str(fixture), use_llm=False))
    out = tmp_path / "out"
    assert out.exists(), "demo should write its artefacts to ./out"
    assert (out / "craft_dna_offline.json").exists()
    pngs = list(out.glob("sanad_*.png"))
    assert pngs, "demo should write at least one Sanad QR PNG"
