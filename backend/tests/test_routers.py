"""Smoke tests for the integrated router surface — proves all endpoints
register cleanly and that public, no-DB paths respond as expected.

We don't spin up Postgres here; the tests that need DB state live in
``test_pipeline_orchestration.py`` (uses respx for the AI core) and
A2's ``test_crypto.py`` (pure-function).
"""

from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app


def test_app_registers_all_v1_routes() -> None:
    paths = {r.path for r in app.routes if hasattr(r, "path")}
    expected = {
        "/",
        "/healthz",
        "/api/v1/auth/send-otp",
        "/api/v1/auth/verify-otp",
        "/api/v1/auth/me",
        "/api/v1/auth/masters",
        "/api/v1/media/presigned-url",
        "/api/v1/media/process-webhook",
        "/api/v1/search/techniques",
        "/api/v1/sanad/keys",
        "/api/v1/sanad/sign",
        "/api/v1/sanad/verify",
        "/api/v1/sanad/{sanad_id}",
        "/api/v1/sanad/{sanad_id}/qr",
        "/api/v1/ask",
        "/api/v1/commerce/workshops/{master_id}",
        "/api/v1/commerce/book",
        "/api/v1/commerce/checkout",
    }
    missing = expected - paths
    assert not missing, f"Missing expected routes: {missing}"


def test_root_responds() -> None:
    client = TestClient(app)
    r = client.get("/")
    assert r.status_code == 200
    body = r.json()
    assert body["docs"] == "/docs"


def test_send_otp_mocks_response() -> None:
    """The hackathon mock OTP path doesn't hit the DB — it just stores
    the phone -> '123456' in a process-local dict.
    """

    client = TestClient(app)
    r = client.post(
        "/api/v1/auth/send-otp", json={"phone": "+919999999999"}
    )
    assert r.status_code == 200
    assert "OTP" in r.json()["message"] or "otp" in r.json()["message"].lower()


def test_openapi_includes_commerce_and_sanad() -> None:
    client = TestClient(app)
    r = client.get("/api/v1/openapi.json")
    assert r.status_code == 200
    data = r.json()
    paths = data["paths"]
    assert "/api/v1/sanad/{sanad_id}" in paths
    assert "/api/v1/commerce/book" in paths
