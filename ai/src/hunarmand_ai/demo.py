"""End-to-end demo orchestration.

What this script does:

1. Loads a demo Vault fixture (a Sozni master, four passes of typed
   transcripts already in Koshur + English).
2. Chunks and embeds the transcripts (if ``--use-llm``).
3. Optionally runs the AI Interview Engine and Craft DNA extractor.
4. Generates a master Ed25519 keypair.
5. Builds a ``SanadMetadata`` payload for one finished piece.
6. Signs it, prints the canonical payload + signature + JWS-compact
   QR string.
7. Verifies the signature offline (no DB required) and with a tampered
   payload to show the verifier rejects it.
8. Saves the QR PNG to ``./out/sanad_<id>.png``.

The demo runs fully without a database when ``--use-llm=False`` — the
cryptographic chain is exercised in-memory. With ``--use-llm`` the LLM
calls are made and the Vault chunks are stored in Postgres for
"Ask the Hunarmand" demo queries.
"""

from __future__ import annotations

import base64
import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from nacl.signing import SigningKey
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from .schemas.asr import AsrSegment
from .schemas.craft_dna import (
    CraftDNA,
    LineageNode,
    LineageRelation,
    MasterIdentity,
)
from .schemas.sanad import CraftLineageRef, SanadHeader, SanadMetadata

console = Console()


async def run_demo(*, fixture_path: str, use_llm: bool) -> None:
    fixture = _load_fixture(fixture_path)
    console.print(
        Panel.fit(
            "[bold blue]HUNARMAND[/bold blue] — end-to-end Vault → Sanad demo",
            border_style="yellow",
        )
    )
    _print_master_card(fixture)

    chunks_by_pass = _build_chunks(fixture)
    _print_chunk_summary(chunks_by_pass)

    if use_llm:
        await _run_with_llm(fixture, chunks_by_pass)
    else:
        await _run_offline(fixture, chunks_by_pass)

    await _run_sanad_chain(fixture)


# ── Fixture I/O ─────────────────────────────────────────────────────────────


def _load_fixture(path: str) -> dict[str, Any]:
    p = Path(path)
    if not p.is_absolute():
        # relative to repo root if launched from there, else relative to this file's grandparent.
        candidate = Path.cwd() / p
        if not candidate.exists():
            candidate = Path(__file__).resolve().parents[2] / p
        p = candidate
    if not p.exists():
        raise FileNotFoundError(f"Fixture not found: {p}")
    return json.loads(p.read_text(encoding="utf-8"))


def _print_master_card(fixture: dict[str, Any]) -> None:
    m = fixture["master"]
    table = Table(title="Master profile", show_header=False, show_lines=True)
    for k, v in m.items():
        table.add_row(str(k), str(v))
    console.print(table)


def _build_chunks(fixture: dict[str, Any]) -> dict[str, list[dict[str, Any]]]:
    chunks_by_pass: dict[str, list[dict[str, Any]]] = {}
    cursor: dict[str, float] = {}
    for pass_id, turns in fixture["passes"].items():
        bucket = chunks_by_pass.setdefault(pass_id, [])
        cursor.setdefault(pass_id, 0.0)
        for turn in turns:
            text = turn["text_ks"].strip()
            translation = turn.get("text_en")
            duration = float(turn.get("duration_s", max(2.0, len(text) / 18)))
            start = cursor[pass_id]
            end = start + duration
            cursor[pass_id] = end
            bucket.append(
                {
                    "chunk_id": turn["id"],
                    "pass_id": pass_id,
                    "text": text,
                    "text_en": translation,
                    "language": "ks",
                    "timestamp_start_s": start,
                    "timestamp_end_s": end,
                    "audio_uri": turn.get("audio_uri"),
                }
            )
    return chunks_by_pass


def _print_chunk_summary(chunks: dict[str, list[dict[str, Any]]]) -> None:
    table = Table(title="Vault chunks", show_lines=False)
    table.add_column("pass")
    table.add_column("count")
    table.add_column("total seconds")
    for pass_id, items in chunks.items():
        secs = items[-1]["timestamp_end_s"] - items[0]["timestamp_start_s"] if items else 0
        table.add_row(pass_id, str(len(items)), f"{secs:.1f}")
    console.print(table)


# ── LLM-on path ─────────────────────────────────────────────────────────────


async def _run_with_llm(fixture: dict[str, Any], chunks: dict[str, list]) -> None:
    from .extractor import get_extractor
    from .rag.embedder import get_embedder

    console.rule("[yellow]Running Craft DNA extractor (LLM)[/yellow]")
    extractor = get_extractor()
    dna = await extractor.extract(
        master_id=fixture["master"]["id"],
        primary_language="ks",
        chunks_by_pass=chunks,  # type: ignore[arg-type]
    )

    summary = Table(title="Craft DNA summary")
    summary.add_column("metric")
    summary.add_column("value")
    summary.add_row("techniques", str(len(dna.techniques)))
    summary.add_row("tools", str(len(dna.tools)))
    summary.add_row("materials", str(len(dna.materials)))
    summary.add_row("decision rules", str(len(dna.decision_rules)))
    summary.add_row("environmental tunings", str(len(dna.environmental_tunings)))
    summary.add_row("failure logs", str(len(dna.failure_logs)))
    summary.add_row("vulnerability index", str(dna.knowledge_vulnerability_index()))
    console.print(summary)

    out_dir = Path("out")
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "craft_dna.json").write_text(
        dna.model_dump_json(indent=2), encoding="utf-8"
    )
    console.print(f"[green]Saved[/green] out/craft_dna.json")

    # Embed all chunks so "Ask the Hunarmand" can later query (DB-backed
    # demo path is wired through the FastAPI route; we just verify the
    # embedder is configured here).
    flat_texts = [c["text"] for items in chunks.values() for c in items]
    embeddings = await get_embedder().embed_texts(flat_texts)
    console.print(
        f"[green]Embedded[/green] {len(embeddings)} chunks "
        f"({len(embeddings[0]) if embeddings else 0}d vectors)"
    )


# ── Offline path ────────────────────────────────────────────────────────────


async def _run_offline(fixture: dict[str, Any], chunks: dict[str, list]) -> None:
    """Build a *deterministic* Craft DNA from the fixture without an LLM.

    This is the path that runs in CI and on a demo machine without
    OPENAI_API_KEY. It exercises the schema, the chunker, and the
    Sanad signing chain — i.e. everything that is not LLM-bound.
    """

    from .rag.chunker import TranscriptChunker

    console.rule("[yellow]Building deterministic Craft DNA (offline)[/yellow]")

    m = fixture["master"]
    identity = MasterIdentity(
        full_name=m["full_name"],
        name_in_koshur=m.get("name_in_koshur"),
        craft_category=m["craft_category"],
        village=m.get("village"),
        district=m.get("district"),
        started_practising_year=m.get("started_practising_year"),
        generation_in_practice=m.get("generation_in_practice"),
        bio_short=m.get("bio_short"),
    )

    lineage = [
        LineageNode(
            id=ln["id"],
            name=ln["name"],
            relation=LineageRelation(ln["relation"]),
            village=ln.get("village"),
            period_start_year=ln.get("period_start_year"),
            period_end_year=ln.get("period_end_year"),
            notes=ln.get("notes"),
        )
        for ln in fixture.get("lineage", [])
    ]

    dna = CraftDNA(
        master_id=m["id"],
        captured_at=datetime.now(tz=timezone.utc),
        primary_language="ks",
        identity=identity,
        lineage=lineage,
    )

    # Chunk one pass to demonstrate the chunker on the fixture.
    chunker = TranscriptChunker()
    technique_chunks = chunks.get("technique", [])
    segments = [
        AsrSegment(
            start_s=c["timestamp_start_s"],
            end_s=c["timestamp_end_s"],
            text=c["text"],
        )
        for c in technique_chunks
    ]
    rag_chunks = chunker.chunk(
        master_id=m["id"],
        session_id=None,
        pass_id="technique",
        language="ks",
        segments=segments,
    )
    console.print(
        f"[green]Chunked[/green] technique pass into {len(rag_chunks)} RAG chunks"
    )

    out_dir = Path("out")
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "craft_dna_offline.json").write_text(
        dna.model_dump_json(indent=2), encoding="utf-8"
    )
    console.print(f"[green]Saved[/green] out/craft_dna_offline.json")


# ── Sanad chain (offline-deterministic) ─────────────────────────────────────


async def _run_sanad_chain(fixture: dict[str, Any]) -> None:
    """Sign + verify a Sanad without going through a database.

    For the demo we build an in-memory keypair so the cryptographic chain
    can be exercised on any machine. The real service uses the DB-backed
    ``KeyManager`` with at-rest encryption.
    """

    from .sanad.canonicalizer import canonicalize, sha256_b64url
    from .sanad.qr import (
        decode_qr_string,
        encode_qr_string,
        qr_image_base64_png,
        signed_message,
    )
    from .sanad.keys import KeyManager

    console.rule("[yellow]Signing Sanad (Ed25519 + RFC 8785 JCS)[/yellow]")

    signing_key = SigningKey.generate()
    pubkey = bytes(signing_key.verify_key)

    m = fixture["master"]
    piece = fixture["sanad"]["piece"]
    payload = SanadMetadata(
        sanad_id=piece["sanad_id"],
        piece_id=piece["piece_id"],
        craft_category=m["craft_category"],
        technique_ids=piece.get("technique_ids", []),
        technique_names=piece.get("technique_names", []),
        materials_summary=piece.get("materials_summary", []),
        made_at_workshop=piece.get("made_at_workshop"),
        completed_on=datetime.fromisoformat(piece["completed_on"]),
        issued_at=datetime.now(tz=timezone.utc),
        lineage=CraftLineageRef(
            master_id=m["id"],
            master_name=m["full_name"],
            generation=m.get("generation_in_practice"),
            village=m.get("village"),
            lineage_chain=[ln["name"] for ln in fixture.get("lineage", [])],
        ),
        short_summary=piece["short_summary"],
        fair_price_band=piece.get("fair_price_band"),
        extras=piece.get("extras", {}),
    )

    header = SanadHeader(kid=KeyManager.kid(uuid.UUID(m["id"]), 1))
    canonical_payload = canonicalize(payload)
    canonical_header = canonicalize(header)
    msg = signed_message(canonical_header, canonical_payload)
    signature = signing_key.sign(msg).signature

    qr_string = encode_qr_string(header=header, payload=payload, signature=signature)
    payload_hash = sha256_b64url(canonical_payload)

    info = Table(title="Sanad envelope", show_lines=True)
    info.add_column("field")
    info.add_column("value")
    info.add_row("kid", header.kid)
    info.add_row("sanad_id", payload.sanad_id)
    info.add_row("piece_id", payload.piece_id)
    info.add_row("craft", payload.craft_category)
    info.add_row("payload sha256 (b64url)", payload_hash)
    info.add_row("signature (b64url)", base64.urlsafe_b64encode(signature).decode("ascii").rstrip("="))
    info.add_row("qr_string", _ellipsise(qr_string, 86))
    console.print(info)

    out_dir = Path("out")
    out_dir.mkdir(parents=True, exist_ok=True)
    qr_png_b64 = qr_image_base64_png(qr_string)
    (out_dir / f"sanad_{payload.sanad_id}.png").write_bytes(base64.b64decode(qr_png_b64))
    console.print(f"[green]Saved[/green] out/sanad_{payload.sanad_id}.png")

    # Verify happy path.
    h2, p2, sig2, header_bytes2, payload_bytes2 = decode_qr_string(qr_string)
    msg2 = signed_message(header_bytes2, payload_bytes2)
    ok = KeyManager.verify(public_key_bytes=pubkey, message=msg2, signature=sig2)
    console.print(
        f"[green]✓ Signature verifies[/green] against the master's public key"
        if ok
        else "[red]✗ Signature did NOT verify[/red]"
    )

    # Verify tampered path.
    tampered = qr_string[:-4] + ("AAAA" if qr_string[-4:] != "AAAA" else "BBBB")
    try:
        h3, p3, sig3, header_bytes3, payload_bytes3 = decode_qr_string(tampered)
        msg3 = signed_message(header_bytes3, payload_bytes3)
        ok_bad = KeyManager.verify(public_key_bytes=pubkey, message=msg3, signature=sig3)
    except Exception:
        ok_bad = False
    console.print(
        "[green]✓ Tampered Sanad rejected[/green] (as expected)"
        if not ok_bad
        else "[red]✗ Tampered Sanad accepted — investigate[/red]"
    )


def _ellipsise(text: str, n: int) -> str:
    return text if len(text) <= n else text[: n - 1] + "…"
