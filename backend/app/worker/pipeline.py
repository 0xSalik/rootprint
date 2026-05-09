"""The actual ingest pipeline used by both Celery and inline-task modes.

This module is provider-agnostic: it does S3 download → AI core ASR →
AI core extraction → embedding → DB write, regardless of whether it's
running inside a Celery worker or inside FastAPI's BackgroundTasks.

Why a separate module? Celery tasks are sync entry points (decorated
functions) and FastAPI BackgroundTasks are also typically sync. Having
the actual orchestration in a single coroutine that we drive with
``asyncio.run(...)`` keeps the two modes byte-for-byte equivalent.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import tempfile
import uuid
from pathlib import Path
from typing import Any, Optional

import boto3
from botocore.exceptions import BotoCoreError, ClientError
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.clients.ai_core import AICoreClient, AICoreError
from app.core.config import settings
from app.core.database import engine
from app.models.models import CraftDNA, Vault

log = logging.getLogger(__name__)


# --- A small helper so failures in any single step don't lose context. ---
class PipelineError(RuntimeError):
    pass


async def process_vault(vault_id: str, s3_key: str) -> dict[str, Any]:
    """End-to-end: S3 -> ASR -> CraftDNA extraction -> embedding -> DB.

    Always returns a dict (never raises further than ``PipelineError``)
    so the caller (Celery or BackgroundTasks) can attach simple status
    handling.
    """

    log.info("pipeline.start vault_id=%s s3_key=%s", vault_id, s3_key)

    audio_path: Optional[str] = None
    try:
        audio_path = _download_from_s3(s3_key)
        client = AICoreClient()

        # 1. Transcribe (Whisper / Bhashini / AI4Bharat / HF / Groq via the ladder)
        try:
            asr_result = await client.transcribe_file(
                audio_path=audio_path, language_hint="ks", translate_to_english=True
            )
        except AICoreError as exc:
            raise PipelineError(f"ASR failed: {exc}") from exc

        transcript = (asr_result.get("text") or "").strip()
        translation = asr_result.get("text_translated_en") or transcript
        segments = asr_result.get("segments", []) or []
        duration = float(asr_result.get("duration_s", 0.0) or 0.0)
        provider_used = asr_result.get("provider", "unknown")
        log.info(
            "pipeline.asr_ok vault_id=%s provider=%s chars=%d duration=%.1fs",
            vault_id, provider_used, len(transcript), duration,
        )

        # 2. Build a single-pass technique chunk set for the extractor.
        # The AI core's full Vault flow has 4 passes; here we only have
        # one ad-hoc upload, so we treat it as a TECHNIQUE pass — that's
        # what the demo flow records.
        chunks_by_pass = _build_chunks_by_pass(
            vault_id=vault_id,
            transcript=transcript,
            translation=translation,
            segments=segments,
        )

        # 3. Extract Craft DNA (AI core: structured, citation-back-referenced).
        try:
            extraction = await client.extract_craft_dna(
                master_id=str(_master_id_for(vault_id)),
                primary_language="ks",
                chunks_by_pass=chunks_by_pass,
            )
        except AICoreError as exc:
            log.warning("pipeline.extract_failed vault_id=%s err=%s", vault_id, exc)
            extraction = {}

        craft_dna = (extraction or {}).get("craft_dna") or {}
        techniques = craft_dna.get("techniques") or []
        first_technique = techniques[0] if techniques else {}
        technique_name = (
            first_technique.get("name_english")
            or first_technique.get("name_local")
            or "Captured technique"
        )
        technique_graph = {
            "techniques": techniques,
            "tools": craft_dna.get("tools") or [],
            "materials": craft_dna.get("materials") or [],
            "environmental_tunings": craft_dna.get("environmental_tunings") or [],
            "decision_rules": craft_dna.get("decision_rules") or [],
        }
        supplier_graph = {
            "suppliers": craft_dna.get("suppliers") or [],
            "lineage": craft_dna.get("lineage") or [],
        }

        # 4. Embed the translated transcript so /search/techniques can find it.
        embedding: list[float] = []
        if translation:
            try:
                embed_resp = await client.embed([translation])
                embeddings = embed_resp.get("embeddings") or []
                if embeddings:
                    embedding = embeddings[0]
                    if len(embedding) != settings.HUNARMAND_EMBEDDING_DIMENSIONS:
                        log.warning(
                            "pipeline.embedding_dim_mismatch got=%d expected=%d",
                            len(embedding), settings.HUNARMAND_EMBEDDING_DIMENSIONS,
                        )
                        embedding = []
            except AICoreError as exc:
                log.warning("pipeline.embed_failed vault_id=%s err=%s", vault_id, exc)

        # 5. Persist.
        await _persist_craft_dna(
            vault_id=vault_id,
            technique_name=technique_name,
            transcript=transcript,
            translated_transcript=translation,
            technique_graph=technique_graph,
            supplier_graph=supplier_graph,
            embedding=embedding,
        )

        log.info("pipeline.complete vault_id=%s technique=%s", vault_id, technique_name)
        return {
            "status": "completed",
            "vault_id": vault_id,
            "technique": technique_name,
            "asr_provider": provider_used,
        }
    finally:
        if audio_path and os.path.exists(audio_path):
            try:
                os.remove(audio_path)
            except OSError:
                pass


# ── Helpers ────────────────────────────────────────────────────────────────


def _s3_client() -> Any:
    return boto3.client(
        "s3",
        endpoint_url=settings.S3_ENDPOINT_URL or None,
        aws_access_key_id=settings.S3_ACCESS_KEY or None,
        aws_secret_access_key=settings.S3_SECRET_KEY or None,
        region_name="auto",
    )


def _download_from_s3(s3_key: str) -> str:
    """Download the S3 object to a temp file and return its path.

    On a laptop demo without S3 configured, you can pre-place a file at
    ``/tmp/vault-fixtures/<basename>`` and we'll use that — that lets
    you exercise the pipeline without R2 credentials.
    """

    fixture_path = Path("/tmp/vault-fixtures") / os.path.basename(s3_key)
    if fixture_path.exists():
        log.info("pipeline.s3_fixture_used path=%s", fixture_path)
        return str(fixture_path)

    if not settings.S3_BUCKET:
        raise PipelineError("S3_BUCKET not configured and no local fixture present.")

    suffix = Path(s3_key).suffix or ".bin"
    tmp = tempfile.NamedTemporaryFile(suffix=suffix, delete=False)
    tmp.close()
    try:
        _s3_client().download_file(settings.S3_BUCKET, s3_key, tmp.name)
    except (BotoCoreError, ClientError) as exc:
        raise PipelineError(f"S3 download failed: {exc}") from exc
    return tmp.name


def _build_chunks_by_pass(
    *,
    vault_id: str,
    transcript: str,
    translation: str,
    segments: list[dict],
) -> dict[str, list[dict]]:
    """Convert ASR output into the AI core extractor's chunk format."""

    if not transcript and not segments:
        return {"technique": []}

    chunks: list[dict] = []
    if segments:
        for i, seg in enumerate(segments):
            text = (seg.get("text") or "").strip()
            if not text:
                continue
            chunks.append({
                "chunk_id": f"{vault_id}-seg-{i}",
                "pass_id": "technique",
                "text": text,
                "text_en": translation if i == 0 else None,
                "language": "ks",
                "timestamp_start_s": float(seg.get("start_s", 0.0) or 0.0),
                "timestamp_end_s": float(seg.get("end_s", 0.0) or 0.0),
            })
    else:
        chunks.append({
            "chunk_id": f"{vault_id}-seg-0",
            "pass_id": "technique",
            "text": transcript,
            "text_en": translation,
            "language": "ks",
            "timestamp_start_s": 0.0,
            "timestamp_end_s": 0.0,
        })
    return {"technique": chunks}


def _master_id_for(vault_id: str) -> uuid.UUID:
    """Look up the master_id for a vault. Synchronous fallback if we
    can't open an async session here — most call sites already have it.

    NOTE: This is only used as a hint into the AI core's extractor. If
    we don't know the master id at this point, the AI core just uses
    whatever string we send.
    """

    # We avoid an extra DB round-trip for the worker hot path; the
    # caller already has the vault_id, and the AI core's extractor
    # accepts any string identifier. We resolve the real master_id
    # at persist time (see _persist_craft_dna).
    return uuid.uuid5(uuid.NAMESPACE_URL, f"vault://{vault_id}")


async def _persist_craft_dna(
    *,
    vault_id: str,
    technique_name: str,
    transcript: str,
    translated_transcript: str,
    technique_graph: dict,
    supplier_graph: dict,
    embedding: list[float],
) -> None:
    AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)
    async with AsyncSessionLocal() as session:
        vault = await session.get(Vault, uuid.UUID(vault_id))
        if not vault:
            raise PipelineError(f"Vault {vault_id} disappeared before persist.")

        # Upsert: there's a 1:1 between Vault and CraftDNA per the model.
        from sqlalchemy import select  # local import to avoid top-level cycles

        existing = await session.execute(
            select(CraftDNA).where(CraftDNA.vault_id == vault.id)
        )
        row = existing.scalars().first()
        if row is None:
            row = CraftDNA(
                master_id=vault.master_id,
                vault_id=vault.id,
                technique_name=technique_name,
                transcript=transcript,
                translated_transcript=translated_transcript,
                technique_graph=technique_graph,
                supplier_graph=supplier_graph,
                embedding=embedding or None,
            )
            session.add(row)
        else:
            row.technique_name = technique_name
            row.transcript = transcript
            row.translated_transcript = translated_transcript
            row.technique_graph = technique_graph
            row.supplier_graph = supplier_graph
            if embedding:
                row.embedding = embedding

        vault.status = "completed"
        await session.commit()


# ── Sync entry-point for Celery ───────────────────────────────────────────


def run_sync(vault_id: str, s3_key: str) -> dict[str, Any]:
    """Drive the async pipeline from a sync (Celery) context."""

    return asyncio.run(process_vault(vault_id, s3_key))
