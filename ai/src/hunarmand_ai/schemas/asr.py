"""ASR pipeline schemas."""

from __future__ import annotations

from enum import Enum
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

NonEmptyStr = Annotated[str, StringConstraints(min_length=1, strip_whitespace=True)]


class _Base(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class AsrProvider(str, Enum):
    BHASHINI = "bhashini"
    AI4BHARAT = "ai4bharat"
    GROQ = "groq"
    HF_INFERENCE = "hf_inference"
    WHISPER = "whisper"
    MANUAL = "manual"


class AsrSegment(_Base):
    start_s: float = Field(ge=0)
    end_s: float = Field(ge=0)
    text: str
    avg_logprob: float | None = None


class AsrResult(_Base):
    provider: AsrProvider
    language_detected: str
    text: str
    text_translated_en: str | None = None
    confidence: float = Field(ge=0, le=1)
    segments: list[AsrSegment] = Field(default_factory=list)
    duration_s: float = Field(ge=0)
    notes: str | None = None
    fallback_used: bool = False
    fallback_chain: list[AsrProvider] = Field(default_factory=list)


class AsrRequest(_Base):
    audio_uri: str | None = None
    audio_base64: str | None = None
    language_hint: str | None = None
    prefer_provider: AsrProvider | None = None
    translate_to_english: bool = True

    @property
    def has_audio(self) -> bool:
        return bool(self.audio_uri or self.audio_base64)
