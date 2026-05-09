"""Timestamp-aware transcript chunker.

Why timestamp-aware? Because every "Ask the Hunarmand" answer must cite
the exact moment in the master's actual video where the answer comes
from. A naive sliding window over text would discard timestamps and
break the citation contract.

Algorithm:

* Each ASR segment carries ``start_s`` and ``end_s``.
* We pack contiguous segments into a chunk until the chunk reaches the
  configured token budget.
* A chunk inherits the timestamp of its first segment as ``start_s``
  and of its last segment as ``end_s``.
* Adjacent chunks overlap by ``rag_chunk_overlap`` tokens to preserve
  context across boundaries.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field

import tiktoken

from ..config import get_settings
from ..schemas.asr import AsrSegment


@dataclass
class TranscriptChunk:
    chunk_id: str
    master_id: str
    session_id: str | None
    pass_id: str
    text: str
    text_en: str | None
    language: str
    timestamp_start_s: float
    timestamp_end_s: float
    audio_uri: str | None
    extra: dict[str, str] = field(default_factory=dict)


_TOKENIZER = tiktoken.get_encoding("cl100k_base")


def _count_tokens(text: str) -> int:
    return len(_TOKENIZER.encode(text or ""))


class TranscriptChunker:
    def __init__(self, *, target_tokens: int | None = None, overlap_tokens: int | None = None) -> None:
        s = get_settings()
        self.target = target_tokens or s.rag_chunk_tokens
        self.overlap = overlap_tokens or s.rag_chunk_overlap

    def chunk(
        self,
        *,
        master_id: str,
        session_id: str | None,
        pass_id: str,
        language: str,
        segments: list[AsrSegment],
        translation_en: str | None = None,
        audio_uri: str | None = None,
    ) -> list[TranscriptChunk]:
        if not segments:
            return []

        chunks: list[TranscriptChunk] = []
        buffer_segments: list[AsrSegment] = []
        buffer_tokens = 0

        for seg in segments:
            seg_text = seg.text.strip()
            if not seg_text:
                continue
            seg_tokens = _count_tokens(seg_text)
            if buffer_tokens + seg_tokens > self.target and buffer_segments:
                chunks.append(
                    self._make_chunk(
                        master_id=master_id,
                        session_id=session_id,
                        pass_id=pass_id,
                        language=language,
                        buffer=buffer_segments,
                        translation_en=translation_en,
                        audio_uri=audio_uri,
                    )
                )
                buffer_segments = self._tail_overlap(buffer_segments)
                buffer_tokens = sum(_count_tokens(s.text) for s in buffer_segments)
            buffer_segments.append(seg)
            buffer_tokens += seg_tokens

        if buffer_segments:
            chunks.append(
                self._make_chunk(
                    master_id=master_id,
                    session_id=session_id,
                    pass_id=pass_id,
                    language=language,
                    buffer=buffer_segments,
                    translation_en=translation_en,
                    audio_uri=audio_uri,
                )
            )

        return chunks

    def _tail_overlap(self, buffer: list[AsrSegment]) -> list[AsrSegment]:
        out: list[AsrSegment] = []
        tokens = 0
        for seg in reversed(buffer):
            out.insert(0, seg)
            tokens += _count_tokens(seg.text)
            if tokens >= self.overlap:
                break
        return out

    @staticmethod
    def _make_chunk(
        *,
        master_id: str,
        session_id: str | None,
        pass_id: str,
        language: str,
        buffer: list[AsrSegment],
        translation_en: str | None,
        audio_uri: str | None,
    ) -> TranscriptChunk:
        text = " ".join(s.text.strip() for s in buffer if s.text.strip())
        return TranscriptChunk(
            chunk_id=str(uuid.uuid4()),
            master_id=master_id,
            session_id=session_id,
            pass_id=pass_id,
            text=text,
            text_en=None,  # Per-chunk translation is computed on demand.
            language=language,
            timestamp_start_s=float(buffer[0].start_s),
            timestamp_end_s=float(buffer[-1].end_s),
            audio_uri=audio_uri,
        )


def chunk_pass(
    *,
    master_id: str,
    session_id: str | None,
    pass_id: str,
    language: str,
    segments: list[AsrSegment],
    audio_uri: str | None = None,
) -> list[TranscriptChunk]:
    """Convenience wrapper using default settings."""

    return TranscriptChunker().chunk(
        master_id=master_id,
        session_id=session_id,
        pass_id=pass_id,
        language=language,
        segments=segments,
        audio_uri=audio_uri,
    )
