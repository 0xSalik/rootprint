"""Multi-stage Craft DNA extractor.

Pipeline:

    1. **Identity + Lineage** (from LINEAGE pass transcripts)
    2. **Techniques + Tools + Materials** (from TECHNIQUE pass)
    3. **Decisions + Env tunings + Failures** (from DECISIONS pass)
    4. **Suppliers** (from SUPPLIERS pass)
    5. **Stitch** into a final ``CraftDNA`` and validate cross-references

Each stage uses ``generate_structured`` so the output is already
schema-validated. If a stage produces invalid references (e.g. a step
points to an unknown tool) the final stitch step removes the broken
reference rather than failing — the rest of the Vault is still useful.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Literal

import structlog
from pydantic import BaseModel, ConfigDict, Field

from ..llm.client import LLMClient, get_llm_client
from ..llm.structured import generate_structured
from ..schemas.craft_dna import (
    CraftDNA,
    DecisionRule,
    EnvironmentalTuning,
    FailureLog,
    LineageNode,
    Material,
    MasterIdentity,
    SupplierLink,
    Technique,
    Tool,
)
from .prompts import (
    EXTRACTOR_SYSTEM,
    stage_prompt_decisions,
    stage_prompt_identity_and_lineage,
    stage_prompt_suppliers,
    stage_prompt_techniques,
)

log = structlog.get_logger(__name__)


PassChunk = dict[str, Any]


def _utcnow() -> datetime:
    return datetime.now(tz=timezone.utc)


# ── Stage envelopes (Pydantic) ----------------------------------------------


class _IdentityStage(BaseModel):
    model_config = ConfigDict(extra="forbid")
    identity: MasterIdentity
    lineage: list[LineageNode] = Field(default_factory=list)


class _TechniqueStage(BaseModel):
    model_config = ConfigDict(extra="forbid")
    techniques: list[Technique] = Field(default_factory=list)
    tools: list[Tool] = Field(default_factory=list)
    materials: list[Material] = Field(default_factory=list)


class _DecisionStage(BaseModel):
    model_config = ConfigDict(extra="forbid")
    decision_rules: list[DecisionRule] = Field(default_factory=list)
    environmental_tunings: list[EnvironmentalTuning] = Field(default_factory=list)
    failure_logs: list[FailureLog] = Field(default_factory=list)


class _SupplierStage(BaseModel):
    model_config = ConfigDict(extra="forbid")
    suppliers: list[SupplierLink] = Field(default_factory=list)


# ── Extractor ---------------------------------------------------------------


class CraftDNAExtractor:
    def __init__(self, llm: LLMClient | None = None) -> None:
        self._llm = llm or get_llm_client()

    async def extract(
        self,
        *,
        master_id: str,
        primary_language: str,
        chunks_by_pass: dict[Literal["lineage", "technique", "decisions", "suppliers"], list[PassChunk]],
    ) -> CraftDNA:
        identity_stage = await self._stage_identity(chunks_by_pass.get("lineage", []))
        technique_stage = await self._stage_techniques(chunks_by_pass.get("technique", []))
        decision_stage = await self._stage_decisions(
            chunks_by_pass.get("decisions", []),
            technique_ids=[t.id for t in technique_stage.techniques],
        )
        supplier_stage = await self._stage_suppliers(
            chunks_by_pass.get("suppliers", []),
            material_ids=[m.id for m in technique_stage.materials],
        )

        dna = self._stitch(
            master_id=master_id,
            primary_language=primary_language,
            identity_stage=identity_stage,
            technique_stage=technique_stage,
            decision_stage=decision_stage,
            supplier_stage=supplier_stage,
        )
        return dna

    # ── Stage 1 ─────────────────────────────────────────────────────────
    async def _stage_identity(self, chunks: list[PassChunk]) -> _IdentityStage:
        if not chunks:
            return _IdentityStage(
                identity=MasterIdentity(full_name="Unknown Master", craft_category="unknown")
            )
        prompt = stage_prompt_identity_and_lineage(_render_chunks(chunks))
        return await generate_structured(
            output_model=_IdentityStage,
            system=EXTRACTOR_SYSTEM,
            messages=[{"role": "user", "content": prompt}],
            client=self._llm,
            temperature=0.0,
            max_tokens=2000,
        )

    # ── Stage 2 ─────────────────────────────────────────────────────────
    async def _stage_techniques(self, chunks: list[PassChunk]) -> _TechniqueStage:
        if not chunks:
            return _TechniqueStage()
        prompt = stage_prompt_techniques(_render_chunks(chunks))
        return await generate_structured(
            output_model=_TechniqueStage,
            system=EXTRACTOR_SYSTEM,
            messages=[{"role": "user", "content": prompt}],
            client=self._llm,
            temperature=0.0,
            max_tokens=4000,
        )

    # ── Stage 3 ─────────────────────────────────────────────────────────
    async def _stage_decisions(
        self, chunks: list[PassChunk], *, technique_ids: list[str]
    ) -> _DecisionStage:
        if not chunks:
            return _DecisionStage()
        prompt = stage_prompt_decisions(_render_chunks(chunks), technique_ids)
        return await generate_structured(
            output_model=_DecisionStage,
            system=EXTRACTOR_SYSTEM,
            messages=[{"role": "user", "content": prompt}],
            client=self._llm,
            temperature=0.0,
            max_tokens=3000,
        )

    # ── Stage 4 ─────────────────────────────────────────────────────────
    async def _stage_suppliers(
        self, chunks: list[PassChunk], *, material_ids: list[str]
    ) -> _SupplierStage:
        if not chunks:
            return _SupplierStage()
        prompt = stage_prompt_suppliers(_render_chunks(chunks), material_ids)
        return await generate_structured(
            output_model=_SupplierStage,
            system=EXTRACTOR_SYSTEM,
            messages=[{"role": "user", "content": prompt}],
            client=self._llm,
            temperature=0.0,
            max_tokens=2500,
        )

    # ── Stitch ─────────────────────────────────────────────────────────
    def _stitch(
        self,
        *,
        master_id: str,
        primary_language: str,
        identity_stage: _IdentityStage,
        technique_stage: _TechniqueStage,
        decision_stage: _DecisionStage,
        supplier_stage: _SupplierStage,
    ) -> CraftDNA:
        # First: filter cross-references that don't resolve.
        tool_ids = {t.id for t in technique_stage.tools}
        material_ids = {m.id for m in technique_stage.materials}
        technique_ids = {t.id for t in technique_stage.techniques}

        clean_techniques: list[Technique] = []
        for t in technique_stage.techniques:
            for step in t.steps:
                step.tools_used = [tid for tid in step.tools_used if tid in tool_ids]
                step.materials_used = [mid for mid in step.materials_used if mid in material_ids]
            clean_techniques.append(t)

        clean_tools: list[Tool] = []
        for tool in technique_stage.tools:
            tool.used_for_techniques = [
                tid for tid in tool.used_for_techniques if tid in technique_ids
            ]
            clean_tools.append(tool)

        clean_env: list[EnvironmentalTuning] = []
        for tuning in decision_stage.environmental_tunings:
            tuning.affects_techniques = [
                tid for tid in tuning.affects_techniques if tid in technique_ids
            ]
            clean_env.append(tuning)

        clean_failures: list[FailureLog] = []
        for fl in decision_stage.failure_logs:
            if fl.technique_id and fl.technique_id not in technique_ids:
                fl.technique_id = None
            clean_failures.append(fl)

        clean_suppliers: list[SupplierLink] = []
        for sup in supplier_stage.suppliers:
            sup.materials_supplied = [
                mid for mid in sup.materials_supplied if mid in material_ids
            ]
            if not sup.materials_supplied:
                # supplier with no resolvable materials is dropped.
                continue
            clean_suppliers.append(sup)

        try:
            dna = CraftDNA(
                master_id=master_id,
                captured_at=_utcnow(),
                primary_language=primary_language,
                identity=identity_stage.identity,
                lineage=identity_stage.lineage,
                techniques=clean_techniques,
                tools=clean_tools,
                materials=technique_stage.materials,
                suppliers=clean_suppliers,
                environmental_tunings=clean_env,
                decision_rules=decision_stage.decision_rules,
                failure_logs=clean_failures,
            )
        except Exception as exc:
            log.error("extractor.stitch.failed", error=str(exc))
            raise
        return dna


def _render_chunks(chunks: list[PassChunk]) -> str:
    """Render transcript chunks for an LLM prompt with stable identifiers.

    Each chunk is annotated with ``chunk_id``, ``pass_id``, and timing
    so the LLM can produce valid citations.
    """

    rendered: list[str] = []
    for c in chunks:
        line = (
            f"[chunk_id={c.get('chunk_id')} pass_id={c.get('pass_id')} "
            f"start={c.get('timestamp_start_s', 0):.1f}s "
            f"end={c.get('timestamp_end_s', 0):.1f}s "
            f"lang={c.get('language', 'ks')}]\n"
            f"{c.get('text', '')}\n"
        )
        if c.get("text_en"):
            line += f"(EN translation) {c['text_en']}\n"
        rendered.append(line)
    return "\n".join(rendered) or "(no transcripts)"


_singleton: CraftDNAExtractor | None = None


def get_extractor() -> CraftDNAExtractor:
    global _singleton
    if _singleton is None:
        _singleton = CraftDNAExtractor()
    return _singleton
