"""Translation — Koshur/Urdu/Hindi → English.

We default to LLM-based translation because (a) Koshur is genuinely
hard for off-the-shelf MT, (b) GPT-4o family models are surprisingly
strong on it, and (c) we already have the LLM client wired up. Bhashini
translation is supported as an alternative.
"""

from __future__ import annotations

import structlog

from ..config import get_settings
from ..llm.client import get_llm_client

log = structlog.get_logger(__name__)


class Translator:
    def __init__(self) -> None:
        self.settings = get_settings()

    async def translate(
        self,
        *,
        text: str,
        source_language: str,
        target_language: str = "en",
    ) -> str:
        if not text.strip():
            return ""
        if source_language == target_language:
            return text

        provider = self.settings.translation_provider
        if provider == "none":
            return text
        if provider == "llm":
            return await self._translate_llm(text, source_language, target_language)
        if provider == "bhashini":
            return await self._translate_bhashini(text, source_language, target_language)
        return text

    async def _translate_llm(self, text: str, source: str, target: str) -> str:
        """Translate via the configured LLM (OpenAI / OpenRouter / Anthropic)."""

        client = get_llm_client()
        system = (
            "You are a professional translator with deep familiarity in Kashmiri (Koshur), "
            "Urdu, Hindi, and English heritage-craft terminology (pashmina, sozni, kani, "
            "talim, naqashi, khatamband, walnut wood carving, papier-mâché, etc.).\n\n"
            "Translate exactly. Preserve named entities, place names, and craft-term loanwords. "
            "If a craft term has no clean English equivalent, keep the local term and add a "
            "short parenthetical gloss the first time it appears.\n\n"
            "Return only the translation. No commentary, no quotation marks around the whole "
            "translation."
        )
        user = (
            f"Source language: {source}\n"
            f"Target language: {target}\n\n"
            f"TEXT:\n{text}\n\nTRANSLATION:"
        )
        out = await client.generate(
            system=system,
            messages=[{"role": "user", "content": user}],
            model=self.settings.effective_translation_model,
            temperature=0.0,
            max_tokens=2048,
        )
        return out.strip()

    async def _translate_bhashini(self, text: str, source: str, target: str) -> str:
        # Skeleton: a real implementation would re-resolve the Bhashini
        # NMT pipeline analogous to the ASR provider. For the hackathon
        # we degrade to LLM translation when called.
        log.info("translator.bhashini.fallback_to_llm")
        return await self._translate_llm(text, source, target)


_singleton: Translator | None = None


def get_translator() -> Translator:
    global _singleton
    if _singleton is None:
        _singleton = Translator()
    return _singleton
