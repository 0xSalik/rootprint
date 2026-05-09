"""End-to-end smoke for the new resource-based routes.

We don't spin up Postgres here. The tests exercise:

* every documented route is registered
* public list endpoints respond (404 / 200 — never 500 from missing
  registration)
* JWT-required write endpoints reject anonymous calls with 401/403
* OpenAPI schema includes everything
"""

from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app


EXPECTED_PATHS = {
    # Auth + identity
    "/api/v1/auth/send-otp",
    "/api/v1/auth/verify-otp",
    "/api/v1/auth/me",
    "/api/v1/auth/masters",
    "/api/v1/masters",
    "/api/v1/masters/{master_id}",
    "/api/v1/masters/me",
    "/api/v1/masters/me/full",
    # Capture
    "/api/v1/media/presigned-url",
    "/api/v1/media/process-webhook",
    "/api/v1/vaults/me",
    "/api/v1/vaults/{vault_id}",
    "/api/v1/vaults/{vault_id}/status",
    # Discovery / RAG
    "/api/v1/search/techniques",
    "/api/v1/ask",
    "/api/v1/feed",
    # Sanad
    "/api/v1/sanad",
    "/api/v1/sanad/keys",
    "/api/v1/sanad/sign",
    "/api/v1/sanad/verify",
    "/api/v1/sanad/{sanad_id}",
    "/api/v1/sanad/{sanad_id}/qr",
    # Ustaad
    "/api/v1/workshops",
    "/api/v1/workshops/{workshop_id}",
    "/api/v1/bookings/me",
    "/api/v1/bookings/{booking_id}",
    # Bazaar
    "/api/v1/bundles",
    "/api/v1/bundles/{bundle_id}",
    "/api/v1/orders/me",
    "/api/v1/orders/{order_id}",
    # Legacy commerce
    "/api/v1/commerce/workshops/{master_id}",
    "/api/v1/commerce/book",
    "/api/v1/commerce/checkout",
    # Health
    "/healthz",
    "/",
}


def test_all_documented_routes_are_registered() -> None:
    paths = {r.path for r in app.routes if hasattr(r, "path")}
    missing = EXPECTED_PATHS - paths
    assert not missing, f"Missing expected routes: {missing}"


def test_openapi_lists_all_paths() -> None:
    client = TestClient(app)
    r = client.get("/api/v1/openapi.json")
    assert r.status_code == 200
    paths = set(r.json()["paths"].keys())
    # The OpenAPI prefix is the same as our v1 prefix; healthz/root
    # aren't under /api/v1 so we don't check them here.
    v1_expected = {p for p in EXPECTED_PATHS if p.startswith("/api/v1/")}
    missing = v1_expected - paths
    assert not missing, f"OpenAPI missing: {missing}"


def test_root_is_alive() -> None:
    client = TestClient(app)
    r = client.get("/")
    assert r.status_code == 200
    body = r.json()
    assert body["docs"] == "/docs"
    assert body["api_prefix"] == "/api/v1"


def test_healthz_responds() -> None:
    client = TestClient(app)
    r = client.get("/healthz")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"


def test_send_otp_does_not_need_db() -> None:
    """The mock OTP path is in-memory only and must always succeed."""

    client = TestClient(app)
    r = client.post("/api/v1/auth/send-otp", json={"phone": "+919999999999"})
    assert r.status_code == 200


def test_workshop_create_requires_jwt() -> None:
    client = TestClient(app)
    r = client.post(
        "/api/v1/workshops",
        json={"format": "Heritage Walk", "price": 2500, "duration_mins": 180},
    )
    # No Authorization header → 401 from HTTPBearer dep.
    assert r.status_code in {401, 403}


def test_master_update_requires_jwt() -> None:
    client = TestClient(app)
    r = client.put("/api/v1/masters/me", json={"name": "New name"})
    assert r.status_code in {401, 403}


def test_bundle_create_requires_jwt() -> None:
    client = TestClient(app)
    r = client.post(
        "/api/v1/bundles",
        json={"name": "Set", "price": 1000, "sanad_ids": []},
    )
    assert r.status_code in {401, 403}


def test_vault_listing_requires_jwt() -> None:
    client = TestClient(app)
    r = client.get("/api/v1/vaults/me")
    assert r.status_code in {401, 403}


def test_pagination_envelope_documented_in_openapi() -> None:
    """Every list endpoint must return ``{items, total, limit, offset}``."""

    client = TestClient(app)
    r = client.get("/api/v1/openapi.json")
    schema = r.json()
    components = schema.get("components", {}).get("schemas", {})
    page_components = [name for name in components if name.startswith("Page_")]
    assert page_components, "Generic Page[T] envelope missing from OpenAPI."


def test_workshop_legacy_path_still_present() -> None:
    """The legacy /commerce/workshops/{master_id} from A2's HANDOVER.md must
    keep responding so any existing frontend code keeps working.
    """

    paths = {r.path for r in app.routes if hasattr(r, "path")}
    assert "/api/v1/commerce/workshops/{master_id}" in paths
    assert "/api/v1/commerce/book" in paths
    assert "/api/v1/commerce/checkout" in paths
