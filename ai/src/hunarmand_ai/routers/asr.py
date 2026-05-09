"""ASR endpoints."""

from __future__ import annotations

import tempfile
from pathlib import Path

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from ..asr import get_asr_pipeline
from ..fallbacks import build_asr_fallback, run_with_fallback
from ..schemas.asr import AsrProvider, AsrResult

router = APIRouter(prefix="/asr", tags=["asr"])


@router.post("/transcribe", response_model=AsrResult)
async def transcribe(
    audio: UploadFile = File(..., description="Audio file (wav/m4a/mp3)."),
    language_hint: str | None = Form(default=None),
    translate_to_english: bool = Form(default=True),
    prefer_provider: AsrProvider | None = Form(default=None),
) -> AsrResult:
    if not audio.filename:
        raise HTTPException(400, "audio file required")
    suffix = Path(audio.filename).suffix or ".wav"
    pipeline = get_asr_pipeline()

    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as fh:
        fh.write(await audio.read())
        tmp_path = fh.name

    try:
        return await run_with_fallback(
            coro=pipeline.transcribe_audio(
                audio_path=tmp_path,
                language_hint=language_hint,
                translate_to_english=translate_to_english,
                prefer_provider=prefer_provider,
            ),
            fallback=lambda: build_asr_fallback(language_hint=language_hint),
            policy="asr",
        )
    finally:
        Path(tmp_path).unlink(missing_ok=True)


@router.post("/transcribe-manual", response_model=AsrResult)
async def transcribe_manual(
    manual_text: str = Form(...),
    language_hint: str | None = Form(default=None),
    translate_to_english: bool = Form(default=True),
    duration_s: float | None = Form(default=None),
) -> AsrResult:
    pipeline = get_asr_pipeline()
    return await pipeline.transcribe_manual(
        manual_text=manual_text,
        language_hint=language_hint,
        translate_to_english=translate_to_english,
        duration_s=duration_s,
    )
