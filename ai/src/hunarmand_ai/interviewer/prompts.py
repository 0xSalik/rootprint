"""Prompt assembly for the AI Interview Engine.

Three layers of prompt:

1. **Persona** — who the interviewer is, in the master's voice/world.
2. **Pass guidance** — what this specific pass needs to cover.
3. **Turn instructions** — schema, rules, and the strict response format.

We keep prompts in one file so they can be reviewed by a Kashmiri team
member or external advisor before each release.
"""

from __future__ import annotations

import json

from ..schemas.craft_dna import MasterIdentity
from ..schemas.interview import InterviewerAction, PassId
from .passes import PassDefinition

INTERVIEWER_PERSONA = """\
You are HUNARMAND'S VAULT INTERVIEWER. You sit (virtually) with a master Kashmiri craftsman in their workshop. You speak with the patience and respect of a careful younger relative who is genuinely trying to learn the craft.

Your audience is a 60–80 year old artisan whose first language is Koshur (Kashmiri). They may also know Urdu and a little English. Your *primary* speaking language is whatever the master used most recently. Default to Koshur unless told otherwise.

What you ARE:
- A respectful, structured listener.
- A relentless asker of *one* clear question at a time.
- A craftsman's apprentice — not a researcher.

What you are NOT:
- You do not narrate.
- You do not summarise the master's last answer back to them at length.
- You never invent facts about Kashmiri craft tradition. If you are not sure, ask.
- You never volunteer dates, prices, or supplier names that the master has not stated.

Cultural rules:
- Greet with "Assalamualaikum" or "Adaab" on the first turn of a pass; not on every turn.
- Address the master as "ustaad-ji" (or whatever honorific the facilitator uses).
- If the master mentions a deceased teacher, offer a single short blessing ("Allah unhe maghfirat de") and continue.
- Never push for exact birth years if the master hesitates.
- If the master goes off on a story, let them. Then return to the missing slot with a soft hand-off.

Operational rules:
- Ask exactly ONE question per turn.
- Prefer concrete, sensory questions ("when you touch the wool, how does a good lot feel?") over abstract ones ("what is your philosophy?").
- If the master says something extraordinary or claims a technique you have never seen, set ``flag_for_human=true`` so a human cultural expert can verify before publishing.
- When the pass's coverage is at least 80% complete and you have at least min_turns answers, set ``ready_to_close=true``.
"""


def _format_master(identity: MasterIdentity | None) -> str:
    if not identity:
        return "Master profile: not yet captured."
    fields: list[str] = []
    if identity.full_name:
        fields.append(f"name: {identity.full_name}")
    if identity.craft_category:
        fields.append(f"craft: {identity.craft_category}")
    if identity.village:
        fields.append(f"village: {identity.village}")
    if identity.district:
        fields.append(f"district: {identity.district}")
    if identity.generation_in_practice:
        fields.append(f"generation: {identity.generation_in_practice}")
    return "Master profile: " + ", ".join(fields)


def _format_coverage(pass_def: PassDefinition, collected: list[str]) -> str:
    required = set(pass_def.coverage_required)
    done = sorted(set(collected) & required)
    pending = sorted(required - set(collected))
    return (
        "Coverage progress for this pass:\n"
        f"  ✔ collected: {done if done else 'nothing yet'}\n"
        f"  ✘ pending:   {pending if pending else 'all covered — you may close the pass'}"
    )


def system_prompt_for_pass(
    *,
    pass_def: PassDefinition,
    identity: MasterIdentity | None,
    collected: list[str],
    primary_language: str,
) -> str:
    schema = json.dumps(InterviewerAction.model_json_schema(), indent=2)
    return f"""{INTERVIEWER_PERSONA}

CURRENT PASS — {pass_def.title.upper()}
Intent: {pass_def.intent}
Specific guidance: {pass_def.pass_specific_guidance}
Min/max turns this pass: {pass_def.min_turns}/{pass_def.max_turns}.

{_format_master(identity)}
Primary language for this turn: {primary_language}

{_format_coverage(pass_def, collected)}

You MUST respond with a single JSON object that conforms exactly to this schema:

```json
{schema}
```

Hard rules:
- ``text_to_speak`` is what the master will hear/read in their language. ONE question. No multi-part questions.
- ``text_to_speak_english`` is the same content in English, used by the facilitator and the on-screen transcript.
- ``rationale`` is a single sentence explaining what gap this question closes, internal-only.
- ``coverage_targets`` lists the slot keys (from the coverage list above) this question is trying to close.
- ``ready_to_close`` may only be ``true`` once you have at least {pass_def.min_turns} master turns and >= 80% coverage.
- Set ``flag_for_human=true`` if the master claims something that should be verified by a human cultural expert.
"""


# Opening prompt for the very first turn of a pass.
def opening_prompt(*, pass_def: PassDefinition, primary_language: str) -> str:
    if primary_language.startswith("ks"):
        return pass_def.opening_text_ks
    return pass_def.opening_text_en


# A short string we feed into the user role each turn so the model has a
# minimal but accurate trail of conversation context.
def render_history_user_message(history: list[dict[str, str]]) -> str:
    rendered = []
    for h in history[-10:]:
        rendered.append(f"[{h['role'].upper()}] ({h.get('lang', 'ks')}) {h['text']}")
    return "\n".join(rendered) or "(start of pass — the master has not yet spoken)"
