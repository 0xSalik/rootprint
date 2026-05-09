"""Prompts for the Craft DNA extractor.

We extract in stages instead of asking the LLM to fill the whole tree
in one shot. Each stage produces a small, focused JSON object that we
later stitch into the final ``CraftDNA``. This:

* keeps each LLM call within a manageable token budget,
* makes per-stage debugging trivial,
* matches the natural shape of the 4 interview passes.

Every leaf object the LLM produces carries citations (``chunk_id``,
``timestamp_start_s``, ``timestamp_end_s``, ``quote``). If it cannot
cite, it must omit the leaf — not invent it.
"""

from __future__ import annotations

EXTRACTOR_SYSTEM = """\
You are HUNARMAND'S CRAFT DNA EXTRACTOR. Your job is to convert the raw
transcripts of a Vault interview with a Kashmiri master craftsman into
strict, machine-readable structured data.

Hard rules:
- Use ONLY information present in the transcripts. Never invent.
- Every datum (lineage node, technique, decision rule, supplier, etc.)
  MUST cite the transcript chunk it came from. Citations include
  ``chunk_id``, ``pass_id``, ``timestamp_start_s``, ``timestamp_end_s``,
  ``quote`` (a short verbatim excerpt from the transcript), and ``language``.
- If a slot is genuinely not in the transcripts, omit it. Do not write
  "unknown" or fabricate a placeholder.
- Quotes must be verbatim. Never paraphrase inside a citation.
- Use stable ``id`` values for cross-referencing (e.g. tools and
  techniques reference each other by id).
- Honour cultural sensitivity: do not publish supplier names without
  the master's consent — set ``public=false`` unless the transcript
  explicitly says it can be public.
"""


def stage_prompt_identity_and_lineage(transcripts: str) -> str:
    return f"""\
TASK: From the LINEAGE pass transcripts below, extract a JSON object with:
- ``identity``: a ``MasterIdentity`` matching the schema (name, craft, village, district, generation, started_practising_year, bio_short).
- ``lineage``: a list of ``LineageNode`` objects (taught_by, peers, predecessors, successors, etc.).

TRANSCRIPTS:
{transcripts}

Return JSON of shape::

    {{
      "identity": MasterIdentity,
      "lineage": [LineageNode, ...]
    }}
"""


def stage_prompt_techniques(transcripts: str) -> str:
    return f"""\
TASK: From the TECHNIQUE pass transcripts below, extract one or more
``Technique`` objects, plus the ``tools`` and ``materials`` they reference.

TRANSCRIPTS:
{transcripts}

Return JSON::

    {{
      "techniques": [Technique, ...],
      "tools": [Tool, ...],
      "materials": [Material, ...]
    }}

Rules:
- Steps in a technique must be ORDERED via the ``sequence`` field, starting at 0.
- Reference tools and materials by their ``id`` from the same response.
- ``rarity`` is HIGH only if the master suggests this technique is rare or theirs alone.
- ``failure_modes`` lists 1-line descriptions of common mistakes the master mentions.
"""


def stage_prompt_decisions(transcripts: str, technique_ids: list[str]) -> str:
    techs = ", ".join(technique_ids) if technique_ids else "(no techniques captured yet)"
    return f"""\
TASK: From the DECISIONS pass transcripts below, extract:

- ``decision_rules``: tacit if-then rules in the master's own terms.
- ``environmental_tunings``: how the master adjusts for season/humidity/light.
- ``failure_logs``: documented failures and lessons learned, if any.

TRANSCRIPTS:
{transcripts}

Known technique ids you may reference: {techs}.

Return JSON::

    {{
      "decision_rules": [DecisionRule, ...],
      "environmental_tunings": [EnvironmentalTuning, ...],
      "failure_logs": [FailureLog, ...]
    }}

Rules:
- ``DecisionRule.when`` and ``then`` should be quoted as closely as possible to the master's words.
- For each environmental tuning, link to known technique ids if applicable.
- A failure log without a clear lesson should be omitted.
"""


def stage_prompt_suppliers(transcripts: str, material_ids: list[str]) -> str:
    mats = ", ".join(material_ids) if material_ids else "(no materials captured yet)"
    return f"""\
TASK: From the SUPPLIERS pass transcripts below, extract a list of
``SupplierLink`` objects.

TRANSCRIPTS:
{transcripts}

Known material ids you may reference: {mats}.

Return JSON::

    {{
      "suppliers": [SupplierLink, ...]
    }}

Rules:
- ``public`` defaults to false. Only set true if the master EXPLICITLY says it is OK to publish.
- ``materials_supplied`` references material ids; if you cannot match a stated material to a known id, omit the link rather than guess.
- ``trust`` should be set conservatively — UNKNOWN unless the master clearly states a trust assessment.
"""
