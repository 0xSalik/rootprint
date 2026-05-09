# Hunarmand API: Integration & Handoff Guide

This document serves as the master integration guide for the **Hunarmand Backend (A2 Scope)**. It details what has been built, the blocking dependencies required from the core data team (A1), and how the Frontend (Track B) and AI (Track L) teams should interact with the current endpoints.

---

## 1. What Has Been Built (A2 Scope)

The following components are fully functional and available via the FastAPI server running on `http://127.0.0.1:8000/docs`:

* **Sanad Trust Engine (`backend/sanad/`)**
  * `crypto.py`: Ed25519 cryptographic signature generation and verification using `PyNaCl`.
  * `qr_engine.py`: Dynamic QR code generation for physical product tags.
* **Commerce & Provenance Routers (`backend/routers/`)**
  * `sanad.py`: Endpoints to fetch a piece's metadata, verify its signature, and download its QR tag.
  * `ustaad.py`: Endpoints to fetch available living-museum workshops and submit bookings.
  * `bazaar.py`: A checkout endpoint that integrates **Stripe Connect** (test mode) to calculate total costs, extract the 8% platform fee, and route the payout to the artisan.
* **Hackathon Ops (`backend/scripts/`)**
  * `reset_demo.py`: A panic-button script that generates a fresh Ed25519 keypair, signs a dummy "Craft DNA" payload, and seeds the database for the *Kanihama Pashmina* live pitch.

---

## 2. Pending Blockers: What We Need From Track A1

Currently, the A2 endpoints use mock JSON data. To finalize the backend, **Person A1** must deliver the following:

1. **SQLAlchemy Database Models**
   * We need the exact table definitions for `Sanad`, `Workshop`, `Booking`, and `Order`. Once provided, we will swap the mock dictionaries in `sanad.py` and `ustaad.py` with actual `db.query()` calls.
2. **Database Dependency Injection**
   * A1 must provide a `get_db()` FastAPI dependency so A2 can inject the database session into the router endpoints.
3. **Authentication Layer**
   * A1 is building the Phone-OTP auth. We need a `Depends(get_current_user)` dependency from A1 to lock down the `/api/bazaar/checkout` and `/api/ustaad/book` endpoints so only verified users can spend money.
4. **Live `DATABASE_URL`**
   * A1 needs to provision the Postgres DB (with `pgvector`) on Railway/Render and provide the connection string so A2 can handle the DevOps deployment.

---

## 3. Guide for Track B (Frontend Team)

Team B can start building the Next.js UI immediately. The API contract is locked.

### How to test:
1. Ensure the backend is running: `uvicorn backend.main:app --reload`
2. Open the Swagger UI: `http://127.0.0.1:8000/docs`

### Key Endpoints to Consume:
* **The Provenance Page:** Hit `GET /api/sanad/{sanad_id}`. This returns the Master Artisan's name, lineage, craft, and the `signature_hex`.
* **The QR Code Tag:** You can embed the QR code directly in an `<img>` tag by pointing the `src` to `http://127.0.0.1:8000/api/sanad/{sanad_id}/qr`.
* **The Checkout Button:** Send a `POST` request to `/api/bazaar/checkout` with `{"item_id": "string", "quantity": 1}`. 
  * *Note on Stripe:* The response contains `payment_gateway.checkout_url`. In your Next.js app, simply do a `window.location.href = response.payment_gateway.checkout_url` to redirect the user to the Stripe checkout page!

---

## 4. Guide for Track L (AI / Crypto Team)

The AI team is responsible for interviewing the master artisan and generating the "Craft DNA" JSON payload. 

### The Signature Contract
When Track L generates the Craft DNA, they MUST sign it using the Artisan's private key before sending it to the database. 

The payload must be passed to A2's `verify` endpoint in the following format:
```json
POST /api/sanad/verify
{
  "public_key_hex": "the_artisans_ed25519_public_key_in_hex",
  "signature_hex": "the_signature_generated_by_nacl",
  "metadata": {
    "artisan": "Mohammad Yusuf",
    "technique": "1940s Srinagar Knot",
    "materials": "Gurez Valley Wool"
  }
}
```
* **Critical:** A2's `crypto.py` uses canonical JSON sorting (`sort_keys=True`) before verifying the signature. Track L must ensure they also canonicalize the JSON string identically before signing it, otherwise the verification will fail.
