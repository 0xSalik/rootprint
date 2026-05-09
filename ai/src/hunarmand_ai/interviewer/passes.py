"""Definition of the 4 Vault passes — coverage targets, opening line,
and the slot keys the extractor will look for downstream.

The structure here is the *contract* between the Interview Engine and
the Craft DNA extractor: every coverage slot here corresponds to a
field path in ``CraftDNA``.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from ..schemas.interview import PassId


@dataclass(frozen=True)
class PassDefinition:
    pass_id: PassId
    title: str
    intent: str
    opening_text_en: str
    opening_text_ks: str
    coverage_required: list[str] = field(default_factory=list)
    pass_specific_guidance: str = ""
    min_turns: int = 4
    max_turns: int = 24
    target_techniques_per_session: int = 1
    must_probe: list[str] = field(default_factory=list)


PASS_DEFINITIONS: dict[PassId, PassDefinition] = {
    PassId.LINEAGE: PassDefinition(
        pass_id=PassId.LINEAGE,
        title="Lineage & Identity",
        intent=(
            "Establish who the master is, who taught them, where they work, "
            "and how many generations of practice are behind them. The output "
            "should let the directory build a verifiable lineage chain."
        ),
        opening_text_en=(
            "Assalamualaikum, ustaad-ji. Before we look at the work, I would like "
            "to learn about you and the elders who taught you. Please tell me your "
            "name, the village you work in, and who first put a needle (or kani, "
            "or chisel) in your hand."
        ),
        opening_text_ks=(
            "Assalamu alaikum, ustaad-jee. Pehle, kaam pyath wuchnay khoatre, "
            "boz me toihund naav, gaam, ti yim kal'aar zind chu yi hunar tohi sikhwoyov."
        ),
        coverage_required=[
            "identity.full_name",
            "identity.craft_category",
            "identity.village_or_district",
            "identity.started_practising_year",
            "identity.generation_in_practice",
            "lineage.taught_by.name",
            "lineage.taught_by.relation",
            "lineage.peer_or_apprentice.name",
        ],
        pass_specific_guidance=(
            "Be respectful of elder titles. If the master mentions a deceased "
            "teacher, acknowledge with a short blessing before continuing. "
            "Do NOT push for exact birth years if they hesitate."
        ),
        min_turns=4,
        max_turns=14,
        must_probe=["who taught you", "village", "generation"],
    ),
    PassId.TECHNIQUE: PassDefinition(
        pass_id=PassId.TECHNIQUE,
        title="Technique walkthrough",
        intent=(
            "Capture one full named technique end-to-end. Steps must be ordered, "
            "tools and materials must be named, durations approximated, and at "
            "least two common mistakes / failure modes recorded."
        ),
        opening_text_en=(
            "Now, ustaad-ji, please show me one technique you would teach a "
            "serious apprentice. We will go slowly. As you work, please describe "
            "what your hands are doing — the tool, the thread, the count — and I "
            "will follow."
        ),
        opening_text_ks=(
            "Hun, ustaad-jee, akh hunar wani me, yim tohi shagird hund pyath "
            "sikhowav. As'ee aase asaan asaan. Yim tohund hath karaan chu, su me "
            "boz — hatyaar, soot, ginti — me chu wuchaan."
        ),
        coverage_required=[
            "technique.name",
            "technique.steps[0].summary",
            "technique.steps[0].tools_used",
            "technique.steps[0].materials_used",
            "technique.steps[1].summary",
            "technique.steps[2].summary",
            "technique.failure_modes",
            "technique.duration_estimate",
        ],
        pass_specific_guidance=(
            "Probe for specifics: thread count, tool name in Koshur, hand "
            "position, knot count per inch, etc. If the master describes a step "
            "abstractly, ask 'show me how' and capture the literal motion. "
            "If the master uses a tool name we have not seen before, ask for "
            "spelling and a short description."
        ),
        min_turns=8,
        max_turns=30,
        must_probe=[
            "name of this stitch / knot / cut",
            "how long",
            "what mistake an apprentice usually makes here",
            "tool name",
        ],
    ),
    PassId.DECISIONS: PassDefinition(
        pass_id=PassId.DECISIONS,
        title="Tacit decision questions",
        intent=(
            "Surface tacit if-then rules: how does the master know the wool is "
            "good, when do they stop, what changes in winter, what mistake did "
            "their teacher correct most often. This is the single most "
            "valuable pass — capture rules an apprentice would never think to ask."
        ),
        opening_text_en=(
            "Now I want to ask the questions an apprentice never asks but should. "
            "How do you know — when you touch the wool — that the lot is right? "
            "What do you adjust when the air is cold and dry? Which mistake did "
            "your own teacher correct most often when you were young?"
        ),
        opening_text_ks=(
            "Hun me chu poshaan yim sawaal, yim koh shagird khabar mu chu poshaan. "
            "Tohi yutyim wool hath leg khathan, kati'aan zaaniv chuv soit theek? "
            "Sard ti khushk hawaa pyath kya badlaav karav? Tohund ustaad-ji kus "
            "ghalti chu ziyaad theek karaan?"
        ),
        coverage_required=[
            "decision.wool_or_material_quality",
            "decision.environmental_adjustment",
            "decision.most_common_apprentice_mistake",
            "decision.when_to_stop_or_redo",
            "decision.trustworthy_supplier_signals",
        ],
        pass_specific_guidance=(
            "Open-ended questions only. Encourage stories — the masters surface "
            "tacit rules best when they recall a specific lot, a specific season, "
            "a specific apprentice. After each answer, restate the rule in "
            "if-then form and ask for confirmation."
        ),
        min_turns=6,
        max_turns=20,
        must_probe=[
            "how do you know it is good",
            "what changes in winter / monsoon",
            "what mistake did your teacher correct most",
            "which signs make you walk away from a supplier",
        ],
    ),
    PassId.SUPPLIERS: PassDefinition(
        pass_id=PassId.SUPPLIERS,
        title="Material & supplier provenance",
        intent=(
            "Capture the supplier graph: where does the wool, dye, wood, pigment "
            "come from, in which season, how long has the relationship lasted, "
            "and which suppliers can be named publicly vs. kept private."
        ),
        opening_text_en=(
            "Last, ustaad-ji, I would like to learn where your materials come "
            "from. The wool, the dyes, the wood, the pigments. Which villages, "
            "which suppliers, which season. You can keep names private if you "
            "wish — just tell me the village and how long the relationship has "
            "been."
        ),
        opening_text_ks=(
            "Akhri, ustaad-jee, me chu zaaniv toihund maal kati'aan aatsh — soot, "
            "rang, kath, masala. Kya gaam, kus dukandaar, kya mausam. Naav lukhe "
            "rakhi heky, agar tohi raabita lath rakhne chuv."
        ),
        coverage_required=[
            "supplier.material_kind",
            "supplier.supplier_village",
            "supplier.seasonal_window",
            "supplier.relationship_years",
            "supplier.public_or_private",
        ],
        pass_specific_guidance=(
            "Default supplier visibility to PRIVATE. Only mark public if the "
            "master explicitly says it is OK to publish. Always confirm before "
            "closing the pass."
        ),
        min_turns=4,
        max_turns=14,
        must_probe=[
            "village",
            "season",
            "how long have you bought from them",
            "is it OK to mention them publicly",
        ],
    ),
}


def get_pass_definition(pass_id: PassId) -> PassDefinition:
    return PASS_DEFINITIONS[pass_id]


PASS_ORDER: list[PassId] = [
    PassId.LINEAGE,
    PassId.TECHNIQUE,
    PassId.DECISIONS,
    PassId.SUPPLIERS,
]
