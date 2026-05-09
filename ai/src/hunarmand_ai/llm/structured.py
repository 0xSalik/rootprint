"""Generic structured-output helper.

Given a Pydantic model ``M``, returns an instance of ``M`` from the LLM,
with one repair retry on validation failure. The repair message contains
the original output plus the validation errors so the model can fix
itself.

We do not use the OpenAI SDK's ``parse()`` directly because we need
to support Anthropic on the same codepath and we want one consistent
repair loop.
"""

from __future__ import annotations

import json
from typing import TypeVar

import structlog
from pydantic import BaseModel, ValidationError

from .client import LLMClient, get_llm_client

T = TypeVar("T", bound=BaseModel)
log = structlog.get_logger(__name__)


class StructuredOutputError(RuntimeError):
    pass


def _schema_for_provider(model: type[BaseModel], provider: str) -> dict:
    """Build the response_format payload for the given provider."""
    schema = model.model_json_schema()
    if provider == "openai":
        return {
            "type": "json_schema",
            "json_schema": {
                "name": model.__name__,
                "schema": schema,
                "strict": False,
            },
        }
    return {"type": "json_object"}


def _strip_code_fence(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        # remove leading fence (with optional language tag) and trailing fence
        first_newline = text.find("\n")
        text = text[first_newline + 1 :] if first_newline != -1 else text[3:]
        if text.endswith("```"):
            text = text[:-3]
    return text.strip()


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
    """Force the LLM into ``output_model`` with one repair attempt."""

    llm = client or get_llm_client()
    response_format = _schema_for_provider(output_model, llm.provider)

    raw = await llm.generate(
        system=system,
        messages=messages,
        model=model,
        temperature=temperature,
        max_tokens=max_tokens,
        response_format=response_format,
    )

    try:
        parsed = json.loads(_strip_code_fence(raw))
    except json.JSONDecodeError as exc:
        log.warning("structured.parse.json_failed", error=str(exc), raw=raw[:400])
        return await _repair(
            output_model=output_model,
            system=system,
            messages=messages,
            previous_raw=raw,
            error=f"JSON decode error: {exc}",
            client=llm,
            model=model,
            max_tokens=max_tokens,
        )

    try:
        return output_model.model_validate(parsed)
    except ValidationError as exc:
        log.warning("structured.validate.failed", error=exc.errors())
        return await _repair(
            output_model=output_model,
            system=system,
            messages=messages,
            previous_raw=raw,
            error=str(exc.errors()),
            client=llm,
            model=model,
            max_tokens=max_tokens,
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
) -> T:
    repair_messages = [
        *messages,
        {
            "role": "assistant",
            "content": previous_raw,
        },
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
        response_format=_schema_for_provider(output_model, client.provider),
    )
    try:
        parsed = json.loads(_strip_code_fence(raw))
        return output_model.model_validate(parsed)
    except (json.JSONDecodeError, ValidationError) as exc:
        raise StructuredOutputError(
            f"LLM failed to produce valid {output_model.__name__} after repair: {exc}"
        ) from exc
