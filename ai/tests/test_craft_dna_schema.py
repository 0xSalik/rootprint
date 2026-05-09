"""Craft DNA schema validation."""

from __future__ import annotations

from datetime import datetime, timezone

import pytest

from hunarmand_ai.schemas.craft_dna import (
    Citation,
    Confidence,
    CraftDNA,
    DecisionRule,
    EnvironmentalTuning,
    LineageNode,
    LineageRelation,
    Material,
    MaterialKind,
    MasterIdentity,
    SupplierLink,
    Technique,
    TechniqueStep,
    Tool,
    Trustworthiness,
)


def _cit(chunk_id: str = "c-1", quote: str = "...") -> Citation:
    return Citation(
        chunk_id=chunk_id,
        pass_id="technique",
        timestamp_start_s=0.0,
        timestamp_end_s=2.0,
        quote=quote,
    )


def _identity() -> MasterIdentity:
    return MasterIdentity(
        full_name="Mohammad Yusuf",
        craft_category="pashmina_weaving",
        village="Kanihama",
        generation_in_practice=4,
    )


def test_minimal_dna_validates() -> None:
    dna = CraftDNA(
        master_id="m-1",
        captured_at=datetime.now(timezone.utc),
        identity=_identity(),
    )
    assert dna.identity.craft_category == "pashmina_weaving"


def test_unknown_tool_reference_rejected() -> None:
    technique = Technique(
        id="t-1",
        name_local="kani-buti",
        summary="kani-stick weaving",
        rarity=Confidence.MEDIUM,
        steps=[
            TechniqueStep(
                id="s-1",
                sequence=0,
                summary="set warp",
                tools_used=["nope"],
                materials_used=[],
            )
        ],
    )
    with pytest.raises(ValueError, match="unknown tool"):
        CraftDNA(
            master_id="m-1",
            captured_at=datetime.now(timezone.utc),
            identity=_identity(),
            techniques=[technique],
        )


def test_unknown_material_reference_rejected() -> None:
    tool = Tool(id="tl-1", name_local="kani", description="wooden weaving stick")
    technique = Technique(
        id="t-1",
        name_local="kani-buti",
        summary="kani-stick weaving",
        steps=[
            TechniqueStep(
                id="s-1",
                sequence=0,
                summary="weave",
                tools_used=["tl-1"],
                materials_used=["bogus-material"],
            )
        ],
    )
    with pytest.raises(ValueError, match="unknown material"):
        CraftDNA(
            master_id="m-1",
            captured_at=datetime.now(timezone.utc),
            identity=_identity(),
            tools=[tool],
            techniques=[technique],
        )


def test_supplier_unknown_material_rejected() -> None:
    supplier = SupplierLink(
        id="sup-1",
        supplier_name="Changpa nomads",
        materials_supplied=["unknown-material"],
        trust=Trustworthiness.HIGH,
    )
    with pytest.raises(ValueError, match="unknown material"):
        CraftDNA(
            master_id="m-1",
            captured_at=datetime.now(timezone.utc),
            identity=_identity(),
            suppliers=[supplier],
        )


def test_environmental_tuning_unknown_technique_rejected() -> None:
    tuning = EnvironmentalTuning(
        id="env-1",
        factor="winter humidity",
        affects_techniques=["t-x"],
        adjustment="mist warp threads",
    )
    with pytest.raises(ValueError, match="unknown technique"):
        CraftDNA(
            master_id="m-1",
            captured_at=datetime.now(timezone.utc),
            identity=_identity(),
            environmental_tunings=[tuning],
        )


def test_vulnerability_index_high_when_empty() -> None:
    dna = CraftDNA(
        master_id="m-1",
        captured_at=datetime.now(timezone.utc),
        identity=_identity(),
    )
    score = dna.knowledge_vulnerability_index()
    assert 0.5 <= score <= 1.0


def test_vulnerability_index_lower_when_filled() -> None:
    tool = Tool(id="tl-1", name_local="kani", description="stick")
    material = Material(id="m-1m", kind=MaterialKind.FIBRE, name="pashmina wool")
    technique = Technique(
        id="t-1",
        name_local="kani-buti",
        summary="weaving",
        steps=[
            TechniqueStep(
                id="s-1", sequence=0, summary="setup",
                tools_used=["tl-1"], materials_used=["m-1m"],
            ),
            TechniqueStep(id="s-2", sequence=1, summary="weave"),
            TechniqueStep(id="s-3", sequence=2, summary="finish"),
        ],
        failure_modes=["snapped warp"],
    )
    dna_filled = CraftDNA(
        master_id="m-1",
        captured_at=datetime.now(timezone.utc),
        identity=_identity(),
        techniques=[technique],
        tools=[tool],
        materials=[material],
        decision_rules=[
            DecisionRule(
                id=f"d-{i}",
                when="wool feels brittle",
                then="reject lot",
                domain="wool selection",
                confidence=Confidence.HIGH,
            )
            for i in range(6)
        ],
        lineage=[
            LineageNode(id="ln-1", name="Father", relation=LineageRelation.TAUGHT_BY)
        ],
    )
    dna_empty = CraftDNA(
        master_id="m-1",
        captured_at=datetime.now(timezone.utc),
        identity=_identity(),
    )
    assert (
        dna_filled.knowledge_vulnerability_index()
        < dna_empty.knowledge_vulnerability_index()
    )
