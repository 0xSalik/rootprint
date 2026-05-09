"""Timestamp-aware chunker tests."""

from __future__ import annotations

from hunarmand_ai.rag.chunker import TranscriptChunker
from hunarmand_ai.schemas.asr import AsrSegment


def _segments(count: int = 12, words_per_seg: int = 30) -> list[AsrSegment]:
    out = []
    cursor = 0.0
    for i in range(count):
        text = " ".join(f"word{i}_{j}" for j in range(words_per_seg))
        end = cursor + 2.5
        out.append(AsrSegment(start_s=cursor, end_s=end, text=text))
        cursor = end
    return out


def test_chunks_have_monotonic_timestamps() -> None:
    chunker = TranscriptChunker(target_tokens=80, overlap_tokens=10)
    chunks = chunker.chunk(
        master_id="m-1",
        session_id=None,
        pass_id="technique",
        language="ks",
        segments=_segments(),
    )
    assert chunks
    for c in chunks:
        assert c.timestamp_start_s <= c.timestamp_end_s


def test_chunks_overlap_in_time() -> None:
    chunker = TranscriptChunker(target_tokens=60, overlap_tokens=20)
    chunks = chunker.chunk(
        master_id="m-1",
        session_id=None,
        pass_id="technique",
        language="ks",
        segments=_segments(),
    )
    if len(chunks) < 2:
        return
    # Sliding window with overlap means the n-th chunk's start should be
    # earlier than the (n-1)-th chunk's end (i.e., the windows overlap).
    for prev, nxt in zip(chunks, chunks[1:], strict=False):
        assert nxt.timestamp_start_s < prev.timestamp_end_s


def test_empty_segments_returns_no_chunks() -> None:
    chunker = TranscriptChunker()
    chunks = chunker.chunk(
        master_id="m-1",
        session_id=None,
        pass_id="lineage",
        language="ks",
        segments=[],
    )
    assert chunks == []


def test_each_chunk_has_master_and_pass() -> None:
    chunker = TranscriptChunker(target_tokens=80)
    chunks = chunker.chunk(
        master_id="master-uuid",
        session_id="session-uuid",
        pass_id="suppliers",
        language="ks",
        segments=_segments(count=4),
    )
    for c in chunks:
        assert c.master_id == "master-uuid"
        assert c.session_id == "session-uuid"
        assert c.pass_id == "suppliers"
        assert c.language == "ks"
