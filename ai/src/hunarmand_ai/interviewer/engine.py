"""The Vault Interview Engine.

The orchestrator is intentionally *boring* — all the cleverness is in
the prompts, the schema, and the follow-up rules. The engine itself
just:

    1. owns the session state machine,
    2. asks the LLM for the next action,
    3. validates the action with Pydantic,
    4. applies the follow-up rules,
    5. records the turn.

Everything is in-memory by default; persistence is layered on top by
the routers that wire this into the database.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

import structlog

from ..llm.client import LLMClient, get_llm_client
from ..llm.structured import generate_structured
from ..schemas.craft_dna import MasterIdentity
from ..schemas.interview import (
    InterviewPass,
    InterviewSession,
    InterviewState,
    InterviewTurn,
    InterviewTurnRole,
    InterviewerAction,
    InterviewerActionKind,
    PassId,
    PassStatus,
)
from .followup import confirm_collected_slots, reconcile_action
from .passes import PASS_DEFINITIONS, PASS_ORDER, PassDefinition, get_pass_definition
from .prompts import opening_prompt, render_history_user_message, system_prompt_for_pass

log = structlog.get_logger(__name__)


def _utcnow() -> datetime:
    return datetime.now(tz=timezone.utc)


class InterviewEngine:
    def __init__(self, llm: LLMClient | None = None) -> None:
        self._llm = llm or get_llm_client()
        # session_id -> in-memory transcript (the DB is the source of
        # truth; this is just a hot cache to keep prompts cheap).
        self._history: dict[str, list[dict[str, str]]] = {}

    # ── State helpers ────────────────────────────────────────────────────
    @staticmethod
    def _new_passes() -> list[InterviewPass]:
        return [
            InterviewPass(
                id=pid,
                status=PassStatus.PENDING,
                coverage_required=PASS_DEFINITIONS[pid].coverage_required,
            )
            for pid in PASS_ORDER
        ]

    @staticmethod
    def _current_pass(session: InterviewSession) -> InterviewPass | None:
        for p in session.passes:
            if p.status in (PassStatus.IN_PROGRESS, PassStatus.READY_TO_CLOSE):
                return p
        # If none in-progress, return the next pending.
        for p in session.passes:
            if p.status == PassStatus.PENDING:
                return p
        return None

    @staticmethod
    def _get_pass(session: InterviewSession, pass_id: PassId) -> InterviewPass | None:
        for p in session.passes:
            if p.id == pass_id:
                return p
        return None

    # ── Public API ───────────────────────────────────────────────────────
    def create_session(
        self,
        *,
        master_id: str,
        primary_language: str = "ks",
        facilitator_id: str | None = None,
    ) -> InterviewSession:
        session = InterviewSession(
            id=str(uuid.uuid4()),
            master_id=master_id,
            primary_language=primary_language,
            facilitator_id=facilitator_id,
            passes=self._new_passes(),
            state=InterviewState.READY,
        )
        self._history[session.id] = []
        return session

    async def start_first_pass(
        self, session: InterviewSession, identity: MasterIdentity | None = None
    ) -> tuple[InterviewSession, InterviewerAction, InterviewTurn]:
        if session.state != InterviewState.READY:
            raise RuntimeError(f"Cannot start; session in state {session.state}")

        first_pass = session.passes[0]
        first_pass.status = PassStatus.IN_PROGRESS
        first_pass.started_at = _utcnow()
        session.state = InterviewState.IN_PROGRESS
        session.started_at = _utcnow()

        pass_def = get_pass_definition(first_pass.id)
        opening = opening_prompt(pass_def=pass_def, primary_language=session.primary_language)

        action = InterviewerAction(
            kind=InterviewerActionKind.SAY_AND_ASK,
            pass_id=first_pass.id,
            text_to_speak=opening,
            text_to_speak_english=pass_def.opening_text_en,
            rationale=f"Open the {pass_def.title} pass with the canonical greeting.",
            coverage_targets=[],
        )
        turn = self._record_turn(
            session=session,
            role=InterviewTurnRole.INTERVIEWER,
            text=action.text_to_speak,
            text_translated=action.text_to_speak_english,
            language=session.primary_language,
        )
        return session, action, turn

    async def next_action(
        self,
        *,
        session: InterviewSession,
        master_text: str,
        master_text_english: str | None,
        language: str,
        identity: MasterIdentity | None = None,
        audio_uri: str | None = None,
        timestamp_start_s: float | None = None,
        timestamp_end_s: float | None = None,
        asr_confidence: float | None = None,
        force_close_pass: bool = False,
    ) -> tuple[InterviewSession, InterviewerAction, InterviewTurn]:
        """Process the master's turn and produce the next interviewer action."""

        if session.state == InterviewState.COMPLETED:
            raise RuntimeError("Session already completed.")

        current_pass = self._current_pass(session)
        if current_pass is None:
            session.state = InterviewState.COMPLETED
            session.ended_at = _utcnow()
            return (
                session,
                InterviewerAction(
                    kind=InterviewerActionKind.CLOSE_INTERVIEW,
                    pass_id=PassId.SUPPLIERS,
                    text_to_speak="Shukriya, ustaad-ji. We have everything we need for now.",
                    text_to_speak_english="Thank you, ustaad-ji. We have everything we need for now.",
                    rationale="No remaining passes; closing the interview.",
                ),
                self._record_turn(
                    session=session,
                    role=InterviewTurnRole.INTERVIEWER,
                    text="Shukriya, ustaad-ji. We have everything we need for now.",
                    language=session.primary_language,
                ),
            )

        # Record the master's turn first so the interviewer can see it
        # in the prompt history.
        master_turn = self._record_turn(
            session=session,
            role=InterviewTurnRole.MASTER,
            text=master_text,
            text_translated=master_text_english,
            language=language,
            audio_uri=audio_uri,
            timestamp_start_s=timestamp_start_s,
            timestamp_end_s=timestamp_end_s,
            asr_confidence=asr_confidence,
            pass_id=current_pass.id,
        )
        log.debug("interview.master_turn", session_id=session.id, text=master_text[:120])

        # Did the master answer meaningfully? Used to decide whether to
        # credit the previous question's coverage targets.
        meaningful = self._is_meaningful_answer(master_text)

        # Pull last interviewer action's coverage_targets from history if
        # we recorded them.
        last_targets = self._last_interviewer_targets(session.id)
        confirm_collected_slots(
            pass_state=current_pass,
            claimed=last_targets,
            master_responded_meaningfully=meaningful,
        )

        if force_close_pass:
            return self._close_pass(session, current_pass)

        # Compose the LLM prompt.
        pass_def = get_pass_definition(current_pass.id)
        system = system_prompt_for_pass(
            pass_def=pass_def,
            identity=identity,
            collected=current_pass.coverage_collected,
            primary_language=session.primary_language,
        )
        user_block = render_history_user_message(self._history.get(session.id, []))
        messages = [
            {"role": "user", "content": user_block},
            {
                "role": "user",
                "content": (
                    "Produce the JSON ``InterviewerAction`` for the NEXT turn now. "
                    "If you decide the pass is complete, set ``ready_to_close=true`` and "
                    "your ``text_to_speak`` should thank the master and signal a brief pause."
                ),
            },
        ]

        action = await generate_structured(
            output_model=InterviewerAction,
            system=system,
            messages=messages,
            client=self._llm,
            temperature=0.3,
            max_tokens=800,
        )

        # Pass-id sanity: occasionally the LLM tries to switch passes; we
        # do not allow it to.
        action.pass_id = current_pass.id

        turn_count_in_pass = sum(
            1
            for h in self._history[session.id]
            if h["role"] == "interviewer" and h.get("pass_id") == current_pass.id.value
        )
        action = reconcile_action(
            pass_state=current_pass,
            pass_def=pass_def,
            action=action,
            turn_count_in_pass=turn_count_in_pass,
        )

        if action.flag_for_human:
            session.flagged_turns = list(set(session.flagged_turns) | {master_turn.id})

        if action.ready_to_close:
            session, close_action, close_turn = self._close_pass(session, current_pass)
            return session, close_action, close_turn

        # Record the interviewer's question turn.
        interviewer_turn = self._record_turn(
            session=session,
            role=InterviewTurnRole.INTERVIEWER,
            text=action.text_to_speak,
            text_translated=action.text_to_speak_english,
            language=session.primary_language,
            pass_id=current_pass.id,
            coverage_targets=action.coverage_targets,
        )
        return session, action, interviewer_turn

    # ── Closing helpers ─────────────────────────────────────────────────
    def _close_pass(
        self, session: InterviewSession, current_pass: InterviewPass
    ) -> tuple[InterviewSession, InterviewerAction, InterviewTurn]:
        current_pass.status = PassStatus.COMPLETED
        current_pass.completed_at = _utcnow()

        next_pass = self._next_pending_pass(session, after=current_pass.id)
        if next_pass is None:
            session.state = InterviewState.COMPLETED
            session.ended_at = _utcnow()
            text = "Shukriya, ustaad-ji. We have what we need for the Vault. Allah aap ko khush rakhe."
            action = InterviewerAction(
                kind=InterviewerActionKind.CLOSE_INTERVIEW,
                pass_id=current_pass.id,
                text_to_speak=text,
                text_to_speak_english=(
                    "Thank you, ustaad-ji. We have what we need for the Vault. "
                    "May God keep you in good health."
                ),
                rationale="All four passes complete; closing the interview.",
            )
            turn = self._record_turn(
                session=session,
                role=InterviewTurnRole.INTERVIEWER,
                text=text,
                language=session.primary_language,
                pass_id=current_pass.id,
            )
            return session, action, turn

        next_pass.status = PassStatus.IN_PROGRESS
        next_pass.started_at = _utcnow()
        next_def = get_pass_definition(next_pass.id)
        opening = opening_prompt(pass_def=next_def, primary_language=session.primary_language)
        action = InterviewerAction(
            kind=InterviewerActionKind.SAY_AND_ASK,
            pass_id=next_pass.id,
            text_to_speak=opening,
            text_to_speak_english=next_def.opening_text_en,
            rationale=f"Open the {next_def.title} pass.",
        )
        turn = self._record_turn(
            session=session,
            role=InterviewTurnRole.INTERVIEWER,
            text=action.text_to_speak,
            text_translated=action.text_to_speak_english,
            language=session.primary_language,
            pass_id=next_pass.id,
        )
        return session, action, turn

    @staticmethod
    def _next_pending_pass(session: InterviewSession, *, after: PassId) -> InterviewPass | None:
        seen = False
        for p in session.passes:
            if seen and p.status == PassStatus.PENDING:
                return p
            if p.id == after:
                seen = True
        return None

    # ── Bookkeeping ──────────────────────────────────────────────────────
    def _record_turn(
        self,
        *,
        session: InterviewSession,
        role: InterviewTurnRole,
        text: str,
        language: str,
        text_translated: str | None = None,
        audio_uri: str | None = None,
        timestamp_start_s: float | None = None,
        timestamp_end_s: float | None = None,
        asr_confidence: float | None = None,
        pass_id: PassId | None = None,
        coverage_targets: list[str] | None = None,
    ) -> InterviewTurn:
        pid = pass_id or (self._current_pass(session) or session.passes[0]).id
        turn = InterviewTurn(
            id=str(uuid.uuid4()),
            role=role,
            pass_id=pid,
            text=text,
            text_translated=text_translated,
            language=language,
            audio_uri=audio_uri,
            timestamp_start_s=timestamp_start_s,
            timestamp_end_s=timestamp_end_s,
            asr_confidence=asr_confidence,
            created_at=_utcnow(),
        )
        session.turn_count += 1
        history = self._history.setdefault(session.id, [])
        history.append(
            {
                "role": role.value,
                "lang": language,
                "text": text,
                "pass_id": pid.value,
                "coverage_targets": ",".join(coverage_targets or []),
            }
        )
        return turn

    def _last_interviewer_targets(self, session_id: str) -> list[str]:
        for h in reversed(self._history.get(session_id, [])):
            if h["role"] == "interviewer":
                raw = h.get("coverage_targets") or ""
                return [t for t in raw.split(",") if t]
        return []

    @staticmethod
    def _is_meaningful_answer(text: str) -> bool:
        cleaned = (text or "").strip()
        if len(cleaned) < 4:
            return False
        # Reject "ha", "no", "pata nahi" style turns.
        weak = {"ha", "haan", "no", "nahi", "nai", "yes", "ok", "pata nahi", "yaad nahi"}
        return cleaned.lower() not in weak

    def get_summary(self, session: InterviewSession) -> str:
        coverage = {
            p.id.value: f"{int(p.coverage_ratio * 100)}%" for p in session.passes
        }
        flagged = len(session.flagged_turns)
        return (
            f"Session {session.id} ({session.state.value}). "
            f"{session.turn_count} turns. Coverage: {coverage}. "
            f"{flagged} turn(s) flagged for human review."
        )


_singleton: InterviewEngine | None = None


def get_interview_engine() -> InterviewEngine:
    global _singleton
    if _singleton is None:
        _singleton = InterviewEngine()
    return _singleton
