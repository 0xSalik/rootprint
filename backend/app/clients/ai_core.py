"""HTTP client for the Hunarmand AI core service.

The AI core is a separate FastAPI service (typically deployed on
Hugging Face Spaces) responsible for:

* ASR (``/asr/transcribe``, ``/asr/transcribe-manual``)
* Craft DNA extraction (``/extract``)
* RAG / "Ask the Hunarmand" (``/ask``)
* Cryptographic Sanad (``/sanad/keys``, ``/sanad/sign``, ``/sanad/verify``)
* (Internal) embedding endpoint via the same routes — we call ``/asr``
  and ``/extract`` and let the AI core handle embeddings on its side
  for ingestion. For ad-hoc query-time embeddings (e.g. semantic search
  over CraftDNA rows), we expose a thin shim through the AI core.

Design notes
------------

* The client is async (httpx.AsyncClient) and shares a single session.
* Retries with exponential backoff on transient failures.
* If ``AI_CORE_TOKEN`` is set, it's forwarded as ``Authorization: Bearer``.
* All public methods accept and return plain dicts so we don't take a
  hard dependency on the AI core's pydantic schemas — that lets us
  iterate the two services independently.
"""

from __future__ import annotations

from typing import Any, Optional
from pathlib import Path
import logging

import httpx
from tenacity import (
    AsyncRetrying,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential_jitter,
)

from app.core.config import settings

log = logging.getLogger(__name__)


class AICoreError(RuntimeError):
    """Raised when the AI core returns an error or is unreachable."""


def _retrying() -> AsyncRetrying:
    return AsyncRetrying(
        stop=stop_after_attempt(3),
        wait=wait_exponential_jitter(initial=0.6, max=4.0),
        retry=retry_if_exception_type((httpx.TransportError, httpx.RemoteProtocolError)),
        reraise=True,
    )


class AICoreClient:
    """Thin async client over the AI core HTTP API."""

    def __init__(
        self,
        base_url: Optional[str] = None,
        token: Optional[str] = None,
        timeout: float = 120.0,
    ) -> None:
        self.base_url = (base_url or settings.AI_CORE_URL).rstrip("/")
        self.token = token or settings.AI_CORE_TOKEN
        self._timeout = timeout

    # ── Internal ────────────────────────────────────────────────────────
    def _headers(self, extra: Optional[dict[str, str]] = None) -> dict[str, str]:
        h: dict[str, str] = {"Accept": "application/json"}
        if self.token:
            h["Authorization"] = f"Bearer {self.token}"
        if extra:
            h.update(extra)
        return h

    async def _request(
        self,
        method: str,
        path: str,
        *,
        json: Optional[dict] = None,
        data: Optional[dict] = None,
        files: Optional[dict] = None,
    ) -> Any:
        url = f"{self.base_url}{path}"
        async for attempt in _retrying():
            with attempt:
                async with httpx.AsyncClient(timeout=self._timeout) as http:
                    resp = await http.request(
                        method,
                        url,
                        json=json,
                        data=data,
                        files=files,
                        headers=self._headers(),
                    )
                if resp.status_code >= 400:
                    raise AICoreError(
                        f"AI core {method} {path} -> {resp.status_code}: "
                        f"{resp.text[:400]}"
                    )
                if not resp.content:
                    return {}
                return resp.json()
        raise AICoreError("AI core: retries exhausted")

    # ── Health ──────────────────────────────────────────────────────────
    async def healthz(self) -> dict:
        return await self._request("GET", "/healthz")

    # ── Embeddings ─────────────────────────────────────────────────────
    async def embed(self, inputs: list[str]) -> dict:
        """Embed one or more strings.

        Returns ``{provider, model, dimensions, embeddings}``. Caller
        must verify ``dimensions`` matches the pgvector column they're
        about to write into.
        """

        return await self._request("POST", "/embed", json={"inputs": inputs})

    # ── ASR ─────────────────────────────────────────────────────────────
    async def transcribe_file(
        self,
        *,
        audio_path: str,
        language_hint: Optional[str] = None,
        translate_to_english: bool = True,
        prefer_provider: Optional[str] = None,
    ) -> dict:
        """Upload a local audio file and return an ``AsrResult`` dict."""

        p = Path(audio_path)
        if not p.exists():
            raise FileNotFoundError(audio_path)
        files = {"audio": (p.name, p.read_bytes(), "audio/wav")}
        data: dict[str, str] = {
            "translate_to_english": str(bool(translate_to_english)).lower(),
        }
        if language_hint:
            data["language_hint"] = language_hint
        if prefer_provider:
            data["prefer_provider"] = prefer_provider
        return await self._request("POST", "/asr/transcribe", data=data, files=files)

    async def transcribe_manual(
        self,
        *,
        manual_text: str,
        language_hint: Optional[str] = None,
        translate_to_english: bool = True,
        duration_s: Optional[float] = None,
    ) -> dict:
        data: dict[str, str] = {
            "manual_text": manual_text,
            "translate_to_english": str(bool(translate_to_english)).lower(),
        }
        if language_hint:
            data["language_hint"] = language_hint
        if duration_s is not None:
            data["duration_s"] = str(duration_s)
        return await self._request("POST", "/asr/transcribe-manual", data=data)

    # ── Extraction ─────────────────────────────────────────────────────
    async def extract_craft_dna(
        self,
        *,
        master_id: str,
        primary_language: str,
        chunks_by_pass: dict[str, list[dict]],
    ) -> dict:
        return await self._request(
            "POST",
            "/extract",
            json={
                "master_id": master_id,
                "primary_language": primary_language,
                "chunks_by_pass": chunks_by_pass,
            },
        )

    # ── Ask ─────────────────────────────────────────────────────────────
    async def ask(
        self,
        *,
        master_id: str,
        question: str,
        answer_language: str = "en",
        top_k: Optional[int] = None,
    ) -> dict:
        body: dict[str, Any] = {
            "master_id": master_id,
            "question": question,
            "answer_language": answer_language,
        }
        if top_k is not None:
            body["top_k"] = top_k
        return await self._request("POST", "/ask", json=body)

    # ── Sanad ───────────────────────────────────────────────────────────
    async def sanad_keys(self, *, master_id: str, version: int = 1) -> dict:
        return await self._request(
            "POST", "/sanad/keys", json={"master_id": master_id, "version": version}
        )

    async def sanad_sign(
        self,
        *,
        master_id: str,
        payload: dict,
        include_qr_image: bool = True,
    ) -> dict:
        return await self._request(
            "POST",
            "/sanad/sign",
            json={
                "master_id": master_id,
                "payload": payload,
                "include_qr_image": include_qr_image,
            },
        )

    async def sanad_verify(
        self, *, qr_string: str, public_key_b64: Optional[str] = None
    ) -> dict:
        body: dict[str, Any] = {"qr_string": qr_string}
        if public_key_b64:
            body["public_key_b64"] = public_key_b64
        return await self._request("POST", "/sanad/verify", json=body)


_singleton: Optional[AICoreClient] = None


def get_ai_core_client() -> AICoreClient:
    global _singleton
    if _singleton is None:
        _singleton = AICoreClient()
    return _singleton
