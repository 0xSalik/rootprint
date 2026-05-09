"""AI4Bharat IndicWhisper / IndicConformer provider.

Both AI4Bharat models support ``ks`` (Kashmiri) natively. They are
typically deployed behind:

* a HuggingFace Inference Endpoint (custom handler returning JSON)
* a self-hosted FastAPI/vLLM shim
* a CTranslate2 / faster-whisper wrapper

We require a wrapper that accepts a multipart audio upload and returns
JSON of the shape::

    {
      "text": "…",
      "language": "ks",
      "segments": [{"start": 0.0, "end": 4.2, "text": "…"}, …],
      "confidence": 0.74
    }

If any contract drift happens we degrade by re-using whatever fields we
can find.
"""

from __future__ import annotations

from pathlib import Path

import httpx
import structlog

from ..config import get_settings
from ..schemas.asr import AsrProvider, AsrResult, AsrSegment
from .base import ASRProviderError, ASRUnavailableError

log = structlog.get_logger(__name__)


class AI4BharatProvider:
    name = AsrProvider.AI4BHARAT.value

    def __init__(self) -> None:
        self.settings = get_settings()

    async def is_available(self) -> bool:
        return bool(self.settings.ai4bharat_inference_url)

    async def transcribe(self, *, audio_path: str, language_hint: str | None) -> AsrResult:
        if not await self.is_available():
            raise ASRUnavailableError("AI4BHARAT_INFERENCE_URL not configured")

        s = self.settings
        language = (language_hint or s.asr_default_language or "ks").split("-")[0]
        headers = {}
        if s.ai4bharat_api_key:
            headers["Authorization"] = f"Bearer {s.ai4bharat_api_key}"

        files = {"audio": (Path(audio_path).name, Path(audio_path).read_bytes(), "audio/wav")}
        data = {"language": language, "model": s.ai4bharat_model}

        async with httpx.AsyncClient(timeout=120.0) as http:
            resp = await http.post(
                s.ai4bharat_inference_url, files=files, data=data, headers=headers
            )

        if resp.status_code >= 400:
            raise ASRProviderError(
                f"AI4Bharat ASR failed: {resp.status_code} {resp.text[:300]}"
            )
        out = resp.json()
        text = (out.get("text") or "").strip()
        segments_raw = out.get("segments") or []
        segments = [
            AsrSegment(
                start_s=float(s.get("start", 0.0) or 0.0),
                end_s=float(s.get("end", 0.0) or 0.0),
                text=(s.get("text") or "").strip(),
            )
            for s in segments_raw
        ]
        confidence = float(out.get("confidence", 0.7))
        confidence = max(0.0, min(1.0, confidence))
        duration = max((seg.end_s for seg in segments), default=0.0)

        return AsrResult(
            provider=AsrProvider.AI4BHARAT,
            language_detected=out.get("language", language),
            text=text,
            confidence=confidence,
            segments=segments,
            duration_s=duration,
            notes=f"AI4Bharat {s.ai4bharat_model}",
        )
