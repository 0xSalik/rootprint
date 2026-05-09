# Team Handover Document

This document outlines how the **Backend (Track A)** integrates with the
**Frontend (Track B)** and the **AI core (Lead track)**, and how Person A2
should proceed with the Commerce features.

---

## Quick start (laptop demo, no Redis)

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -e '.[dev]'

cp .env.example .env
# edit .env:
#   HUNARMAND_DATABASE_URL=postgresql+asyncpg://...neon.tech/hunarmand   (NO ?sslmode=require)
#   AI_CORE_URL=https://<your-username>-hunarmand-ai.hf.space
#   SECRET_KEY=<random 32+ bytes>
#   RUN_INLINE_TASKS=1                                                   # use FastAPI BackgroundTasks instead of Celery
#   BACKEND_CORS_ORIGINS=http://localhost:3000,https://hunarmand.vercel.app

# First-time only: bring the schema up to date
alembic upgrade head

uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
# Browse http://127.0.0.1:8000/docs
```

If `RUN_INLINE_TASKS=1` (the default) the backend processes uploaded
Vault media inside FastAPI's BackgroundTasks — **no Celery worker, no
Redis required for the demo.** The frontend contract is identical to
the Celery path.

To use the production Celery path instead:

```bash
# Terminal 1: Redis
docker run --rm -p 6379:6379 redis:7

# Terminal 2: Celery worker
celery -A app.worker.celery_app.celery_app worker --loglevel=info -Q main-queue

# Terminal 3: API
RUN_INLINE_TASKS=0 uvicorn app.main:app --host 127.0.0.1 --port 8000
```

---

## For Track B (Frontend Team)

### API endpoints overview

The backend is FastAPI. Interactive docs: `http://127.0.0.1:8000/docs`.

**The original A1 contract is unchanged.** New endpoints are additive.

### 1. Authentication flow (Phone OTP)

Mock OTP system for the hackathon.

**Step A — request OTP:**

```http
POST /api/v1/auth/send-otp
Content-Type: application/json
{ "phone": "+919999999999" }
```
*OTP is hardcoded to `123456`.*

**Step B — verify & login:**

```http
POST /api/v1/auth/verify-otp
Content-Type: application/json
{ "phone": "+919999999999", "otp": "123456" }
```

Returns `{ access_token, token_type }`. **Save the token** in `localStorage`
or a cookie. For protected requests:

```
Authorization: Bearer <your_access_token>
```

### 2. Media upload flow (S3 bypass)

The frontend uploads large video files directly to S3 / Cloudflare R2.

**Step A — get a pre-signed URL** (`Authorization` required):

```http
POST /api/v1/media/presigned-url
Content-Type: application/json
{ "filename": "video.mp4", "content_type": "video/mp4" }
```

Returns `url`, `s3_key`, `vault_id`.

**Step B — upload to S3:** `PUT` the raw file to `url`.

**Step C — trigger processing:**

```http
POST /api/v1/media/process-webhook
Content-Type: application/json
{ "vault_id": "<vault_id>", "s3_key": "<s3_key>" }
```

Response now includes a `mode` field (`"inline"` or `"celery"`) so the
frontend can show a different toast in dev. The actual pipeline runs
asynchronously; poll the Vault by id (or check `status`) to know when
the CraftDNA row is ready.

### 3. Semantic search — `GET /api/v1/search/techniques?query=...&limit=5`

Same response shape as before:

```json
[
  {
    "id": "uuid",
    "master_id": "uuid",
    "technique_name": "Kani-buti weaving",
    "translated_transcript": "...",
    "similarity_score": 0.83
  }
]
```

What changed under the hood: the query is now embedded by the AI core
(real model — `intfloat/multilingual-e5-small` by default — instead of
A1's stub random vector). Ranking is real now.

### 4. Sanad — `/api/v1/sanad/*`  (NEW)

Cryptographic provenance, proxied to the AI core.

**Generate keypair (auth required, master mints in own name):**

```http
POST /api/v1/sanad/keys
Authorization: Bearer <token>
Content-Type: application/json
{ "version": 1 }
```

Returns `{ master_id, key_version, public_key_b64, kid }`.

**Sign a piece (auth required):**

```http
POST /api/v1/sanad/sign
Authorization: Bearer <token>
Content-Type: application/json
{
  "payload": {
    "sanad_id": "KNH-PSH-2025-0042",
    "piece_id": "shawl-2025-0042",
    "craft_category": "pashmina_weaving",
    "completed_on": "2025-04-12T00:00:00+00:00",
    "issued_at": "2025-04-13T00:00:00+00:00",
    "lineage": { "master_id": "<uuid>", "master_name": "Mohammad Yusuf" },
    "short_summary": "Kani-buti pashmina shawl, 4th-gen Kanihama lineage."
  },
  "include_qr_image": true
}
```

Returns `{ header, payload, signature, qr_string, qr_image_base64, public_url }`.
Embed `qr_image_base64` directly in `<img src="data:image/png;base64,..." />`.

**Verify a scanned QR (no auth — public):**

```http
POST /api/v1/sanad/verify
Content-Type: application/json
{ "qr_string": "<the JWS-style string from the QR>" }
```

Returns `{ valid: true|false, sanad_id, master_id, master_name, payload }`.

### 5. Ask the Hunarmand — `POST /api/v1/ask`  (NEW)

RAG-grounded Q&A about a master's Vault (citations include video timestamps).

```http
POST /api/v1/ask
Content-Type: application/json
{
  "master_id": "<uuid>",
  "question": "How does the master adjust warp tension in winter?",
  "answer_language": "en"
}
```

Returns the AI core's `AskResponse` shape: `{ answer, refused, citations, master_id, confidence, ... }`.

If the corpus does not contain a grounded answer, `refused: true` is set
and `answer` carries the canonical refusal message — the frontend should
display the refusal verbatim and offer to schedule a follow-up Vault
session with the master.

### 6. Health — `GET /healthz`  (NEW)

```json
{
  "status": "ok",
  "project": "Hunarmand API",
  "embedding_dim": 384,
  "run_inline_tasks": true,
  "ai_core": {
    "reachable": true,
    "url": "https://...hf.space",
    "version": "0.1.0",
    "asr_ladder": [...]
  }
}
```

Use this for a "system status" badge in the frontend admin view.

---

## For Track A (Person A2 — Commerce & Sanad)

Person A1 scaffolded the schema. Track A2's Commerce work is still
open: `Workshop` bookings, `Bundle` and `Order` checkout, and the
storefront read endpoints. The Sanad layer is now **wired through**
to the AI core via `/api/v1/sanad/*` — A2 should focus on commerce.

### Where to start

1. Create `app/api/endpoints/commerce.py` for workshop bookings and bazaar checkout.
2. Register it in `app/api/api.py` (`api_router.include_router(commerce.router, prefix="/commerce", tags=["commerce"])`).
3. The auth dep (`get_current_master`) is already wired — workshops/bundles owned by the JWT-authenticated master.

### Why we share the DB with the AI core

The AI core service (deployed on HF Spaces) and this backend service
(deployed wherever you choose — Vercel functions, a small Fly.io VM,
your laptop) **both connect to the same Neon Postgres**. Tables
`vault_chunks` and `master_keys` are read/written by the AI core;
all other tables are owned by the backend. There's no cross-service
RPC for shared state — Postgres is the contract.

---

## Architecture cheatsheet

```
                 ┌───────────────────────────────┐
                 │        Vercel frontend         │
                 └──────────────┬────────────────┘
                                │  HTTPS
                                ▼
                 ┌───────────────────────────────┐
                 │       Backend (this repo)      │
                 │  • auth (JWT)                  │
                 │  • S3 presigned uploads        │
                 │  • semantic search (pgvector)  │
                 │  • Sanad proxy                 │
                 │  • Ask the Hunarmand proxy     │
                 │  • commerce (A2, in progress)  │
                 └─────────┬─────────────┬───────┘
                           │             │
                  HTTPS ── │             │ ── asyncpg
                           ▼             ▼
                ┌──────────────────┐  ┌──────────────────┐
                │   AI core (HF)   │  │   Neon Postgres  │
                │  • ASR ladder    │  │  + pgvector       │
                │  • Craft DNA     │  └──────────────────┘
                │  • Embeddings    │
                │  • RAG / Ask     │
                │  • Sanad signer  │
                └──────────────────┘
```
