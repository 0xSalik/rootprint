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

## Deploying for the demo

For the hackathon, the team is deploying this on **Hugging Face Spaces + Neon
(both free, no credit card)** with a Vercel frontend. Step-by-step guide:
[`DEPLOY.md`](./DEPLOY.md). End result is a public API at
`https://<your-username>-hunarmand-ai.hf.space` that the Vercel frontend
talks to with no auth proxy.

## Quick start

```bash
cd ai

# 1. Create a virtualenv and install (with the free-tier embedding extras)
python -m venv .venv && source .venv/bin/activate
pip install -e '.[dev,local-embeddings]'

# 2. Configure environment
cp .env.example .env
# The defaults are already wired for the FREE path:
#   LLM      -> OpenRouter (free models)         set OPENROUTER_API_KEY
#   ASR      -> Groq Whisper (free tier)         set GROQ_API_KEY
#   Embeds   -> local sentence-transformers      no key needed
# Sign-up links inside .env.example.

# 3. Bring up Postgres + pgvector
docker compose up -d

# 4. Initialise tables (development only — production uses Alembic)
hunarmand-ai migrate

# 5. Run the FastAPI service
hunarmand-ai serve --reload
# Docs: http://localhost:8000/docs

# 6. Run the end-to-end demo (offline — no API keys needed at all)
hunarmand-ai demo

# 7. Run the demo with the live LLM (free OpenRouter is fine)
OPENROUTER_API_KEY=or-... hunarmand-ai demo --use-llm

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

### LLM

| Provider | Cost | Notes |
|---|---|---|
| **OpenRouter** | Free + paid | OpenAI-compatible API. Many genuinely free models (`meta-llama/llama-3.3-70b-instruct:free`, `google/gemini-2.0-flash-exp:free`, `deepseek/deepseek-chat:free`, `qwen/qwen-2.5-72b-instruct:free`, `nousresearch/hermes-3-llama-3.1-405b:free`). **Default for the hackathon.** |
| **OpenAI** | Paid | GPT-4o family. Used directly for whoever already has a key. |
| **Anthropic** | Paid | Claude 3.5 Sonnet. Same code path. |

Switch via `HUNARMAND_LLM_PROVIDER` and `HUNARMAND_LLM_MODEL`. The structured-output helper auto-downgrades from `json_schema` → `json_object` → `prompt-only` so the same code works against `gpt-4o`, `meta-llama/llama-3.3-70b-instruct:free`, and a tiny `mistral-7b:free` without code changes.

### ASR

The fallback ladder (configurable via `HUNARMAND_ASR_LADDER`) is:

1. **Bhashini ULCA** — Government of India's national language platform. First-class Kashmiri (`ks`) ASR. Two-stage auth (model resolution → inference). Free for non-commercial use; requires `BHASHINI_API_KEY` + `BHASHINI_USER_ID`.
2. **AI4Bharat IndicWhisper / IndicConformer** — open-source, fine-tuned for 36 Indic languages incl. `ks`. Run via your own HF Inference Endpoint or self-hosted shim; configure via `AI4BHARAT_INFERENCE_URL`.
3. **Groq Whisper-large-v3-turbo** — runs OpenAI Whisper on Groq's hardware, **free tier with very low latency**. OpenAI-compatible API at `https://api.groq.com/openai/v1`. Get a free key at [console.groq.com](https://console.groq.com/keys). **Default free-tier ASR for the hackathon.**
4. **OpenAI Whisper-large-v3** (`whisper-1`) — highest baseline quality, paid. Kashmiri routed via Urdu acoustic with a Kashmiri-craft-vocabulary prompt.
5. **Manual** — facilitator types as the master speaks. Always available, `confidence=1.0` because it is canonical ground truth.

The pipeline accepts the first attempt that clears `ACCEPT_CONFIDENCE` (0.65). If everything is below threshold, it returns the highest-confidence attempt with `fallback_used=True` so the operator can re-record or correct.

### Embeddings

| Provider | Cost | Default model | Dim |
|---|---|---|---|
| **`local`** | Free (no API) | `intfloat/multilingual-e5-small` | 384 |
| **`jina`** | Free tier with key | `jina-embeddings-v3` | 1024 |
| **`openai`** | Paid | `text-embedding-3-small` | 1536 |

Default is `local`. Install `pip install '.[local-embeddings]'` to enable. For a lighter remote alternative without PyTorch, switch `HUNARMAND_EMBEDDING_PROVIDER=jina` and set `JINA_API_KEY`. **pgvector enforces the column dimension** — change `HUNARMAND_EMBEDDING_DIMENSIONS` to match the model and recreate the `vault_chunks` table when switching providers.

### Translation

LLM-based by default. Uses whatever model is configured for `HUNARMAND_LLM_PROVIDER`/`HUNARMAND_LLM_MODEL`, so the free OpenRouter path translates for free. Bhashini NMT is a configurable alternative.

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
