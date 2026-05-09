"""Generic structured-output helper.

Given a Pydantic model ``M``, returns an instance of ``M`` from the LLM,
with one repair retry on validation failure.

Adaptive strategy
-----------------

Many free OpenRouter models don't support ``response_format={"type":
"json_schema"}``; some only support ``json_object``; a few support
neither. We pick the right one based on
``HUNARMAND_LLM_STRUCTURED_MODE`` and the active provider:

* ``schema``  - send full ``json_schema`` response_format (best when supported)
* ``json``    - send ``{"type": "json_object"}`` (works with most JSON-mode-capable models)
* ``prompt``  - no response_format; rely on prompt instructions + the repair loop
* ``auto``    - default: ``schema`` for ``openai``, ``json`` for ``openrouter``,
                ``json`` for ``anthropic``

If a request fails because the model rejects the response_format, we
automatically downgrade ``schema`` -> ``json`` -> ``prompt`` and retry
once at each level. This means the same code works against
``gpt-4o``, ``meta-llama/llama-3.3-70b-instruct:free``, and a tiny
``mistral-7b-instruct:free`` without code changes.
"""

from __future__ import annotations

import json
from typing import TypeVar

import structlog
from pydantic import BaseModel, ValidationError

from ..config import get_settings
from .client import LLMClient, get_llm_client

T = TypeVar("T", bound=BaseModel)
log = structlog.get_logger(__name__)


class StructuredOutputError(RuntimeError):
    pass


def _resolve_mode() -> str:
    settings = get_settings()
    mode = settings.llm_structured_mode
    if mode != "auto":
        return mode
    return {
        "openai": "schema",
        "openrouter": "json",
        "anthropic": "json",
    }.get(settings.llm_provider, "json")


def _response_format_for(mode: str, model: type[BaseModel]) -> dict | None:
    if mode == "schema":
        return {
            "type": "json_schema",
            "json_schema": {
                "name": model.__name__,
                "schema": model.model_json_schema(),
                "strict": False,
            },
        }
    if mode == "json":
        return {"type": "json_object"}
    return None


def _strip_code_fence(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        first_newline = text.find("\n")
        text = text[first_newline + 1 :] if first_newline != -1 else text[3:]
        if text.endswith("```"):
            text = text[:-3]
    return text.strip()


def _extract_json_object(text: str) -> str:
    """Locate the outermost JSON object inside arbitrary model text.

    Free models sometimes prepend "Here is the JSON:" or wrap the
    object in stray prose. We pull out the first balanced ``{...}``.
    """

    text = _strip_code_fence(text)
    if not text or text[0] == "{":
        return text
    start = text.find("{")
    if start < 0:
        return text
    depth = 0
    in_string = False
    escape = False
    for i in range(start, len(text)):
        ch = text[i]
        if escape:
            escape = False
            continue
        if ch == "\\":
            escape = True
            continue
        if ch == '"' and not escape:
            in_string = not in_string
            continue
        if in_string:
            continue
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return text[start : i + 1]
    return text[start:]


def _strengthen_system_for_prompt_mode(system: str, model: type[BaseModel]) -> str:
    schema_str = json.dumps(model.model_json_schema(), indent=2)
    return (
        f"{system}\n\n"
        "STRICT OUTPUT CONTRACT: respond with EXACTLY ONE JSON object that "
        f"validates against this JSON Schema (no prose, no commentary, no "
        f"code fences):\n```json\n{schema_str}\n```"
    )


async def generate_structured(
    *,
    output_model: type[T],
    system: str,
    messages: list[dict[str, str]],
    model: str | None = None,
    temperature: float | None = None,
    max_tokens: int = 2048,
    client: LLMClient | None = None,
) -> T:
    """Force the LLM into ``output_model`` with provider-aware response_format
    plus a structured repair retry on validation failure.
    """

    llm = client or get_llm_client()
    mode = _resolve_mode()

    # Try the configured mode first; on transport-level rejection of
    # response_format (HTTP 4xx referencing 'response_format' or
    # 'json_schema'), fall back through json -> prompt.
    sequence = [mode]
    if mode == "schema":
        sequence += ["json", "prompt"]
    elif mode == "json":
        sequence += ["prompt"]

    last_error: Exception | None = None
    for current_mode in sequence:
        rf = _response_format_for(current_mode, output_model)
        sys = (
            _strengthen_system_for_prompt_mode(system, output_model)
            if current_mode == "prompt"
            else system
        )
        try:
            raw = await llm.generate(
                system=sys,
                messages=messages,
                model=model,
                temperature=temperature,
                max_tokens=max_tokens,
                response_format=rf,
            )
        except Exception as exc:  # noqa: BLE001
            msg = str(exc).lower()
            if "response_format" in msg or "json_schema" in msg or "json_object" in msg:
                log.info(
                    "structured.mode.downgrade", from_mode=current_mode, error=str(exc)[:200]
                )
                last_error = exc
                continue
            raise

        try:
            parsed = json.loads(_extract_json_object(raw))
        except json.JSONDecodeError as exc:
            log.warning(
                "structured.parse.json_failed",
                error=str(exc),
                mode=current_mode,
                raw=raw[:300],
            )
            return await _repair(
                output_model=output_model,
                system=sys,
                messages=messages,
                previous_raw=raw,
                error=f"JSON decode error: {exc}",
                client=llm,
                model=model,
                max_tokens=max_tokens,
                response_format=rf,
            )

        try:
            return output_model.model_validate(parsed)
        except ValidationError as exc:
            log.warning(
                "structured.validate.failed", mode=current_mode, errors=exc.errors()[:3]
            )
            return await _repair(
                output_model=output_model,
                system=sys,
                messages=messages,
                previous_raw=raw,
                error=str(exc.errors()),
                client=llm,
                model=model,
                max_tokens=max_tokens,
                response_format=rf,
            )

    raise StructuredOutputError(
        f"All structured-output strategies failed: {last_error}"
    )


async def _repair(
    *,
    output_model: type[T],
    system: str,
    messages: list[dict[str, str]],
    previous_raw: str,
    error: str,
    client: LLMClient,
    model: str | None,
    max_tokens: int,
    response_format: dict | None,
) -> T:
    repair_messages = [
        *messages,
        {"role": "assistant", "content": previous_raw},
        {
            "role": "user",
            "content": (
                "Your previous response failed validation against the required schema:\n\n"
                f"ERRORS:\n{error}\n\n"
                "Return a corrected JSON object that exactly matches the schema. "
                "Do not include prose, code fences, or commentary. Only the JSON."
            ),
        },
    ]
    raw = await client.generate(
        system=system,
        messages=repair_messages,
        model=model,
        temperature=0.0,
        max_tokens=max_tokens,
        response_format=response_format,
    )
    try:
        parsed = json.loads(_extract_json_object(raw))
        return output_model.model_validate(parsed)
    except (json.JSONDecodeError, ValidationError) as exc:
        raise StructuredOutputError(
            f"LLM failed to produce valid {output_model.__name__} after repair: {exc}"
        ) from exc
