"""RAG / Ask the Hunarmand schemas."""

from __future__ import annotations

from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

NonEmptyStr = Annotated[str, StringConstraints(min_length=1, strip_whitespace=True)]


class _Base(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class RetrievedChunk(_Base):
    chunk_id: NonEmptyStr
    master_id: NonEmptyStr
    pass_id: NonEmptyStr
    text: str
    text_en: str | None = None
    timestamp_start_s: float = Field(ge=0)
    timestamp_end_s: float = Field(ge=0)
    language: str = "ks"
    score: float
    audio_uri: str | None = None


class AskRequest(_Base):
    master_id: NonEmptyStr
    question: NonEmptyStr
    answer_language: str = Field(default="en")
    top_k: int | None = None


class AskCitation(_Base):
    chunk_id: NonEmptyStr
    pass_id: NonEmptyStr
    timestamp_start_s: float
    timestamp_end_s: float
    quote: str
    quote_en: str | None = None
    audio_uri: str | None = None
    score: float


class AskResponse(_Base):
    answer: str
    refused: bool = False
    refusal_reason: str | None = None
    citations: list[AskCitation] = Field(default_factory=list)
    answer_language: str = "en"
    master_id: NonEmptyStr
    confidence: float = Field(ge=0, le=1, default=0.0)
