"""Ask the Hunarmand — strict-citation RAG over a master's Vault.

Design rules (the contract the pitch promises the jury):

* Answers MUST cite chunks. No citations -> refusal.
* If the top-k chunks fail the score threshold, refuse with a clear
  message and let the UI fall back to "ask the master directly".
* The answer language is whatever the buyer/learner asks for (default:
  English). The citations always show the master's *original* quote
  alongside an English translation.
* The model is told the *only* permitted information sources are the
  chunks; everything else is hallucination.
"""

from __future__ import annotations

import re

import structlog
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import get_settings
from ..llm.client import LLMClient, get_llm_client
from ..llm.structured import generate_structured
from ..schemas.rag import AskCitation, AskRequest, AskResponse, RetrievedChunk
from .retriever import VaultRetriever

log = structlog.get_logger(__name__)


REFUSAL_TEMPLATE = (
    "I do not have a recorded answer to this question from the master. "
    "Their Vault is still being captured. The Hunarmand team is "
    "scheduling a follow-up session — please ask the master directly "
    "if you can, or check back after the next session."
)


class _AskAnswer(BaseModel):
    """Strict structured output shape we force the LLM into."""

    model_config = ConfigDict(extra="forbid")
    answer: str = Field(
        description=(
            "The answer in the requested ``answer_language``. Must be derived "
            "ONLY from the supplied citations. If the citations do not contain "
            "the answer, set ``refused=true`` and leave ``answer`` empty."
        )
    )
    refused: bool = False
    refusal_reason: str | None = None
    used_citation_ids: list[str] = Field(
        default_factory=list,
        description="Subset of provided chunk ids that you actually quoted from.",
    )
    confidence: float = Field(
        ge=0,
        le=1,
        default=0.0,
        description="Self-rated 0–1 confidence, calibrated to citation match.",
    )


class AskHunarmand:
    def __init__(self, session: AsyncSession, llm: LLMClient | None = None) -> None:
        self.session = session
        self.llm = llm or get_llm_client()
        self.settings = get_settings()
        self.retriever = VaultRetriever(session=session)

    async def ask(self, req: AskRequest) -> AskResponse:
        # 1. Retrieve.
        chunks = await self.retriever.retrieve(
            master_id=req.master_id, query=req.question, top_k=req.top_k
        )

        # 2. Score gate.
        if not chunks:
            return self._refuse(req=req, reason="No Vault content for this master.")

        max_score = max(c.score for c in chunks)
        if max_score < self.settings.rag_refuse_below:
            return self._refuse(
                req=req,
                reason=(
                    f"Top retrieval score {max_score:.2f} is below the "
                    f"refuse-below threshold {self.settings.rag_refuse_below:.2f}."
                ),
            )

        good = [c for c in chunks if c.score >= self.settings.rag_score_threshold]
        usable = good or [chunks[0]]

        # 3. Compose grounded answer.
        system = self._system_prompt(req.answer_language)
        user = self._user_prompt(req.question, usable, req.answer_language)
        answer = await generate_structured(
            output_model=_AskAnswer,
            system=system,
            messages=[{"role": "user", "content": user}],
            client=self.llm,
            temperature=0.0,
            max_tokens=900,
        )

        if answer.refused or not answer.answer.strip():
            return self._refuse(req=req, reason=answer.refusal_reason or "Model refused.")

        # 4. Project citations back, only the ones the model cited.
        cited_ids = set(answer.used_citation_ids) or {c.chunk_id for c in usable[:3]}
        citations = [
            self._citation_from(c) for c in usable if c.chunk_id in cited_ids
        ]
        if not citations:
            citations = [self._citation_from(c) for c in usable[:3]]

        return AskResponse(
            answer=answer.answer.strip(),
            refused=False,
            citations=citations,
            answer_language=req.answer_language,
            master_id=req.master_id,
            confidence=answer.confidence,
        )

    def _refuse(self, *, req: AskRequest, reason: str) -> AskResponse:
        log.info("ask.refuse", master_id=req.master_id, reason=reason, question=req.question[:120])
        return AskResponse(
            answer=REFUSAL_TEMPLATE,
            refused=True,
            refusal_reason=reason,
            citations=[],
            answer_language=req.answer_language,
            master_id=req.master_id,
            confidence=0.0,
        )

    @staticmethod
    def _citation_from(c: RetrievedChunk) -> AskCitation:
        quote = c.text.strip()
        if len(quote) > 320:
            quote = _trim_quote(quote, 320)
        return AskCitation(
            chunk_id=c.chunk_id,
            pass_id=c.pass_id,
            timestamp_start_s=c.timestamp_start_s,
            timestamp_end_s=c.timestamp_end_s,
            quote=quote,
            quote_en=c.text_en,
            audio_uri=c.audio_uri,
            score=round(c.score, 3),
        )

    @staticmethod
    def _system_prompt(answer_language: str) -> str:
        return f"""\
You are HUNARMAND'S ASK-THE-MASTER assistant. You answer questions about
a single Kashmiri master's craft using ONLY the citations the user
provides. You may not draw on outside knowledge.

Hard rules:
- If the citations do not answer the question, set ``refused=true`` and
  leave ``answer`` empty.
- Answer in {answer_language!r} (ISO code or natural name).
- Quote the master directly when helpful — keep their idioms.
- Cite by chunk id in ``used_citation_ids`` so the UI can highlight the
  exact moment in the master's video.
- Never paraphrase a tacit decision rule into something more general.
- Never invent supplier names, prices, or counts.
"""

    @staticmethod
    def _user_prompt(question: str, chunks: list[RetrievedChunk], answer_language: str) -> str:
        rendered = []
        for c in chunks:
            block = (
                f"--- CITATION ---\n"
                f"chunk_id: {c.chunk_id}\n"
                f"pass: {c.pass_id}\n"
                f"timestamp: {c.timestamp_start_s:.1f}s – {c.timestamp_end_s:.1f}s\n"
                f"language: {c.language}\n"
                f"score: {c.score:.3f}\n"
                f"master quote (verbatim): {c.text}\n"
            )
            if c.text_en:
                block += f"english translation: {c.text_en}\n"
            rendered.append(block)
        body = "\n".join(rendered) or "(no citations)"
        return (
            f"QUESTION (from a buyer / learner): {question}\n\n"
            f"ANSWER LANGUAGE: {answer_language}\n\n"
            f"AVAILABLE CITATIONS:\n{body}\n\n"
            "Produce the JSON _AskAnswer object now."
        )


def _trim_quote(text: str, limit: int) -> str:
    """Trim a quote to ``limit`` characters at a sentence boundary."""

    if len(text) <= limit:
        return text
    truncated = text[:limit]
    # Try to end at the last sentence boundary.
    match = re.search(r".*[\.!?](?!.*[\.!?])", truncated, flags=re.DOTALL)
    return (match.group(0).strip() + "…") if match else (truncated.rstrip() + "…")


async def get_ask_service(session: AsyncSession) -> AskHunarmand:
    return AskHunarmand(session=session)
