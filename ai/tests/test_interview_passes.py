"""Pass / prompt structure tests."""

from __future__ import annotations

from hunarmand_ai.interviewer.passes import PASS_DEFINITIONS, PASS_ORDER
from hunarmand_ai.interviewer.prompts import (
    opening_prompt,
    system_prompt_for_pass,
)
from hunarmand_ai.schemas.craft_dna import MasterIdentity
from hunarmand_ai.schemas.interview import PassId


def test_pass_order_covers_all_pass_ids() -> None:
    assert set(PASS_ORDER) == set(PassId)
    assert len(PASS_ORDER) == 4


def test_each_pass_has_min_max() -> None:
    for pid, defn in PASS_DEFINITIONS.items():
        assert defn.min_turns >= 1
        assert defn.max_turns >= defn.min_turns
        assert defn.coverage_required, f"Pass {pid} has empty coverage_required"


def test_opening_prompt_uses_koshur_when_primary() -> None:
    defn = PASS_DEFINITIONS[PassId.LINEAGE]
    text = opening_prompt(pass_def=defn, primary_language="ks")
    assert "ustaad" in text.lower()


def test_system_prompt_includes_schema_and_master() -> None:
    defn = PASS_DEFINITIONS[PassId.TECHNIQUE]
    identity = MasterIdentity(full_name="Mohammad Yusuf", craft_category="pashmina_weaving")
    prompt = system_prompt_for_pass(
        pass_def=defn,
        identity=identity,
        collected=[],
        primary_language="ks",
    )
    assert "InterviewerAction" in prompt
    assert "Mohammad Yusuf" in prompt
    assert "Coverage progress" in prompt


def test_followup_reconcile_respects_min_turns() -> None:
    from hunarmand_ai.interviewer.followup import reconcile_action
    from hunarmand_ai.schemas.interview import (
        InterviewPass,
        InterviewerAction,
        InterviewerActionKind,
        PassStatus,
    )

    pass_state = InterviewPass(
        id=PassId.LINEAGE,
        status=PassStatus.IN_PROGRESS,
        coverage_required=PASS_DEFINITIONS[PassId.LINEAGE].coverage_required,
    )
    action = InterviewerAction(
        kind=InterviewerActionKind.SAY_AND_ASK,
        pass_id=PassId.LINEAGE,
        text_to_speak="Aap kaha se hain?",
        rationale="ask village",
        ready_to_close=True,  # eager LLM
    )
    out = reconcile_action(
        pass_state=pass_state,
        pass_def=PASS_DEFINITIONS[PassId.LINEAGE],
        action=action,
        turn_count_in_pass=1,
    )
    assert out.ready_to_close is False  # forced down by min_turns
