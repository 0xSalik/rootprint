"""Interview engine schemas.

The interview engine is a finite-state conversation:

    READY → IN_PROGRESS (one of 4 passes) → COMPLETED

Each turn produces a structured ``InterviewerAction`` from the LLM
that the orchestrator validates before sending back to the master.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

NonEmptyStr = Annotated[str, StringConstraints(min_length=1, strip_whitespace=True)]


class _Base(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class PassId(str, Enum):
    LINEAGE = "lineage"
    TECHNIQUE = "technique"
    DECISIONS = "decisions"
    SUPPLIERS = "suppliers"


class PassStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    READY_TO_CLOSE = "ready_to_close"
    COMPLETED = "completed"


class InterviewState(str, Enum):
    READY = "ready"
    IN_PROGRESS = "in_progress"
    PAUSED = "paused"
    COMPLETED = "completed"
    ABORTED = "aborted"


class InterviewTurnRole(str, Enum):
    INTERVIEWER = "interviewer"
    MASTER = "master"
    SYSTEM = "system"


# ── Per-turn artefacts ------------------------------------------------------


class InterviewTurn(_Base):
    """One spoken turn in the conversation."""

    id: NonEmptyStr
    role: InterviewTurnRole
    pass_id: PassId
    text: str
    text_translated: str | None = None
    language: str = "ks"
    audio_uri: str | None = None
    timestamp_start_s: float | None = Field(default=None, ge=0)
    timestamp_end_s: float | None = Field(default=None, ge=0)
    asr_confidence: float | None = Field(default=None, ge=0, le=1)
    created_at: datetime


# ── Interviewer's action object --------------------------------------------


class InterviewerActionKind(str, Enum):
    SAY_AND_ASK = "say_and_ask"
    PROBE_FOLLOWUP = "probe_followup"
    CLARIFY = "clarify"
    ACKNOWLEDGE = "acknowledge"
    CLOSE_PASS = "close_pass"
    CLOSE_INTERVIEW = "close_interview"
    FLAG_FOR_HUMAN = "flag_for_human"


class InterviewerAction(_Base):
    """The structured action the LLM returns each turn.

    Validated client-side and server-side. The orchestrator never
    speaks free-form to the master without going through this object —
    that prevents the LLM from drifting off-script.
    """

    kind: InterviewerActionKind
    pass_id: PassId
    text_to_speak: NonEmptyStr = Field(
        description="Final text to speak back to the master, in their language."
    )
    text_to_speak_english: NonEmptyStr | None = Field(
        default=None,
        description="English mirror for the field facilitator and the on-screen transcript.",
    )

    # Why we asked this — useful for debugging and the audit log.
    rationale: NonEmptyStr = Field(
        description="One sentence on what gap this question closes. Internal-only."
    )

    # Coverage tracking — drives pass-completion criteria.
    coverage_targets: list[str] = Field(
        default_factory=list,
        description=(
            "Slot names this question is trying to cover, e.g. "
            "'lineage.taught_by.name', 'technique.steps[0].duration'."
        ),
    )

    # If the LLM thinks the pass is complete, set ready_to_close=True so
    # the orchestrator can transition state.
    ready_to_close: bool = False

    # If the master said something extraordinary the system has never
    # seen, raise this for human cultural review before publishing.
    flag_for_human: bool = False
    flag_reason: str | None = None

    # Optional: structured slots the model claims to have just learned.
    extracted_slots: dict[str, str | int | float | bool | list[str] | None] = Field(
        default_factory=dict
    )


# ── Pass and session --------------------------------------------------------


class InterviewPass(_Base):
    """One of the 4 structured passes."""

    id: PassId
    status: PassStatus = PassStatus.PENDING
    started_at: datetime | None = None
    completed_at: datetime | None = None
    coverage_required: list[str]
    coverage_collected: list[str] = Field(default_factory=list)

    @property
    def coverage_ratio(self) -> float:
        if not self.coverage_required:
            return 1.0
        covered = set(self.coverage_collected) & set(self.coverage_required)
        return round(len(covered) / len(self.coverage_required), 3)


class InterviewSession(_Base):
    id: NonEmptyStr
    master_id: NonEmptyStr
    state: InterviewState = InterviewState.READY
    started_at: datetime | None = None
    ended_at: datetime | None = None
    primary_language: str = "ks"
    facilitator_id: str | None = None
    passes: list[InterviewPass]
    turn_count: int = 0
    flagged_turns: list[NonEmptyStr] = Field(default_factory=list)


# ── Public API request/response models --------------------------------------


class StartSessionRequest(_Base):
    master_id: NonEmptyStr
    primary_language: str = "ks"
    facilitator_id: str | None = None


class StartSessionResponse(_Base):
    session: InterviewSession
    first_action: InterviewerAction


class TurnRequest(_Base):
    session_id: NonEmptyStr
    master_text: str = Field(description="Transcribed master speech for this turn.")
    master_text_english: str | None = None
    language: str = "ks"
    audio_uri: str | None = None
    asr_confidence: float | None = Field(default=None, ge=0, le=1)
    timestamp_start_s: float | None = None
    timestamp_end_s: float | None = None
    force_close_pass: bool = Field(default=False)


class TurnResponse(_Base):
    session: InterviewSession
    action: InterviewerAction
    interviewer_turn: InterviewTurn


class CompletionResponse(_Base):
    session: InterviewSession
    summary: str
    coverage: dict[Literal["lineage", "technique", "decisions", "suppliers"], float]
