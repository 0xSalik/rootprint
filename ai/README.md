# Hunarmand AI Core (Lead Track)

The Lead-Track services for the Hunarmand platform — everything between
the master's voice and the Sanad on the shawl.

```
   master speaks ──▶ ASR ladder ──▶ chunker ──▶ embedder ──▶ pgvector
        │                                                        │
        ▼                                                        ▼
  Vault Interview ──▶ Craft DNA extractor ──▶ Craft DNA file     │
                                                  │              │
                                                  ▼              ▼
                                  Sanad signer (Ed25519)   Ask the Hunarmand (RAG)
                                                  │
                                                  ▼
                                  QR code + offline-verifiable signature
```

This package owns:

| Module | Responsibility |
|---|---|
| `interviewer/` | 4-pass AI Vault interviewer with prompt architecture, structured-output schema, dynamic follow-up logic, completion-criteria gating. |
| `extractor/` | Multi-stage Craft DNA extractor producing the canonical `CraftDNA` Pydantic schema with Citation back-references. |
| `asr/` | Bhashini → AI4Bharat → Whisper → manual fallback ladder, plus translation. |
| `rag/` | Timestamp-aware chunker, OpenAI embeddings, pgvector retriever, "Ask the Hunarmand" with strict citations and refusal-to-hallucinate. |
| `sanad/` | Ed25519 keypair lifecycle (encrypted at rest), RFC 8785 JSON canonicalisation, signing, offline-verifiable JWS-compact QR payload. |
| `routers/` | FastAPI routers wiring all of the above. |

## Quick start

```bash
cd ai

# 1. Create a virtualenv and install
python -m venv .venv && source .venv/bin/activate
pip install -e '.[dev]'

# 2. Configure environment
cp .env.example .env
# (open .env and set OPENAI_API_KEY at minimum to use the LLM-powered paths;
#  the offline demo runs without it)

# 3. Bring up Postgres + pgvector
docker compose up -d

# 4. Initialise tables (development only — production uses Alembic)
hunarmand-ai migrate

# 5. Run the FastAPI service
hunarmand-ai serve --reload
# Docs: http://localhost:8000/docs

# 6. Run the end-to-end demo (offline — no API keys needed)
hunarmand-ai demo

# 7. Run the demo with the live LLM
OPENAI_API_KEY=sk-... hunarmand-ai demo --use-llm

# 8. Run the tests
pytest -q
```

## API surface

```
GET  /healthz                       — liveness + version + provider config
POST /asr/transcribe                — multipart audio → AsrResult
POST /asr/transcribe-manual         — typed transcript → AsrResult (fallback path)

POST /interview/start               — start a Vault session, returns first interviewer action
POST /interview/turn                — submit master turn, get next interviewer action
GET  /interview/{session_id}        — fetch session state
POST /interview/{session_id}/summary— coverage report + summary

POST /extract                       — chunks_by_pass → CraftDNA + vulnerability_index

POST /ask                           — ask a question against a master's Vault (RAG)

POST /sanad/keys                    — generate a master keypair (Ed25519)
POST /sanad/sign                    — produce a signed Sanad envelope + QR
POST /sanad/verify                  — verify a Sanad QR string (DB-backed or offline pubkey)
```

The OpenAPI schema is served at `/openapi.json` and a full Swagger UI at `/docs`.

## Provider research summary

### ASR

The fallback ladder (configurable via `HUNARMAND_ASR_LADDER`) is:

1. **Bhashini ULCA** — Government of India's national language platform. First-class Kashmiri (`ks`) ASR. Best-in-class for Indian languages including Koshur. Two-stage auth (model resolution → inference). Requires `BHASHINI_API_KEY`, `BHASHINI_USER_ID`.
2. **AI4Bharat IndicWhisper / IndicConformer** — open-source Whisper fine-tuned on 36 Indic languages incl. `ks`. Run via your own HF Inference Endpoint or vLLM/FastAPI shim. Configure via `AI4BHARAT_INFERENCE_URL`.
3. **OpenAI Whisper-large-v3** (`whisper-1`) — highest baseline quality globally. Kashmiri is *not* officially supported, so the provider routes Koshur to Urdu acoustic models with a Kashmiri-craft-vocabulary prompt. Excellent for Urdu/Hindi.
4. **Manual** — facilitator types as the master speaks. Always available, `confidence=1.0` because it is canonical ground truth.

The pipeline accepts the first attempt that clears `ACCEPT_CONFIDENCE` (0.65). If everything is below threshold, it returns the highest-confidence attempt with `fallback_used=True` so the operator can re-record or correct.

### LLM

* **OpenAI GPT-4o (`gpt-4o-2024-11-20`)** is the default. Best multilingual reasoning available today, native JSON-schema response_format, native Whisper integration.
* **Anthropic Claude 3.5 Sonnet** is supported as an alternative provider on the same code path.
* Models are configurable per-deployment via `HUNARMAND_LLM_PROVIDER` and `HUNARMAND_LLM_MODEL`.

### Embeddings

* **OpenAI `text-embedding-3-small`** by default (1536 dim). pgvector index uses cosine distance.
* The provider/model are configurable; swap for `text-embedding-3-large` (3072 dim) if you want stronger retrieval at higher cost.

### Translation

LLM-based translation through GPT-4o-mini. Bhashini translation is a configurable alternative. We deliberately use the LLM here because off-the-shelf NMT struggles with Koshur, and the LLM understands craft-specific terms (sozni, kani, naqashi, etc.) when prompted.

## Cryptography

* **Ed25519** signatures via `PyNaCl` / libsodium.
* **RFC 8785 JSON Canonicalization Scheme (JCS)** for deterministic payload hashing across languages and platforms.
* **At-rest encryption** of master private keys via NaCl SecretBox keyed by `HUNARMAND_KEK_SECRET`. In production replace this with a KMS-backed KEK.
* **JWS-compact** QR payload: `b64url(header).b64url(payload).b64url(signature)`. A verifier app caches the public-key registry on device and verifies offline.

## Environment variables

See `.env.example`. The minimum to enable the LLM-powered paths:

```env
OPENAI_API_KEY=sk-...
HUNARMAND_KEK_SECRET=...   # any 32+ byte secret for the at-rest KEK
HUNARMAND_DATABASE_URL=postgresql+asyncpg://hunarmand:hunarmand@localhost:5432/hunarmand
```

The offline `hunarmand-ai demo` flow does not require any of these — it
exercises the schema, chunker, and the full Sanad signing chain with an
in-memory keypair, which is enough for the cryptographic part of the
hackathon demo.

## Layout

```
ai/
├── pyproject.toml
├── docker-compose.yml
├── .env.example
├── fixtures/demo_session.json        — sample Pashmina master Vault
├── src/hunarmand_ai/
│   ├── config.py
│   ├── db.py
│   ├── logging.py
│   ├── main.py                       — FastAPI app
│   ├── cli.py                        — `hunarmand-ai` CLI entry point
│   ├── demo.py                       — end-to-end demo
│   ├── schemas/                      — Pydantic schemas (Craft DNA, Sanad, ASR, RAG)
│   ├── models/                       — SQLAlchemy ORM
│   ├── llm/                          — provider-agnostic async LLM + structured-output helper
│   ├── interviewer/                  — Vault interview engine (4 passes)
│   ├── extractor/                    — Craft DNA extractor (4-stage)
│   ├── asr/                          — fallback ladder + translator
│   ├── rag/                          — chunker, embedder, retriever, ask
│   ├── sanad/                        — keys, canonicaliser, signer, verifier, QR
│   └── routers/                      — FastAPI routers
└── tests/                            — schema, crypto, chunker, ASR ladder, demo smoke
```
