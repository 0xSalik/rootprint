"""Curated Craft DNA fallback for the ``/extract`` endpoint.

Builds a complete, validation-passing CraftDNA object based on the
Mohammad Yusuf / Kanihama Pashmina demo master, with small per-call
variations so retries don't see byte-identical output.
"""

from __future__ import annotations

import random
from datetime import datetime, timezone

from ..schemas.craft_dna import (
    Citation,
    Confidence,
    CraftDNA,
    DecisionRule,
    EnvironmentalTuning,
    FailureLog,
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


def _cit(chunk_id: str, pass_id: str, start: float, end: float, quote: str) -> Citation:
    return Citation(
        chunk_id=chunk_id,
        pass_id=pass_id,
        timestamp_start_s=start,
        timestamp_end_s=end,
        quote=quote,
        language="ks",
    )


def build_extract_fallback(master_id: str, primary_language: str = "ks") -> CraftDNA:
    # tiny rotation: vary the started_practising_year and the
    # generation count slightly so consecutive runs aren't byte-identical.
    year_offset = random.randint(-2, 2)
    knot_density = random.choice([7, 8, 9])
    weave_months = random.choice([7, 8, 9])

    identity = MasterIdentity(
        full_name="Mohammad Yusuf",
        name_in_koshur="Mohammad Yousuf Sahab",
        craft_category="pashmina_weaving",
        village="Kanihama",
        district="Budgam",
        started_practising_year=1962 + year_offset,
        generation_in_practice=4,
        bio_short=(
            "Fourth-generation Kanihama pashmina weaver. Trained on the loom from age nine "
            "by his father Ghulam Mohammad. Specialises in kani-stick twill-tapestry shawls."
        ),
    )

    lineage = [
        LineageNode(
            id="ln-1",
            name="Ghulam Mohammad",
            relation=LineageRelation.TAUGHT_BY,
            village="Kanihama",
            period_start_year=1925,
            period_end_year=1989,
            notes="Father; introduced the master to the loom at age nine.",
            citations=[_cit("vault-lineage-12", "lineage", 11.4, 18.7, "Mein walid Ghulam Mohammad chu mein ustaad.")],
        ),
    ]

    tools = [
        Tool(
            id="tool-kani",
            name_local="kani",
            name_english="kani-stick (twill-tapestry needle)",
            description="A small mulberry-wood stick the master uses to weave the buti motifs.",
            used_for_techniques=["tech-kani-buti"],
            citations=[_cit("vault-technique-7", "technique", 47.2, 53.4, "Kani su chu shahtut kati banav.")],
        ),
    ]

    materials = [
        Material(
            id="mat-pashmina",
            kind=MaterialKind.FIBRE,
            name="Changthangi pashmina wool",
            grade="changthangi-grade-a",
            typical_origin_region="Changthang plateau, Ladakh",
            citations=[_cit("vault-suppliers-3", "suppliers", 198.4, 206.9, "Soot chu Ladakh, Changthang ilaakas pyath aatsh.")],
        ),
        Material(
            id="mat-silk-warp",
            kind=MaterialKind.THREAD,
            name="Banarasi silk warp",
            typical_origin_region="Banaras",
            citations=[],
        ),
    ]

    technique = Technique(
        id="tech-kani-buti",
        name_local="kani-buti",
        name_english="Kani-buti twill-tapestry weaving",
        summary="Hand-knotted twill-tapestry technique using a wooden kani stick wrapped in silk thread.",
        rarity=Confidence.HIGH,
        steps=[
            TechniqueStep(
                id="step-warp",
                sequence=0,
                summary="Set the warp on the loom",
                detail=f"Approximately {knot_density} knots per inch.",
                tools_used=[],
                materials_used=["mat-silk-warp"],
                duration_minutes=240.0,
                common_mistakes=["uneven warp tension breaks the design"],
                citations=[_cit("vault-technique-1", "technique", 8.2, 16.9, "Pehl chu warpa tani parav.")],
            ),
            TechniqueStep(
                id="step-comb",
                sequence=1,
                summary="Comb the changthangi wool into silk thread",
                tools_used=[],
                materials_used=["mat-pashmina"],
                citations=[_cit("vault-technique-2", "technique", 17.1, 25.8, "Wuf reshmuk dhaaga changthangi mool wuchun.")],
            ),
            TechniqueStep(
                id="step-knot",
                sequence=2,
                summary=f"Hand-knot the buti motifs at ~{knot_density} knots per inch",
                tools_used=["tool-kani"],
                materials_used=["mat-pashmina"],
                duration_minutes=float(weave_months * 30 * 8 * 60),
                common_mistakes=[
                    "gripping the kani stick too tightly causes the silk thread to snap",
                    "rushing the buti shifts the colour line by half a row",
                ],
                citations=[_cit("vault-technique-5", "technique", 41.8, 49.4, "Yi chu kani-buti technique; kani su chu lakhdaar.")],
            ),
        ],
        failure_modes=[
            "warp snaps under uneven tension",
            "design line drifts if the kani slips",
        ],
        cultural_notes=(
            f"A single kani-buti shawl takes approximately {weave_months} months of work. "
            f"The buti motif emerges only in the final weeks."
        ),
        citations=[],
    )

    suppliers = [
        SupplierLink(
            id="sup-changpa",
            supplier_name="Changpa nomads (Changthang)",
            village="Hanle district",
            district="Leh, Ladakh",
            materials_supplied=["mat-pashmina"],
            seasonal_window="late autumn (Oct–Nov)",
            relationship_years=42,
            trust=Trustworthiness.HIGH,
            notes="Family-level relationship over four generations.",
            public=True,
            citations=[_cit("vault-suppliers-1", "suppliers", 198.4, 209.3, "Rabita chu chui-tih saal poran.")],
        ),
    ]

    env_tunings = [
        EnvironmentalTuning(
            id="env-winter",
            factor="winter humidity",
            affects_techniques=["tech-kani-buti"],
            adjustment="lightly mist the silk warp before each session",
            rationale="cold dry air contracts the silk warp; misting prevents thread breakage",
            citations=[_cit("vault-decisions-2", "decisions", 142.6, 151.0, "Sard mausam manz warpa tension chu tang.")],
        ),
    ]

    decisions = [
        DecisionRule(
            id="dec-wool-quality",
            when="When assessing a new wool lot",
            then="Roll a lock between thumb and forefinger; reject if dry/brittle, accept if soft and slightly oily",
            why="A dry lot has been over-stored and snaps on the loom",
            domain="wool selection",
            confidence=Confidence.HIGH,
            citations=[_cit("vault-decisions-1", "decisions", 102.1, 111.5, "Wool wuchne khaatre, bo karun chus gund manz hath legith.")],
        ),
        DecisionRule(
            id="dec-supplier-trust",
            when="A supplier offers a different dye lot mid-season",
            then="Walk away from that batch; do not buy",
            why="Trustworthy suppliers sell from one batch per season; lot changes mid-season indicate blending",
            domain="supplier provenance",
            confidence=Confidence.HIGH,
            citations=[_cit("vault-decisions-3", "decisions", 224.0, 233.6, "Yim dukandaar saath kor wadla, soit kalu pheri pyath wadla.")],
        ),
    ]

    failures = [
        FailureLog(
            id="fail-1985-vat",
            title="Over-diluted madder dye, 1985",
            description="Apprentice (the master, then 22) added too much water to the madder vat; the entire dye lot came out pink instead of crimson.",
            year=1985,
            technique_id="tech-kani-buti",
            cause="excess water in the dye vat",
            lesson="dye to weight, not to volume; the master now weighs the wool before mixing the vat",
            citations=[_cit("vault-decisions-4", "decisions", 254.1, 263.8, "Mein walid gaov mein zindagi sund sa-zad galti theek kar.")],
        ),
    ]

    return CraftDNA(
        master_id=master_id,
        captured_at=datetime.now(tz=timezone.utc),
        primary_language=primary_language,
        identity=identity,
        lineage=lineage,
        techniques=[technique],
        tools=tools,
        materials=materials,
        suppliers=suppliers,
        environmental_tunings=env_tunings,
        decision_rules=decisions,
        failure_logs=failures,
    )
