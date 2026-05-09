"""Bhashini ULCA provider.

Bhashini (https://bhashini.gov.in/) is the Government of India's national
language platform. It is currently the highest-quality first-party ASR
for Kashmiri (`ks`). Authentication is two-stage:

    1. Call the model-selection endpoint with ``BHASHINI_USER_ID`` and
       ``BHASHINI_API_KEY`` (the "ULCA API key") to receive a per-task
       inference URL plus a short-lived service auth token.
    2. POST the audio (base64) to that inference URL.

We cache the resolved pipeline configuration in-process for the lifetime
of the worker because the selection endpoint is rate-limited.

If any required configuration is missing we raise ``ASRUnavailableError``
so the pipeline cleanly skips us.
"""

from __future__ import annotations

import base64
import json
from pathlib import Path
from typing import Any

import httpx
import structlog

from ..config import get_settings
from ..schemas.asr import AsrProvider, AsrResult, AsrSegment
from .base import ASRProviderError, ASRUnavailableError

log = structlog.get_logger(__name__)


class BhashiniProvider:
    name = AsrProvider.BHASHINI.value

    def __init__(self) -> None:
        self.settings = get_settings()
        self._pipeline_cache: dict[str, tuple[str, dict[str, str]]] = {}

    async def is_available(self) -> bool:
        s = self.settings
        return bool(s.bhashini_api_key and s.bhashini_user_id)

    async def transcribe(self, *, audio_path: str, language_hint: str | None) -> AsrResult:
        if not await self.is_available():
            raise ASRUnavailableError("Bhashini credentials not configured")

        language = (language_hint or self.settings.asr_default_language or "ks").split("-")[0]

        async with httpx.AsyncClient(timeout=60.0) as http:
            inference_url, auth_headers = await self._resolve_pipeline(http, language)
            audio_b64 = base64.b64encode(Path(audio_path).read_bytes()).decode("ascii")

            payload = {
                "pipelineTasks": [
                    {
                        "taskType": "asr",
                        "config": {"language": {"sourceLanguage": language}},
                    }
                ],
                "inputData": {"audio": [{"audioContent": audio_b64}]},
            }
            resp = await http.post(inference_url, json=payload, headers=auth_headers)
            if resp.status_code >= 400:
                raise ASRProviderError(f"Bhashini ASR failed: {resp.status_code} {resp.text[:300]}")
            data = resp.json()

        return _normalise(data, language=language)

    async def _resolve_pipeline(
        self, http: httpx.AsyncClient, source_language: str
    ) -> tuple[str, dict[str, str]]:
        cache_key = source_language
        if cache_key in self._pipeline_cache:
            return self._pipeline_cache[cache_key]

        s = self.settings
        body: dict[str, Any] = {
            "pipelineTasks": [
                {
                    "taskType": "asr",
                    "config": {"language": {"sourceLanguage": source_language}},
                }
            ],
            "pipelineRequestConfig": {"pipelineId": s.bhashini_pipeline_id or ""},
        }
        headers = {
            "userID": s.bhashini_user_id or "",
            "ulcaApiKey": s.bhashini_api_key or "",
            "Content-Type": "application/json",
        }
        resp = await http.post(s.bhashini_inference_url, json=body, headers=headers)
        if resp.status_code >= 400:
            raise ASRProviderError(
                f"Bhashini pipeline lookup failed: {resp.status_code} {resp.text[:300]}"
            )
        cfg = resp.json()
        try:
            pipeline_response = cfg["pipelineResponseConfig"][0]["config"][0]
            inference = cfg["pipelineInferenceAPIEndPoint"]
            inference_url = inference["callbackUrl"]
            auth_key = inference["inferenceApiKey"]["name"]
            auth_value = inference["inferenceApiKey"]["value"]
        except (KeyError, IndexError, TypeError) as exc:
            raise ASRProviderError(
                f"Unexpected Bhashini pipeline response: {json.dumps(cfg)[:300]}"
            ) from exc

        log.info(
            "bhashini.pipeline.resolved",
            language=source_language,
            service_id=pipeline_response.get("serviceId"),
        )
        auth_headers = {auth_key: auth_value, "Content-Type": "application/json"}
        self._pipeline_cache[cache_key] = (inference_url, auth_headers)
        return inference_url, auth_headers


def _normalise(data: dict, *, language: str) -> AsrResult:
    asr_outputs = []
    for task in data.get("pipelineResponse", []):
        if task.get("taskType") == "asr":
            asr_outputs = task.get("output", [])
            break

    text_parts: list[str] = []
    segments: list[AsrSegment] = []
    cursor = 0.0
    for o in asr_outputs:
        text = (o.get("source") or "").strip()
        if not text:
            continue
        text_parts.append(text)
        # Bhashini does not always return word timings; emit a single
        # synthetic segment per output so the chunker can still anchor
        # citations.
        segments.append(AsrSegment(start_s=cursor, end_s=cursor + 1.0, text=text))
        cursor += max(1.0, len(text) / 18)

    text = " ".join(text_parts).strip()
    confidence = 0.7 if text else 0.0
    return AsrResult(
        provider=AsrProvider.BHASHINI,
        language_detected=language,
        text=text,
        confidence=confidence,
        segments=segments,
        duration_s=cursor,
        notes="Bhashini ULCA",
    )
