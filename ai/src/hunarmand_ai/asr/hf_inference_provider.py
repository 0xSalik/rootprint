"""Hugging Face Inference API provider for Whisper.

A free Whisper alternative that doesn't require Groq. The HF Inference
API runs ``openai/whisper-large-v3`` (and other models) on HF's hosted
infrastructure with a generous free tier — and you already have an HF
account from creating the Space, so there's zero new sign-up.

Auth: a single ``HF_API_TOKEN`` (``hf_xxx``) generated at
https://huggingface.co/settings/tokens (read access is enough).

The Inference API does not return word-level timestamps in its default
mode, so we synthesise a single segment per response and let the
chunker downstream split on token budget instead of true timing. For
demo audio this is acceptable; for production you'd swap to a hosted
Inference Endpoint that returns chunked timings.
"""

from __future__ import annotations

from pathlib import Path

import httpx
import structlog

from ..config import get_settings
from ..schemas.asr import AsrProvider, AsrResult, AsrSegment
from .base import ASRProviderError, ASRUnavailableError

log = structlog.get_logger(__name__)


class HFInferenceProvider:
    name = AsrProvider.HF_INFERENCE.value

    def __init__(self) -> None:
        self.settings = get_settings()

    async def is_available(self) -> bool:
        return bool(self.settings.hf_api_token)

    async def transcribe(self, *, audio_path: str, language_hint: str | None) -> AsrResult:
        if not await self.is_available():
            raise ASRUnavailableError("HF_API_TOKEN not set")

        s = self.settings
        url = f"{s.hf_inference_base_url.rstrip('/')}/{s.hf_whisper_model}"
        headers = {
            "Authorization": f"Bearer {s.hf_api_token}",
            "Content-Type": "audio/wav",
        }
        # Whisper's HF Inference handler accepts a JSON `parameters`
        # field via the ``X-Wait-For-Model`` header path; for the simple
        # binary path we just POST raw bytes and the model auto-detects
        # the language. The chunker downstream is language-agnostic.
        data = Path(audio_path).read_bytes()

        async with httpx.AsyncClient(timeout=180.0) as http:
            resp = await http.post(url, content=data, headers=headers)

        if resp.status_code == 503:
            # Cold-start: HF spins the model up on first request.
            raise ASRProviderError(
                "HF Inference: model is warming up — please retry in a few seconds."
            )
        if resp.status_code >= 400:
            raise ASRProviderError(
                f"HF Inference Whisper failed: {resp.status_code} {resp.text[:300]}"
            )
        out = resp.json()
        text = (out.get("text") if isinstance(out, dict) else "") or ""
        text = text.strip()

        # Try to honour returned chunks if the model is configured to
        # produce them; otherwise emit one synthetic segment.
        segments: list[AsrSegment] = []
        chunks = out.get("chunks") if isinstance(out, dict) else None
        if isinstance(chunks, list):
            for c in chunks:
                ts = c.get("timestamp") or [0, 0]
                start = float(ts[0] or 0)
                end = float(ts[1] or start)
                segments.append(
                    AsrSegment(start_s=start, end_s=end, text=(c.get("text") or "").strip())
                )
        if not segments and text:
            segments.append(AsrSegment(start_s=0.0, end_s=float(len(text) / 18.0), text=text))

        duration = max((s.end_s for s in segments), default=0.0)

        return AsrResult(
            provider=AsrProvider.HF_INFERENCE,
            language_detected=(language_hint or s.asr_default_language or "ks").split("-")[0],
            text=text,
            confidence=0.7 if text else 0.0,
            segments=segments,
            duration_s=duration,
            notes=f"HF Inference {s.hf_whisper_model} (free tier)",
        )
