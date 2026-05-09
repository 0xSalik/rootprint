"""Interview engine endpoints.

Sessions are kept in-memory by the engine for the hackathon; a future
revision will move them to Postgres via ``InterviewSessionRow`` etc.
The schemas already match — this is a swap, not a rewrite.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from ..interviewer import get_interview_engine
from ..schemas.interview import (
    CompletionResponse,
    InterviewSession,
    StartSessionRequest,
    StartSessionResponse,
    TurnRequest,
    TurnResponse,
)

router = APIRouter(prefix="/interview", tags=["interview"])

# In-memory session registry. The router is single-process; replace with
# DB-backed registry when wiring Track-A's persistence layer.
_SESSIONS: dict[str, InterviewSession] = {}


@router.post("/start", response_model=StartSessionResponse)
async def start_session(req: StartSessionRequest) -> StartSessionResponse:
    engine = get_interview_engine()
    session = engine.create_session(
        master_id=req.master_id,
        primary_language=req.primary_language,
        facilitator_id=req.facilitator_id,
    )
    session, action, _ = await engine.start_first_pass(session)
    _SESSIONS[session.id] = session
    return StartSessionResponse(session=session, first_action=action)


@router.post("/turn", response_model=TurnResponse)
async def turn(req: TurnRequest) -> TurnResponse:
    engine = get_interview_engine()
    session = _SESSIONS.get(req.session_id)
    if session is None:
        raise HTTPException(404, "Session not found")

    session, action, interviewer_turn = await engine.next_action(
        session=session,
        master_text=req.master_text,
        master_text_english=req.master_text_english,
        language=req.language,
        audio_uri=req.audio_uri,
        timestamp_start_s=req.timestamp_start_s,
        timestamp_end_s=req.timestamp_end_s,
        asr_confidence=req.asr_confidence,
        force_close_pass=req.force_close_pass,
    )
    _SESSIONS[session.id] = session
    return TurnResponse(session=session, action=action, interviewer_turn=interviewer_turn)


@router.get("/{session_id}", response_model=InterviewSession)
async def get_session(session_id: str) -> InterviewSession:
    session = _SESSIONS.get(session_id)
    if session is None:
        raise HTTPException(404, "Session not found")
    return session


@router.post("/{session_id}/summary", response_model=CompletionResponse)
async def summary(session_id: str) -> CompletionResponse:
    engine = get_interview_engine()
    session = _SESSIONS.get(session_id)
    if session is None:
        raise HTTPException(404, "Session not found")
    coverage = {
        p.id.value: p.coverage_ratio for p in session.passes
    }
    return CompletionResponse(
        session=session, summary=engine.get_summary(session), coverage=coverage  # type: ignore[arg-type]
    )
