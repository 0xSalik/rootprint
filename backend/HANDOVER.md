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

### Live API

* **Base URL (Render):** `https://hunarmand-backend.onrender.com`
* **Interactive docs:** `https://hunarmand-backend.onrender.com/docs`
* **OpenAPI JSON:** `https://hunarmand-backend.onrender.com/api/v1/openapi.json`

In Vercel, set `NEXT_PUBLIC_HUNARMAND_API=https://hunarmand-backend.onrender.com`.

### Conventions

* All v1 paths live under `/api/v1`.
* JSON body for all POST/PUT bodies; multipart only on `/media/presigned-url` upload.
* `Authorization: Bearer <jwt>` for any endpoint marked **JWT** below.
* Every list endpoint accepts `?limit=20&offset=0` and returns
  `{ "items": [...], "total": N, "limit": L, "offset": O }`.
* Every UUID-bearing field is a string in JSON.

### Endpoint reference

#### Auth (mock OTP — `123456` always works)
| Method | Path | Auth | Body / Query |
|---|---|---|---|
| POST | `/api/v1/auth/send-otp` | — | `{ "phone": "+91…" }` |
| POST | `/api/v1/auth/verify-otp` | — | `{ "phone": "+91…", "otp": "123456" }` → `{ access_token, token_type }` |
| GET  | `/api/v1/auth/me` | JWT | own profile |
| GET  | `/api/v1/auth/masters` | — | list of all masters (legacy) |

#### Masters (artisan directory)
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET  | `/api/v1/masters` | — | `?q=<text>&location=<text>&limit=&offset=` |
| GET  | `/api/v1/masters/{id}` | — | public profile |
| GET  | `/api/v1/masters/me/full` | JWT | own profile incl. phone |
| PUT  | `/api/v1/masters/me` | JWT | `{ name?, lineage_id?, workshop_location?, bio? }` |

#### Vaults (Capture)
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/v1/media/presigned-url` | JWT | `{ filename, content_type }` → `{ url, s3_key, vault_id }` |
| POST | `/api/v1/media/process-webhook` | JWT | `{ vault_id, s3_key }` |
| GET  | `/api/v1/vaults/me` | JWT | list my vaults (paginated) |
| GET  | `/api/v1/vaults/{id}` | JWT | full vault + Craft DNA summary |
| GET  | `/api/v1/vaults/{id}/status` | JWT | poll while processing |

#### Discovery
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET  | `/api/v1/feed` | — | homepage aggregate (top 6 of each resource) |
| GET  | `/api/v1/search/techniques` | — | `?query=<text>&limit=5` |
| POST | `/api/v1/ask` | — | `{ master_id, question, answer_language?, top_k? }` |

#### Sanad (provenance)
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET  | `/api/v1/sanad` | — | public listing (`?master_id=` filter optional) |
| POST | `/api/v1/sanad/keys` | JWT | mint master keypair via AI core |
| POST | `/api/v1/sanad/sign` | JWT | sign a payload, returns QR + signature |
| POST | `/api/v1/sanad/verify` | — | `{ qr_string }` → `{ valid, … }` |
| GET  | `/api/v1/sanad/{id}` | — | DB-backed Sanad detail |
| GET  | `/api/v1/sanad/{id}/qr` | — | PNG image (`Content-Type: image/png`) |

#### Workshops (Ustaad)
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET    | `/api/v1/workshops` | — | `?master_id=&is_active=true&limit=&offset=` |
| GET    | `/api/v1/workshops/{id}` | — | detail incl. master name |
| POST   | `/api/v1/workshops` | JWT (master) | `{ format, price, duration_mins, description? }` |
| PUT    | `/api/v1/workshops/{id}` | JWT (owner) | partial update |
| DELETE | `/api/v1/workshops/{id}` | JWT (owner) | soft delete (`is_active=false`) |

#### Bookings (Ustaad buyer-side)
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET  | `/api/v1/bookings/me` | — (`?phone=`) | list bookings made under that phone |
| GET  | `/api/v1/bookings/{id}` | — (`?phone=`) | single booking detail |
| POST | `/api/v1/commerce/book` | — | (legacy) `{ workshop_id, user_phone, date, participants }` |

#### Bundles (Bazaar)
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET  | `/api/v1/bundles` | — | listing |
| GET  | `/api/v1/bundles/{id}` | — | detail incl. linked Sanads |
| POST | `/api/v1/bundles` | JWT | `{ name, price, description?, sanad_ids[] }` |

#### Orders (Bazaar buyer-side)
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET  | `/api/v1/orders/me` | — (`?phone=`) | list orders for that phone |
| GET  | `/api/v1/orders/{id}` | — (`?phone=`) | order detail incl. bundle name |
| POST | `/api/v1/commerce/checkout` | — | (legacy) `{ bundle_id, user_phone }` |

#### Health
| Method | Path | Notes |
|---|---|---|
| GET  | `/healthz` | reports backend status + AI-core reachability |
| GET  | `/` | API metadata |

**The original A1 contract is unchanged.** Everything new is additive.

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
