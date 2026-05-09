"""The **Craft DNA** schema.

This is the single most important data structure in Hunarmand. Everything
else — the Sanad, the directory, "Ask the Hunarmand", the workshop
curriculum — is generated from a Craft DNA file.

The schema is deliberately deep enough to capture *tacit* knowledge,
not just biographical surface data:

* ``Technique``: a named technique with a stepwise process graph and
  failure modes — the "how"
* ``Tool``: physical instruments referenced in techniques, with regional names
* ``EnvironmentalTuning``: how the master adjusts for season / humidity /
  light / temperature — the kind of knowledge that is normally invisible
* ``DecisionRule``: tacit if-then heuristics (``"how do you know the wool
  is good?"``) — the highest-value layer
* ``SupplierLink``: who supplies what, from where, in which season, and why
* ``LineageNode``: who taught whom — anchors the master in a verifiable
  multi-generational chain
* ``FailureLog``: failed experiments and what they taught — almost never
  recorded anywhere, captures decades of tacit calibration

Every nested object is ``id``-addressable so it can be cited by the
"Ask the Hunarmand" RAG with stable references.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, model_validator


# ── Common -------------------------------------------------------------------

NonEmptyStr = Annotated[str, StringConstraints(min_length=1, strip_whitespace=True)]
LangCode = Annotated[
    str, StringConstraints(min_length=2, max_length=8, pattern=r"^[a-zA-Z][a-zA-Z0-9_-]+$")
]


class _Base(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        str_strip_whitespace=True,
        populate_by_name=True,
        use_enum_values=True,
    )


class Citation(_Base):
    """A pointer back to the exact moment in the master's recorded video
    where a piece of knowledge was first stated. Every Craft-DNA leaf
    that an LLM extracts MUST carry at least one citation, otherwise
    ``Ask the Hunarmand`` cannot quote the master.
    """

    chunk_id: NonEmptyStr
    pass_id: NonEmptyStr
    timestamp_start_s: float = Field(ge=0)
    timestamp_end_s: float = Field(ge=0)
    quote: NonEmptyStr = Field(
        description="A short verbatim excerpt from the master's transcript supporting this datum."
    )
    language: LangCode = Field(default="ks")

    @model_validator(mode="after")
    def _check_timestamps(self) -> Citation:
        if self.timestamp_end_s < self.timestamp_start_s:
            raise ValueError("timestamp_end_s must be >= timestamp_start_s")
        return self


class Confidence(str, Enum):
    """Calibrated confidence label used by the extractor and downstream UIs."""

    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


# ── Identity & lineage --------------------------------------------------------


class MasterIdentity(_Base):
    """Public-facing identity of the master.

    The artisan controls which fields become visible on their Sanad
    profile. Internal fields stay in the Vault.
    """

    full_name: NonEmptyStr
    name_in_koshur: NonEmptyStr | None = None
    pen_name: NonEmptyStr | None = None
    craft_category: NonEmptyStr = Field(
        description=(
            "Top-level craft, e.g. 'pashmina_weaving', 'sozni_embroidery', "
            "'kani_weaving', 'naqashi_papier_mache', 'walnut_wood_carving', "
            "'khatamband', 'crewel', 'namda', 'copperware'."
        )
    )
    village: NonEmptyStr | None = None
    district: NonEmptyStr | None = Field(
        default=None,
        description="J&K administrative district, e.g. 'Srinagar', 'Budgam', 'Pulwama'.",
    )
    workshop_address_public: str | None = None
    started_practising_year: int | None = Field(default=None, ge=1900, le=2100)
    generation_in_practice: int | None = Field(
        default=None, ge=1, le=20, description="1 = first generation, 4 = great-grandfather started"
    )
    bio_short: str | None = Field(default=None, max_length=480)


class LineageRelation(str, Enum):
    TAUGHT_BY = "taught_by"
    APPRENTICE_OF = "apprentice_of"
    PEER_OF = "peer_of"
    TAUGHT = "taught"
    SUCCESSOR = "successor"


class LineageNode(_Base):
    """One node in the master's lineage chain."""

    id: NonEmptyStr
    name: NonEmptyStr
    relation: LineageRelation
    village: str | None = None
    period_start_year: int | None = Field(default=None, ge=1700, le=2100)
    period_end_year: int | None = Field(default=None, ge=1700, le=2100)
    notes: str | None = Field(default=None, max_length=600)
    citations: list[Citation] = Field(default_factory=list)


# ── Tools, materials, suppliers ---------------------------------------------


class Tool(_Base):
    id: NonEmptyStr
    name_local: NonEmptyStr = Field(description="Tool name in Koshur / Urdu (transliterated).")
    name_english: NonEmptyStr | None = None
    description: NonEmptyStr
    used_for_techniques: list[NonEmptyStr] = Field(
        default_factory=list, description="IDs of techniques where this tool is critical."
    )
    citations: list[Citation] = Field(default_factory=list)


class MaterialKind(str, Enum):
    FIBRE = "fibre"
    DYE = "dye"
    WOOD = "wood"
    METAL = "metal"
    PIGMENT = "pigment"
    PAPER = "paper"
    THREAD = "thread"
    BINDER = "binder"
    OTHER = "other"


class Material(_Base):
    id: NonEmptyStr
    kind: MaterialKind
    name: NonEmptyStr
    grade: str | None = Field(
        default=None,
        description="Quality grade in artisan's own taxonomy, e.g. 'changthangi-grade-a'.",
    )
    typical_origin_region: str | None = None
    notes: str | None = Field(default=None, max_length=600)
    citations: list[Citation] = Field(default_factory=list)


class Trustworthiness(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    UNKNOWN = "unknown"


class SupplierLink(_Base):
    """A trusted supplier in the master's provenance graph.

    The point is *not* to leak supplier identities — by default this
    object stays inside the master's private Vault. The redacted form
    that flows into the public Sanad is generated separately.
    """

    id: NonEmptyStr
    supplier_name: NonEmptyStr
    village: str | None = None
    district: str | None = None
    materials_supplied: list[NonEmptyStr] = Field(
        description="IDs of Material objects this supplier provides."
    )
    seasonal_window: str | None = Field(
        default=None, description="E.g. 'late autumn (Oct–Nov)', 'spring shearing'."
    )
    relationship_years: int | None = Field(default=None, ge=0, le=120)
    trust: Trustworthiness = Trustworthiness.UNKNOWN
    notes: str | None = Field(default=None, max_length=600)
    public: bool = Field(
        default=False, description="Whether this supplier link can appear in the public Sanad."
    )
    citations: list[Citation] = Field(default_factory=list)


# ── Techniques --------------------------------------------------------------


class TechniqueStep(_Base):
    id: NonEmptyStr
    sequence: int = Field(ge=0)
    summary: NonEmptyStr
    detail: NonEmptyStr | None = None
    tools_used: list[NonEmptyStr] = Field(default_factory=list)
    materials_used: list[NonEmptyStr] = Field(default_factory=list)
    duration_minutes: float | None = Field(default=None, ge=0)
    common_mistakes: list[str] = Field(default_factory=list)
    citations: list[Citation] = Field(default_factory=list)


class Technique(_Base):
    id: NonEmptyStr
    name_local: NonEmptyStr
    name_english: NonEmptyStr | None = None
    summary: NonEmptyStr = Field(max_length=500)
    rarity: Confidence = Field(
        default=Confidence.MEDIUM,
        description=(
            "How rare is this technique in the wider corpus? Set HIGH if the "
            "extractor cannot find a parallel in any other Vault."
        ),
    )
    steps: list[TechniqueStep] = Field(default_factory=list, min_length=0)
    failure_modes: list[NonEmptyStr] = Field(default_factory=list)
    cultural_notes: str | None = Field(default=None, max_length=600)
    citations: list[Citation] = Field(default_factory=list)


# ── Tacit layers -------------------------------------------------------------


class EnvironmentalTuning(_Base):
    """How the master changes their process for season / humidity / etc."""

    id: NonEmptyStr
    factor: NonEmptyStr = Field(
        description="The variable, e.g. 'winter humidity', 'monsoon dampness', 'low light'."
    )
    affects_techniques: list[NonEmptyStr] = Field(default_factory=list)
    adjustment: NonEmptyStr = Field(description="What the master changes in response.")
    rationale: str | None = None
    citations: list[Citation] = Field(default_factory=list)


class DecisionRule(_Base):
    """A tacit if-then rule a master uses without thinking, e.g.

    ``IF wool feels brittle when rolled between thumb and forefinger
    THEN reject the lot — it has been over-dried.``
    """

    id: NonEmptyStr
    when: NonEmptyStr = Field(description="The triggering condition, in the master's own terms.")
    then: NonEmptyStr = Field(description="The action / decision taken.")
    why: str | None = Field(default=None, description="Master's stated rationale, if any.")
    domain: NonEmptyStr = Field(
        description="Where this rule applies, e.g. 'wool selection', 'colour matching'."
    )
    confidence: Confidence = Confidence.MEDIUM
    citations: list[Citation] = Field(default_factory=list)


class FailureLog(_Base):
    """A documented failure and its lesson — decades of tacit calibration."""

    id: NonEmptyStr
    title: NonEmptyStr
    description: NonEmptyStr
    year: int | None = Field(default=None, ge=1900, le=2100)
    technique_id: NonEmptyStr | None = None
    cause: str | None = None
    lesson: NonEmptyStr
    citations: list[Citation] = Field(default_factory=list)


# ── The root document --------------------------------------------------------


class CraftDNA(_Base):
    """The full Craft DNA file — a single master's institutional memory.

    The structure is intentionally **append-only** in semantics: when a
    field is updated, the previous value is preserved in the audit log
    on the database side. No part of a captured Vault is ever destroyed.
    """

    schema_version: str = Field(default="1.0.0")
    master_id: NonEmptyStr
    captured_at: datetime
    primary_language: LangCode = "ks"
    available_languages: list[LangCode] = Field(default_factory=lambda: ["ks", "ur", "en"])

    identity: MasterIdentity
    lineage: list[LineageNode] = Field(default_factory=list)

    techniques: list[Technique] = Field(default_factory=list)
    tools: list[Tool] = Field(default_factory=list)
    materials: list[Material] = Field(default_factory=list)
    suppliers: list[SupplierLink] = Field(default_factory=list)

    environmental_tunings: list[EnvironmentalTuning] = Field(default_factory=list)
    decision_rules: list[DecisionRule] = Field(default_factory=list)
    failure_logs: list[FailureLog] = Field(default_factory=list)

    # ── Cross-reference integrity ----------------------------------------
    @model_validator(mode="after")
    def _validate_references(self) -> CraftDNA:
        tool_ids = {t.id for t in self.tools}
        material_ids = {m.id for m in self.materials}
        technique_ids = {t.id for t in self.techniques}

        for technique in self.techniques:
            for step in technique.steps:
                for ref in step.tools_used:
                    if ref not in tool_ids:
                        raise ValueError(
                            f"Technique '{technique.id}' step '{step.id}' references "
                            f"unknown tool '{ref}'"
                        )
                for ref in step.materials_used:
                    if ref not in material_ids:
                        raise ValueError(
                            f"Technique '{technique.id}' step '{step.id}' references "
                            f"unknown material '{ref}'"
                        )

        for tool in self.tools:
            for ref in tool.used_for_techniques:
                if ref not in technique_ids:
                    raise ValueError(f"Tool '{tool.id}' references unknown technique '{ref}'")

        for supplier in self.suppliers:
            for ref in supplier.materials_supplied:
                if ref not in material_ids:
                    raise ValueError(
                        f"Supplier '{supplier.id}' references unknown material '{ref}'"
                    )

        for tuning in self.environmental_tunings:
            for ref in tuning.affects_techniques:
                if ref not in technique_ids:
                    raise ValueError(
                        f"Environmental tuning '{tuning.id}' references "
                        f"unknown technique '{ref}'"
                    )

        for failure in self.failure_logs:
            if failure.technique_id and failure.technique_id not in technique_ids:
                raise ValueError(
                    f"Failure log '{failure.id}' references unknown technique "
                    f"'{failure.technique_id}'"
                )

        return self

    # ── Vulnerability scoring ────────────────────────────────────────────
    def knowledge_vulnerability_index(self) -> float:
        """A 0..1 score indicating how much of this master's knowledge is
        at risk of being lost.

        Higher = more vulnerable. Drives the "emergency follow-up" queue
        in the Vault dashboard.
        """

        score = 0.0
        weight = 0.0

        # Techniques without complete steps are at high risk.
        for tech in self.techniques:
            weight += 1.0
            if not tech.steps:
                score += 1.0
            elif tech.rarity == Confidence.HIGH and len(tech.steps) < 3:
                score += 0.7
            elif len(tech.steps) < 2:
                score += 0.4

        # Decision rules are inherently tacit; few of them is a red flag
        # because every craft has dozens.
        weight += 1.0
        if len(self.decision_rules) == 0:
            score += 1.0
        elif len(self.decision_rules) < 5:
            score += 0.6

        # Failure log presence is a proxy for depth-of-capture.
        weight += 1.0
        if len(self.failure_logs) == 0:
            score += 0.8

        # Lineage chain incomplete?
        weight += 1.0
        if not any(n.relation == LineageRelation.TAUGHT_BY for n in self.lineage):
            score += 0.7

        return round(min(1.0, score / max(weight, 1.0)), 3)
