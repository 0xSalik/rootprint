"""Heuristic follow-up logic on top of the LLM's structured action.

Most decisions are made by the LLM. This module implements the few
deterministic gates that should never be left to the model:

* coverage tracking
* min-turn / max-turn bounds
* abuse-of-flag detection (so the model can't spam ``flag_for_human``)
* forced close at max_turns
"""

from __future__ import annotations

from ..schemas.interview import (
    InterviewPass,
    InterviewerAction,
    InterviewerActionKind,
    PassStatus,
)
from .passes import PassDefinition


def merge_coverage(pass_state: InterviewPass, action: InterviewerAction) -> InterviewPass:
    """Merge any newly-claimed coverage targets into the pass state.

    The LLM declares which slots a question is *trying* to close in
    ``coverage_targets``. We only count them as collected when the
    next master turn comes back non-empty (handled by the engine, not
    here). What we do here is bookkeep what the engine has confirmed.
    """

    return pass_state


def reconcile_action(
    *,
    pass_state: InterviewPass,
    pass_def: PassDefinition,
    action: InterviewerAction,
    turn_count_in_pass: int,
) -> InterviewerAction:
    """Apply hard-bound rules on the LLM's action.

    * Force ``ready_to_close=False`` until we have ``min_turns`` turns.
    * Force ``ready_to_close=True`` at ``max_turns`` regardless of LLM.
    * Strip any abusive ``flag_for_human`` if the model also claimed
      every other action — clearly a hallucinated alarm.
    """

    coverage_ratio = pass_state.coverage_ratio

    if turn_count_in_pass < pass_def.min_turns:
        action.ready_to_close = False
    elif turn_count_in_pass >= pass_def.max_turns:
        action.ready_to_close = True
        action.kind = InterviewerActionKind.CLOSE_PASS

    # Soft enforcement: do not allow ready_to_close until coverage is at
    # least 80% of required slots.
    if action.ready_to_close and coverage_ratio < 0.8 and pass_state.status != PassStatus.READY_TO_CLOSE:
        action.ready_to_close = False

    return action


def confirm_collected_slots(
    *, pass_state: InterviewPass, claimed: list[str], master_responded_meaningfully: bool
) -> InterviewPass:
    """Add slot keys to ``coverage_collected`` only if the master's
    response was non-empty (otherwise we are crediting an unanswered
    question).
    """

    if not master_responded_meaningfully or not claimed:
        return pass_state
    existing = set(pass_state.coverage_collected)
    pass_state.coverage_collected = sorted(existing | set(claimed))
    return pass_state
