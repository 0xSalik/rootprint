# Hunarmand

A Tacit Knowledge Operating System for Kashmir's heritage artisans.

## A scene that frames the work

A seventy-two year old _ustaad_ of _sozni_ embroidery sits on the second
floor of a wooden workshop in Downtown Srinagar. He threads a needle he
has held since he was nine. His hands know a stitch that took thirty
years to perfect. His son drives a taxi in Sopore. His grandson is
preparing for entrance exams in Bengaluru. Neither of them can _sozni_ a
single petal.

The _ustaad_ will pass away in this decade. With him goes a stitch no
museum has, no book has captured, no algorithm has ever seen.

Multiply by the master _kani_ weaver in Kanihama, the _khatamband_
ceiling-maker in Zaina Kadal, the _naqash_ who layers gold leaf on
papier-mâché in Rainawari. Multiply by ten thousand workshops. This is
what happens in Kashmir, every season, right now.

## What Hunarmand is

Hunarmand is the first platform that treats heritage artisans the way a
mature engineering organisation treats institutional memory: as a
captureable, queryable, monetisable asset that survives the people who
created it.

We sit with each master in their own workshop, capture their knowledge
through a structured AI-led interview in Koshur, and produce a
permanent, machine-readable _Craft DNA_ that is owned by the artisan
themselves. That knowledge then powers four interlocking commercial
layers, each one feeding the next.

| Component | Live 

| Layer | What it does | Frontend surface |
|---|---|---|
| Vault | Captures the unwritten knowledge that dies with the master. The output is a structured Craft DNA file: techniques, tools, materials, supplier graph, environmental tunings, decision rules, failure log, lineage chain. | Master onboarding studio. |
| Sanad | Turns the captured knowledge into a verified public directory and a per-piece cryptographic provenance certificate (Ed25519 + RFC 8785 JCS) that counterfeits cannot fake. | Public artisan profiles, scan-to-verify QR pages. |
| Ustaad | Converts the same knowledge into bookable living-museum workshops. | Workshop discovery, booking, calendar. |
| Bazaar | Scales authenticated commerce through curated pop-up bazaars and Heritage Bundles. | Storefront, cart, checkout, "my orders". |

The artisan keeps the rest. Platform commission on direct commerce sits
at six to nine percent, against the seventy to eighty-five percent the
existing middleman chain extracts.

## Why this works

The proposition lands on three foundations.

**The cultural one.** Kashmiri master weavers invented their own
encoded knowledge-transfer system centuries ago: the _talim_, a cryptic
vertical script a master would write so an apprentice who had never
seen the design could weave it perfectly. That artefact is the world's
first source code for craft, written in Srinagar before computers
existed. We are not bringing foreign technology to Kashmir. We are
upgrading an indigenous Kashmiri tradition into the medium it always
deserved.

**The economic one.** Buyers do not pay a premium for "handmade". They
pay a premium for verified provenance. Hunarmand is the only place
that can price provenance, because it is the only place that captured
what makes provenance real: not just a photograph or a story, but the
master's named techniques, supplier graph, and decision rules,
cryptographically signed against a master keypair. A counterfeit
shawl can be made; a Sanad signed by Mohammad Yusuf cannot.

**The technical one.** Capable language models, low-latency speech
recognition, and structured-output generation became operationally
viable for a small team this year. AI4Bharat ships open-weight Indic
ASR at IIT Madras. Bhashini exposes first-class Kashmiri (`ks`) ASR
through a national-language API. OpenRouter aggregates frontier-class
LLMs behind a single OpenAI-compatible interface, including free-tier
models that handle Koshur context well. None of this was true at hackathon-deployable cost two years ago. The window to capture today's
masters is open right now.

## The system

```
                    +----------------------------+
                    |  Frontend (Vercel)         |
                    |  Next.js, hunarmand.sal.lol|
                    +-------------+--------------+
                                  | HTTPS, JWT
                                  v
+-------------------------------------------------------+
|  Backend (Render, FastAPI)                            |
|  https://hunarmand-backend.onrender.com               |
|                                                       |
|  Auth  Masters  Vaults  Sanad  Search  Ask            |
|  Workshops  Bookings  Bundles  Orders  Feed           |
|  Healthz                                              |
+-------+----------------+--------+---------------------+
        |                |        |
        | asyncpg/SSL    | HTTPS  |
        v                v        v
+----------------+  +-------------------------------+
| Neon Postgres  |  |  AI core (HF Spaces, FastAPI) |
| + pgvector     |  |  hunarmand-ai.hf.space        |
+----------------+  |                               |
                    |  ASR (Bhashini, AI4Bharat,    |
                    |       Groq Whisper, HF        |
                    |       Inference Whisper,      |
                    |       OpenAI Whisper, manual) |
                    |  LLM (OpenRouter, free tier)  |
                    |  Embeddings (local            |
                    |       multilingual-e5-small)  |
                    |  RAG over pgvector            |
                    |  Cryptographic Sanad service  |
                    |       (Ed25519 + RFC 8785)    |
                    +-------------------------------+
```

Every box runs on a free tier. No paid services are required to
reproduce the deployment.
|
|---|---|
| Frontend (Next.js, Vercel) | https://hunarmand.sal.lol |
| Backend API (FastAPI, Render) | https://hunarmand-backend.onrender.com |
| Backend OpenAPI docs | https://hunarmand-backend.onrender.com/docs |
| AI core (FastAPI, Hugging Face Spaces) | https://slimshadylol-hunarmand-ai.hf.space |
| AI core OpenAPI docs | https://slimshadylol-hunarmand-ai.hf.space/docs |
| Source | https://github.com/0xSalik/rootprint |

The compiled hackathon pitch lives at [`hunarmand_pitch.pdf`](./hunarmand_pitch.pdf).

## Try the live demo

The demo backend uses a mock OTP. Any phone number signs in; the OTP is always `123456`. Two accounts are surfaced as one-tap "Try as ..." buttons on the login page.

| Account | Phone | OTP | Lands on | Sees |
|---|---|---|---|---|
| Artisan (Mohammad Yusuf Sheikh, 4th-gen Kanihama pashmina master) | `+919999999999` | `123456` | `/studio` | own workshops, vault sessions, issued Sanads, profile editor |
| Patron (buyer / collector) | `+918888888888` | `123456` | `/account` | own bookings, own orders, browse links |

The full directory of eighteen artisans (three per craft) is seeded
into Neon by `hunarmand/scripts/seed-backend.mts`. Each master is
addressable by their own deterministic phone number; the OTP is the
same `123456` for every account. The seeded set covers every
craft (papier-mâché, pashmina, sozni, walnut carving, hand-knotted
carpet, khatamband) and produces fifty-four workshops between them.
You can sign in as any of them; visit `https://hunarmand-backend.onrender.com/api/v1/masters?limit=20`
to see the list.

Both accounts can navigate the entire public surface (`/`, `/bazaar`, `/workshops`, `/sanad/*`, `/artisan/*`, `/craft/*`). The phone number determines the default dashboard after login. After signing in as the artisan and going to `/studio/workshops` you can add, hide, or delete workshops live against the Render backend, and they appear immediately in the "Live additions" strip at the bottom of `/workshops`.

To submit a booking flow end-to-end:

1. Sign in as the patron at https://hunarmand.sal.lol/login.
2. Browse `/workshops`, click any tile, complete the booking.
3. Visit `/account` to see the booking show up under "Workshops you've booked".

To submit an order flow end-to-end:

1. Sign in as the patron.
2. Browse `/bazaar`, pick a bundle, run through checkout (Stripe test mode; the demo skips actual card capture).
3. Visit `/account` to see the order appear under "Pieces in your collection".

---


### Service responsibilities

The backend is the front door. Frontend talks only to the backend.
The backend handles authentication (mock OTP plus JWT for the demo),
S3-style media upload coordination, Postgres reads and writes, and
proxies AI workloads to the AI core. CORS is enforced at the backend.

The AI core is a separate FastAPI service deployed on a Hugging Face
Space. It owns every model-bound responsibility: speech recognition,
translation, structured Craft DNA extraction, retrieval-augmented
question answering, and the Ed25519 signing keys that mint Sanads.
The AI core's public key registry can be cached on a phone for fully
offline Sanad verification.

The two services share a single Neon Postgres instance with `pgvector`
enabled. The backend owns canonical tables (`masters`, `vaults`,
`craft_dnas`, `sanads`, `workshops`, `bookings`, `bundles`, `orders`)
managed by Alembic. The AI core owns its own ML-bound tables
(`vault_chunks`, `master_keys`, `interview_*`, `craft_dna_records`,
`ai_sanads`) and explicitly excludes the backend-owned tables from
its auto-create path so the two services cannot collide on the shared
database.

## The technology

### AI core, in detail

The AI core is `ai/`. It is a Python 3.12 / FastAPI / async SQLAlchemy
service, packaged with `pyproject.toml`, deployed via a
production-grade Dockerfile to a Hugging Face Space, with the
embedding model pre-baked into the image so the first inference after
a deploy is fast.

ASR is configured as a fallback ladder, picked per environment:

1. **Bhashini ULCA**. The Government of India's national language
   platform. First-class `ks` Kashmiri support. Two-stage auth and
   cached pipeline resolution.
2. **AI4Bharat IndicWhisper / IndicConformer**. Open weights, 36 Indic
   languages including Kashmiri, served through a HuggingFace
   Inference Endpoint or a self-hosted shim.
3. **Groq Whisper-large-v3-turbo**. Free tier, sub-second latency,
   OpenAI-compatible API.
4. **HuggingFace Inference API Whisper-large-v3**. Same HF account as
   the Space, no extra signup.
5. **OpenAI Whisper-large-v3**. Paid baseline, fallback only.
6. **Manual**. Field facilitator types as the master speaks. Always
   available, confidence one, canonical ground truth.

The pipeline accepts the first result above the configured confidence
threshold and degrades transparently when individual rungs are
unreachable.

LLM access goes through a provider-agnostic async client. The default
on the deployed Space is OpenRouter with `meta-llama/llama-3.3-70b-instruct:free`. The structured-output helper auto-downgrades from
JSON-schema mode to JSON-object mode to prompt-only mode based on
what the model supports, with one repair retry on validation failure.
The same code works against `gpt-4o`, `meta-llama/llama-3.3-70b:free`,
`google/gemini-2.0-flash-exp:free`, and tiny `mistral-7b:free` models
without code changes.

Embeddings run locally on `intfloat/multilingual-e5-small`
(384 dimensions) inside the Space. No paid embedding API is required.
Switching to Jina or OpenAI is a one-env-var change.

The cryptographic Sanad service is the part of the project most
worth reading carefully. Each master gets an Ed25519 keypair (PyNaCl /
libsodium). Private keys are encrypted at rest with NaCl SecretBox,
keyed by a KEK derived from `HUNARMAND_KEK_SECRET`. Sanad payloads are
canonicalised with RFC 8785 JSON Canonicalization Scheme so two
implementations in any language hash the same bytes. The QR string is
a JWS-compact triple of `b64url(header).b64url(payload).b64url(signature)`,
fully self-contained: a buyer with the master's pre-cached public key
can verify offline, anywhere, in any language.

Slow paths (`/ask`, `/extract`, `/asr/transcribe`) are wrapped with
per-endpoint timeouts and curated fallback responses so the frontend
never has to render an empty state when free-tier inference is slow.
Fallback responses are openly documented in `ai/src/hunarmand_ai/fallbacks/`,
keyword-routed against the question, randomised within plausible
bands, and logged on every fire so operators see exactly when the
fallback path is taken. Auth, signing, and verification endpoints
deliberately do not have fallbacks: faking those would be unsafe.

### Backend, in detail

The backend is `backend/`. Same Python and FastAPI stack. JWT auth via
`python-jose`, async Postgres via `asyncpg`, ORM via SQLAlchemy 2,
S3-compatible storage via `boto3`. Alembic owns the schema; a single
migration brings a fresh Neon project up to a working state.

The frontend gets thirty-five v1 endpoints across thirteen logical
resource groups:

```
auth          /api/v1/auth/{send-otp, verify-otp, me, masters}
masters       /api/v1/masters, /api/v1/masters/{id}
              /api/v1/masters/me, /api/v1/masters/me/full
media         /api/v1/media/{presigned-url, process-webhook}
vaults        /api/v1/vaults/me, /api/v1/vaults/{id}
              /api/v1/vaults/{id}/status
search        /api/v1/search/techniques
ask           /api/v1/ask
feed          /api/v1/feed
sanad         /api/v1/sanad, /api/v1/sanad/{keys, sign, verify}
              /api/v1/sanad/{id}, /api/v1/sanad/{id}/qr
workshops     /api/v1/workshops, /api/v1/workshops/{id}
bookings      /api/v1/bookings/me, /api/v1/bookings/{id}
bundles       /api/v1/bundles, /api/v1/bundles/{id}
orders        /api/v1/orders/me, /api/v1/orders/{id}
commerce      /api/v1/commerce/{workshops/{master_id}, book, checkout}
health        /, /healthz
```

Every list endpoint accepts `?limit=` and `?offset=` and returns a
stable `{items, total, limit, offset}` envelope. Master-side write
endpoints require a JWT. Buyer-side read endpoints take a `?phone=`
query so the cart and order history work without forcing a login.

The backend's `/healthz` reports its own status, the configured
embedding dimension, the inline-task switch, and the AI core's
reachability with version and ASR ladder visible. Operators reading
the badge know in one glance whether the chain is healthy.

### Frontend

The frontend is a Next.js 16 application (React 19, Tailwind 4)
deployed on Vercel under the custom domain `hunarmand.sal.lol`. It
consumes the backend exclusively through `NEXT_PUBLIC_HUNARMAND_API`.
Phone OTP login (mock during the demo), JWT in `localStorage`, and
the rest of the surface is RESTful JSON.

The route surface splits into three layers:

* **Public showcase** for an evaluator who arrives without a session:
  `/` (craft entry), `/landing-editorial`, `/craft/[slug]`,
  `/artisan/[slug]`, `/sanad/[piece-id]`, `/sanad/[piece-id]/[lang]`,
  `/bazaar`, `/workshops`, `/workshop/[id]`, the full booking flow
  under `/booking/[workshop-id]/...`, plus `/demo` and
  `/design-system` reference pages.
* **Auth** at `/login` with phone-OTP and one-tap demo account fills.
  Tokens persist in `localStorage`; refreshing a logged-in page keeps
  the session.
* **Authenticated dashboards** that talk to the live backend:
  `/account` (patron bookings + orders),
  `/studio` (artisan overview),
  `/studio/workshops` (CRUD against `/api/v1/workshops`),
  `/studio/profile` (`PUT /api/v1/masters/me`).

The authoring stack is in `hunarmand/src/lib/`:

* `env.ts` — `NEXT_PUBLIC_HUNARMAND_API` resolution + role inference
  from phone number.
* `api.ts` — typed fetch wrapper for every documented backend route
  with a single `ApiError` shape on failures.
* `auth.tsx` — `<AuthProvider>` + `useAuth()` + `useRequireAuth()`
  hook for client components that need to gate on the JWT.

Site navigation is auth-aware: signed-out visitors see "Sign in" and
"Try the demo"; signed-in users see "Studio" or "Account" (chosen by
phone-inferred role) and "Sign out".

## Engineering decisions worth defending

**One single Neon Postgres for two services.** The split between AI
core and backend is real: separate processes, separate deploys,
separate scaling. They share a database because that is the simplest
strong-consistency model for a hackathon, and because the alternative
(an internal RPC layer over which the AI core writes its own tables
through the backend) would have shipped a week later. The collision
risk is solved by table naming discipline: the AI core's signing-side
records live in `ai_sanads` so they cannot fight the backend's buyer-
facing `sanads`, and `MasterRow` in the AI core is declared only as
an ORM target for foreign-key resolution and never auto-created.

**Inline task fallback for background processing.** The deployed
backend honours `RUN_INLINE_TASKS=1` and dispatches the Vault
ingestion pipeline through FastAPI's BackgroundTasks rather than
Celery. The frontend response shape is identical to the Celery path.
This means the demo runs on a laptop or on a Render free instance
without needing a Redis broker. Production scaling can flip the env
var and run the same coroutine through a Celery worker without any
code change.

**Free-tier defaults end-to-end.** OpenRouter (LLM), Groq (Whisper),
Hugging Face Inference (Whisper backup), local sentence-transformers
(embeddings), Bhashini (Kashmiri ASR), AI4Bharat (Indic ASR), Neon
(Postgres), Render (backend hosting), Hugging Face Spaces (AI core
hosting), Vercel (frontend hosting). No card-on-file is required for
the AI core and the backend to be deployed and demonstrated.

**No raw text-mode SQL bind for vector parameters.** The AI core's
retriever uses pgvector's SQLAlchemy operators (`cosine_distance`)
because raw `text(":emb")` binds `list[float]` as a string and asyncpg
rejects it. A regression test compiles the actual select statement
under the postgres dialect and asserts at least one bind is pgvector-
typed. Any future PR that drifts back into raw-SQL bind fails CI.

**RFC 8785 JCS for cryptographic canonicalisation.** Two
implementations in any language hash the same bytes for the same
logical payload. Without this, an iOS verifier and a Python signer
would silently disagree on byte order or number formatting and the
signature check would fail. The Sanad QR is offline-verifiable
because the bytes are deterministic.

## What is built

| Domain | Evidence |
|---|---|
| AI core test suite | 86 tests passing |
| Backend test suite | 39 tests passing |
| Backend API surface | 35 v1 endpoints |
| Cryptographic primitives | Ed25519 sign/verify with RFC 8785 JCS canonicalisation, regression-tested |
| ASR fallback ladder | 6 providers, confidence-aware, fallback-chain reported in every result |
| LLM provider abstraction | OpenAI, OpenRouter, Anthropic on the same async path, with adaptive structured-output downgrades |
| Sanad QR rendering | PNG + JWS-compact wire format, offline-verifiable |
| Demo dataset | Deterministic seed for one master, one workshop, one bundle, one signed Sanad |
| Migrations | Alembic, asyncpg-aware URL normaliser, idempotent against Neon |
| Logging | Structured (`structlog`), JSON in production, human-pretty in dev, every fallback fire visible |
| Deployment | All three services live on free tiers |

## Repository layout

```
rootprint/
  ai/                       AI core service
    src/hunarmand_ai/       Source
      asr/                  Six ASR providers + fallback ladder
      extractor/            Multi-stage Craft DNA extractor
      fallbacks/            Curated fallback payloads
      interviewer/          Four-pass Vault interviewer
      llm/                  Provider-agnostic LLM client
      models/               SQLAlchemy ORM
      rag/                  Chunker, embedder, retriever, ask
      routers/              FastAPI routers
      sanad/                Ed25519 + JCS + QR
      schemas/              Pydantic schemas (Craft DNA, Sanad, ASR, RAG, Interview)
    tests/                  86 tests
    fixtures/               Demo fixtures
    Dockerfile              Production image for Hugging Face Spaces
    DEPLOY.md               Step-by-step deployment guide
    pyproject.toml
  backend/                  Backend API gateway
    app/
      api/endpoints/        Twelve resource modules
      clients/              Async HTTP client to the AI core
      core/                 Config, database, security
      fallbacks/            Per-endpoint timeouts and curated fallbacks
      models/               SQLAlchemy ORM (single source of truth for shared tables)
      services/sanad/       Local Ed25519 helpers and QR rendering
      worker/               Celery task and the shared inline pipeline
      main.py               FastAPI app
    alembic/                Database migrations
    scripts/reset_demo.py   Deterministic demo seeder
    tests/                  39 tests
    Dockerfile              Production image for Render
    HANDOVER.md             Frontend integration reference
    pyproject.toml
  hunarmand_pitch.tex       LaTeX pitch source
  hunarmand_pitch.pdf       Compiled pitch
  render.yaml               Render deployment spec
  README.md                 This file
```

## Running it locally

The fastest path to a running stack on a laptop. Each step is a few
minutes.

### Prerequisites

* Python 3.12 with `venv`
* Postgres with `pgvector` (or a Neon project)
* An OpenRouter API key from https://openrouter.ai/keys (free)

### AI core

```
cd ai
python -m venv .venv && source .venv/bin/activate
pip install -e '.[dev,local-embeddings]'
cp .env.example .env
# edit .env: set OPENROUTER_API_KEY and HUNARMAND_KEK_SECRET (any 32 byte secret)
hunarmand-ai demo                    # runs Vault to Sanad chain offline, no API keys
OPENROUTER_API_KEY=sk-or-... hunarmand-ai demo --use-llm
hunarmand-ai serve --reload          # Open http://localhost:8000/docs
pytest -q                            # 86/86 passing
```

### Backend

```
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -e '.[dev]'
cp .env.example .env
# Set HUNARMAND_DATABASE_URL to your Neon pooled URL (the libpq query
# params are stripped automatically; paste it as Neon gives it).
# Set AI_CORE_URL=https://<your-username>-hunarmand-ai.hf.space
# Set SECRET_KEY to any 32+ byte secret.
alembic upgrade head
python scripts/reset_demo.py
uvicorn app.main:app --reload        # Open http://localhost:8000/docs
pytest -q                            # 39/39 passing
```

### Frontend

```
cd hunarmand
npm ci
cp .env.example .env.local         # NEXT_PUBLIC_HUNARMAND_API=https://hunarmand-backend.onrender.com
npm run dev                        # http://localhost:3000

# Production:
npm run build                      # Next.js 16 / Turbopack
# In Vercel: set NEXT_PUBLIC_HUNARMAND_API on the project, push, deploy.
```

## Verifying the deployment

```
SPACE=https://slimshadylol-hunarmand-ai.hf.space
BACKEND=https://hunarmand-backend.onrender.com

curl -fsS $BACKEND/healthz | python3 -m json.tool
# expects: status=ok, ai_core.reachable=true, embedding_dim=384

curl -fsS "$BACKEND/api/v1/feed" | python3 -m json.tool
# expects: { masters: [...], workshops: [...], bundles: [...], sanads: [...] }

curl -fsS -X POST "$BACKEND/api/v1/sanad/verify" \
  -H 'Content-Type: application/json' \
  -d '{"qr_string":"foo.bar.baz"}' | python3 -m json.tool
# expects: valid:false, reason="Decode error..." (proves the proxy chain works)

curl -fsS -X POST "$SPACE/embed" \
  -H 'Content-Type: application/json' \
  -d '{"inputs":["kani-buti chu hath sund","pashmina shawl"]}' | python3 -m json.tool
# expects: provider=local, dimensions=384, count=2
```

## The team and the work

Five people, organised as two plus two plus one. The split intentionally
puts the cryptographic and AI-core work where it can move quickly,
and the platform and product work where it can ship in parallel.

* **Salik Khan.** AI Interview Engine; Craft DNA schema and the multi-stage
  extractor; the RAG retriever and "Ask the Hunarmand"; the ASR
  fallback ladder including the two new free providers (Groq Whisper,
  Hugging Face Inference) added during the hackathon; the cryptographic Sanad service (Ed25519 keypair lifecycle,
  RFC 8785 JCS canonicalisation, JWS-compact QR encoding, online and
  offline verifiers); per-endpoint timeout layer; the URL normaliser
  for shared-database safety; the integration of the AI core with the
  backend through a typed async HTTP client.
* **Umaan Mehraj** Backend foundation: FastAPI scaffolding,
  Postgres schema and migrations, JWT auth, S3 presigned uploads,
  Celery task scaffolding, the Render deployment spec.
* **Muhammad Anas** Sanad detail and QR endpoints, commerce
  endpoints (workshops, bookings, bundles, orders), the demo seeder
  script.
* **Aleena Peer** Frontend pages, components, and design
  system on Next.js. Vault Studio onboarding flow. Master profile
  pages. Workshop and bundle storefronts. Cart and checkout.
* **Qazi Muhammad Ateeb** Frontend brand, illustrations, and the
  pitch deck. Public Sanad provenance page (the buyer-facing scan-to-
  verify flow). Integration with the backend's full surface.

The cross-track agreement signed on day one held. The Craft DNA
schema and the Sanad payload schema were locked before integration
began, the demo path was prioritised, and the demo freeze ran six
hours before submission with no code changes after it.

## Roadmap, post-hackathon

* Field-record the first ten Kashmiri masters in partnership with the
  Crafts Development Institute, Srinagar.
* Move the AI core to a self-hosted Hugging Face Inference Endpoint
  with persistent storage so embedding caches survive restarts.
* Replace the mock OTP system with a real SMS provider behind a
  feature flag.
* Add Verified Successor flow: graduated apprentice certification
  with cryptographic lineage attached to every piece they sign.
* Move from inline tasks to Celery in production once the Vault
  intake interview moves out of the demo flow.
* Open the Craft DNA corpus, with each master's explicit consent, to
  NIT Srinagar researchers and recognised craft guilds.

## Acknowledgements

The work draws on several public infrastructures without which the
project would not have been deployable on a free tier:

* Bhashini (Government of India) for first-class Kashmiri ASR.
* AI4Bharat (IIT Madras) for IndicWhisper and IndicConformer.
* OpenRouter for free-tier access to frontier-class LLMs through an
  OpenAI-compatible interface.
* Groq for Whisper-large-v3-turbo on a free tier with very low latency.
* Hugging Face for Inference API Whisper, Spaces hosting, and the
  Sentence Transformers ecosystem.
* Neon for free-tier Postgres with pgvector preinstalled.
* The maintainers of `pgvector`, `PyNaCl`, `rfc8785`, `tenacity`,
  `structlog`, and `pydantic-settings`.

The cultural rooting of the project draws on the centuries-old
Kashmiri _talim_ tradition. The work is dedicated to the masters
whose names should not be forgotten.

## License

MIT. See `LICENSE`.
