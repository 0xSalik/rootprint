"""AI core HTTP client — happy path + error mapping."""

from __future__ import annotations

import pytest
import respx
from httpx import Response

from app.clients.ai_core import AICoreClient, AICoreError


@pytest.mark.asyncio
@respx.mock
async def test_healthz_ok() -> None:
    respx.get("http://ai-core.test/healthz").mock(
        return_value=Response(200, json={"status": "ok", "version": "0.1.0"})
    )
    out = await AICoreClient(base_url="http://ai-core.test").healthz()
    assert out["status"] == "ok"


@pytest.mark.asyncio
@respx.mock
async def test_embed_returns_vectors() -> None:
    respx.post("http://ai-core.test/embed").mock(
        return_value=Response(
            200,
            json={
                "provider": "local",
                "model": "intfloat/multilingual-e5-small",
                "dimensions": 384,
                "embeddings": [[0.1] * 384, [0.2] * 384],
            },
        )
    )
    out = await AICoreClient(base_url="http://ai-core.test").embed(["a", "b"])
    assert out["dimensions"] == 384
    assert len(out["embeddings"]) == 2
    assert len(out["embeddings"][0]) == 384


@pytest.mark.asyncio
@respx.mock
async def test_4xx_raises_aicoreerror() -> None:
    respx.post("http://ai-core.test/embed").mock(
        return_value=Response(400, json={"detail": "bad"})
    )
    with pytest.raises(AICoreError):
        await AICoreClient(base_url="http://ai-core.test").embed(["a"])


@pytest.mark.asyncio
@respx.mock
async def test_sanad_sign_forwards_payload() -> None:
    captured: dict = {}

    def _capture(request):
        import json

        captured.update(json.loads(request.content))
        return Response(200, json={"qr_string": "h.p.s"})

    respx.post("http://ai-core.test/sanad/sign").mock(side_effect=_capture)
    out = await AICoreClient(base_url="http://ai-core.test").sanad_sign(
        master_id="m-1",
        payload={"sanad_id": "S-1", "piece_id": "P-1"},
        include_qr_image=True,
    )
    assert out["qr_string"] == "h.p.s"
    assert captured["master_id"] == "m-1"
    assert captured["payload"]["sanad_id"] == "S-1"
    assert captured["include_qr_image"] is True


@pytest.mark.asyncio
@respx.mock
async def test_ask_passes_top_k_only_when_provided() -> None:
    captured: dict = {}

    def _capture(request):
        import json

        captured.update(json.loads(request.content))
        return Response(200, json={"answer": "...", "refused": False, "citations": [], "master_id": "m-1", "answer_language": "en", "confidence": 0.5})

    respx.post("http://ai-core.test/ask").mock(side_effect=_capture)
    await AICoreClient(base_url="http://ai-core.test").ask(
        master_id="m-1", question="why?", answer_language="en"
    )
    assert "top_k" not in captured

    captured.clear()
    await AICoreClient(base_url="http://ai-core.test").ask(
        master_id="m-1", question="why?", top_k=3
    )
    assert captured["top_k"] == 3
