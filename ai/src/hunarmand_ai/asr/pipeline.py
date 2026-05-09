"""ASR fallback ladder.

The pipeline iterates the configured ladder, skipping unavailable
providers (``ASRUnavailableError``) and recording every attempt in
``fallback_chain``. The first provider whose transcript clears the
configured confidence threshold wins; otherwise the *highest-confidence*
attempt is returned with ``fallback_used=True``.

This means the pipeline always returns *something* — even on a
catastrophic ASR day we never silently drop a session. When everything
else fails we still surface partial transcripts to the operator with
clear notes for human review.
"""

from __future__ import annotations

import structlog

from ..config import Settings, get_settings
from ..schemas.asr import AsrProvider, AsrRequest, AsrResult
from .ai4bharat_provider import AI4BharatProvider
from .base import ASRProviderError, ASRUnavailableError
from .bhashini_provider import BhashiniProvider
from .groq_provider import GroqWhisperProvider
from .hf_inference_provider import HFInferenceProvider
from .manual_provider import ManualProvider
from .translator import Translator, get_translator
from .whisper_provider import WhisperProvider

log = structlog.get_logger(__name__)

# Above this confidence we accept the result and stop trying further
# rungs of the ladder.
ACCEPT_CONFIDENCE = 0.65


class ASRPipeline:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        self._providers = {
            AsrProvider.BHASHINI.value: BhashiniProvider(),
            AsrProvider.AI4BHARAT.value: AI4BharatProvider(),
            AsrProvider.GROQ.value: GroqWhisperProvider(),
            AsrProvider.HF_INFERENCE.value: HFInferenceProvider(),
            AsrProvider.WHISPER.value: WhisperProvider(),
            AsrProvider.MANUAL.value: ManualProvider(),
        }
        self._translator: Translator = get_translator()

    @property
    def ladder(self) -> list[str]:
        return self.settings.asr_ladder_list

    async def transcribe_audio(
        self,
        *,
        audio_path: str,
        language_hint: str | None = None,
        translate_to_english: bool = True,
        prefer_provider: AsrProvider | None = None,
    ) -> AsrResult:
        return await self._run(
            audio_path=audio_path,
            manual_text=None,
            language_hint=language_hint,
            translate_to_english=translate_to_english,
            prefer_provider=prefer_provider,
        )

    async def transcribe_manual(
        self,
        *,
        manual_text: str,
        language_hint: str | None = None,
        translate_to_english: bool = True,
        duration_s: float | None = None,
    ) -> AsrResult:
        provider: ManualProvider = self._providers[AsrProvider.MANUAL.value]  # type: ignore[assignment]
        result = await provider.transcribe_text(
            manual_text=manual_text, language_hint=language_hint, duration_s=duration_s
        )
        result.fallback_chain = [AsrProvider.MANUAL]
        if translate_to_english:
            await self._maybe_translate(result, language_hint)
        return result

    async def transcribe(self, req: AsrRequest) -> AsrResult:
        if not req.has_audio:
            raise ValueError("AsrRequest requires either audio_uri or audio_base64.")
        audio_path = req.audio_uri
        if not audio_path:
            raise ValueError("Hackathon path: provide audio_uri (a file path).")
        return await self.transcribe_audio(
            audio_path=audio_path,
            language_hint=req.language_hint,
            translate_to_english=req.translate_to_english,
            prefer_provider=req.prefer_provider,
        )

    # ── Internal ────────────────────────────────────────────────────────
    async def _run(
        self,
        *,
        audio_path: str | None,
        manual_text: str | None,
        language_hint: str | None,
        translate_to_english: bool,
        prefer_provider: AsrProvider | None,
    ) -> AsrResult:
        attempts: list[AsrResult] = []
        chain: list[AsrProvider] = []

        ladder = self._compute_ladder(prefer_provider)
        for name in ladder:
            provider = self._providers.get(name)
            if not provider or name == AsrProvider.MANUAL.value:
                # Manual rung is handled via ``transcribe_manual``.
                continue

            try:
                if not await provider.is_available():
                    log.info("asr.skip", provider=name, reason="unavailable")
                    continue
                if not audio_path:
                    continue
                result = await provider.transcribe(
                    audio_path=audio_path, language_hint=language_hint
                )
            except ASRUnavailableError as exc:
                log.info("asr.skip", provider=name, reason=str(exc))
                continue
            except ASRProviderError as exc:
                log.warning("asr.fail", provider=name, error=str(exc))
                chain.append(AsrProvider(name))
                continue
            except Exception as exc:  # noqa: BLE001
                log.warning("asr.unexpected", provider=name, error=str(exc))
                chain.append(AsrProvider(name))
                continue

            chain.append(AsrProvider(name))
            result.fallback_chain = list(chain)
            attempts.append(result)
            log.info(
                "asr.attempt",
                provider=name,
                confidence=result.confidence,
                language=result.language_detected,
            )
            if result.confidence >= ACCEPT_CONFIDENCE and result.text.strip():
                if translate_to_english:
                    await self._maybe_translate(result, language_hint)
                return result

        if attempts:
            best = max(attempts, key=lambda r: r.confidence)
            best.fallback_used = True
            best.notes = (best.notes or "") + (
                f" Best of {len(attempts)} provider attempts; below acceptance "
                f"threshold ({ACCEPT_CONFIDENCE})."
            )
            if translate_to_english:
                await self._maybe_translate(best, language_hint)
            return best

        # Total failure — return an empty manual placeholder so the caller
        # can prompt the facilitator to type the transcript.
        return AsrResult(
            provider=AsrProvider.MANUAL,
            language_detected=language_hint or self.settings.asr_default_language,
            text="",
            confidence=0.0,
            segments=[],
            duration_s=0.0,
            notes="No ASR provider produced output. Please use manual transcription.",
            fallback_used=True,
            fallback_chain=chain,
        )

    def _compute_ladder(self, prefer_provider: AsrProvider | None) -> list[str]:
        ladder = list(self.ladder)
        if prefer_provider and prefer_provider.value in ladder:
            ladder.remove(prefer_provider.value)
            ladder.insert(0, prefer_provider.value)
        return ladder

    async def _maybe_translate(self, result: AsrResult, language_hint: str | None) -> None:
        source = (result.language_detected or language_hint or "ks").split("-")[0]
        if source.lower() == "en" or not result.text:
            result.text_translated_en = result.text
            return
        try:
            result.text_translated_en = await self._translator.translate(
                text=result.text, source_language=source, target_language="en"
            )
        except Exception as exc:  # noqa: BLE001
            log.warning("translation.failed", source=source, error=str(exc))
            result.text_translated_en = None


_singleton: ASRPipeline | None = None


def get_asr_pipeline() -> ASRPipeline:
    global _singleton
    if _singleton is None:
        _singleton = ASRPipeline()
    return _singleton
