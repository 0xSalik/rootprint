# Deploy: Hunarmand AI on Hugging Face Spaces + Neon

A fully free production stack for the hackathon demo:

| Layer | Provider | Cost | Notes |
|---|---|---|---|
| Web service (FastAPI) | **Hugging Face Spaces** (Docker SDK) | Free | 16 GB RAM, 2 vCPU, **no spin-down** — perfect for live demos |
| Database | **Neon Postgres** | Free | 0.5 GB storage, **`pgvector` preinstalled**, always-on, auto-suspend on idle (resumes in ~300 ms) |
| LLM | **OpenRouter** (e.g. `meta-llama/llama-3.3-70b-instruct:free`) | Free | API only — no deploy |
| ASR | **Groq** (`whisper-large-v3-turbo`) | Free | API only — no deploy |
| Embeddings | **Local `sentence-transformers`** (`intfloat/multilingual-e5-small`, 384d) | Free | Runs inside the Space, no extra API |
| Frontend | **Vercel** | Free | Hits the Space directly |

End result: a live API at `https://<your-username>-<space-name>.hf.space` that your Vercel frontend talks to with no auth proxy and no custom infra.

---

## 0. Prerequisites

* A Hugging Face account: https://huggingface.co/join
* A Neon account: https://neon.tech (use GitHub login)
* An OpenRouter key (free): https://openrouter.ai/keys
* A Groq key (free): https://console.groq.com/keys
* `git` installed locally

---

## 1. Provision Postgres on Neon (≈ 2 minutes)

1. Sign in to [Neon Console](https://console.neon.tech) and click **New Project**.
2. **Project name:** `hunarmand`. **Postgres version:** 16. **Region:** the one closest to your Vercel and HF region (Asia Pacific (Mumbai) `aws-ap-south-1` is good for India).
3. After it's created, open the **SQL Editor** and run **once**:

   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

   (Neon ships `pgvector`; this just enables it for the database.)

4. Open the **Dashboard** → **Connection Details** panel and grab the **Pooled connection** string. It looks like:

   ```
   postgresql://hunarmand_owner:NPg_xxxx@ep-snowy-sound-xxxxxx-pooler.ap-south-1.aws.neon.tech/hunarmand?sslmode=require
   ```

5. **Convert it to the async driver Hunarmand uses.** Replace `postgresql://` with `postgresql+asyncpg://` and **drop the entire `?...` query string at the end** — Neon now ships with both `?sslmode=require` and `?channel_binding=require`, neither of which asyncpg understands. asyncpg negotiates TLS automatically against Neon's pooled hostname.

   What you paste into the Space's secret should look like:

   ```
   postgresql+asyncpg://hunarmand_owner:NPg_xxxx@ep-snowy-sound-xxxxxx-pooler.ap-south-1.aws.neon.tech/hunarmand
   ```

   Not like (this is what Neon hands you in the dashboard — drop the query string):

   ```
   postgresql://hunarmand_owner:NPg_xxxx@...neon.tech/hunarmand?sslmode=require&channel_binding=require
   ```

   > Newer Hunarmand builds auto-strip libpq-only query parameters and translate `sslmode=require` to asyncpg's own connect-arg, so pasting Neon's raw URL works too — but for clarity, normalise it yourself in the secret value.

> **Tip.** Keep this connection string in a password manager — it's the only secret on the Neon side.

---

## 2. Create the Hugging Face Space (≈ 1 minute)

1. Go to https://huggingface.co/new-space.
2. **Owner**: your username. **Space name**: `hunarmand-ai` (any slug you like — that becomes part of the URL).
3. **License**: MIT.
4. **Select the Space SDK**: **Docker** → **Blank**.
5. **Visibility**: Public (or Private if you'd rather; the API URL still works).
6. Click **Create Space**. You'll land on an empty Space with its own git remote.

Note your Space URL — it's `https://<username>-hunarmand-ai.hf.space` (we'll come back to this after the build finishes).

---

## 3. Add the Space's secrets (≈ 1 minute)

In your Space, go to **Settings → Variables and secrets → New secret** and add **all of these**:

| Name | Value |
|---|---|
| `OPENROUTER_API_KEY` | The key from openrouter.ai |
| `GROQ_API_KEY` | The key from console.groq.com |
| `HUNARMAND_KEK_SECRET` | A 32+ byte secret. Generate locally: `python -c "import secrets; print(secrets.token_urlsafe(32))"` |
| `HUNARMAND_DATABASE_URL` | The string from step 1.5 |
| `HUNARMAND_CORS_ORIGINS` | Your Vercel origin, comma-separated. Add `http://localhost:3000` for local dev. Example: `https://hunarmand.vercel.app,http://localhost:3000` |
| `HUNARMAND_SKIP_AUTO_MIGRATE` | Set to `1` if the backend's alembic owns the schema (recommended when the backend service runs alongside the AI core on the same Neon DB). |

Optional but recommended:

| Name | Value |
|---|---|
| `HUNARMAND_LLM_MODEL` | `meta-llama/llama-3.3-70b-instruct:free` (default) — or any other free OpenRouter model |
| `OPENROUTER_SITE_URL` | Your project's site URL (used by OpenRouter analytics) |

Hit **Save** after each one.

---

## 4. Push the AI code into the Space (≈ 3 minutes)

The Space is its own git repo. We'll copy the contents of `ai/` into it and rename the Hunarmand `SPACE_README.md` template to `README.md` so HF reads the metadata header.

```bash
# 1. Clone your empty Space
git clone https://huggingface.co/spaces/<USERNAME>/hunarmand-ai
cd hunarmand-ai

# 2. Copy everything inside this repo's ai/ directory in
cp -R /path/to/rootprint/ai/. .

# 3. Promote the HF Space metadata file to be the Space README
mv SPACE_README.md README.md

# 4. Commit and push — the Space starts building immediately
git add .
git commit -m "deploy: hunarmand ai core"
git push
```

> **Authentication.** When you push, HF will ask for a username + password.
> Use your HF username + a [Write access token](https://huggingface.co/settings/tokens). Tip: paste the token in the password prompt; HF then offers to store it via `git credential helper`.

The Space's **Logs** tab will show the build:

* `Building image…` (≈ 4–7 min on the free tier — torch + sentence-transformers download is the slow part)
* `Pre-downloading intfloat/multilingual-e5-small…`
* `Container starting on port 7860`
* Eventually: `Application startup complete.` and `hunarmand.db.ready`

Once the badge at the top says **Running**, you're live.

---

## 5. Verify the deployment (≈ 30 seconds)

```bash
SPACE=https://<USERNAME>-hunarmand-ai.hf.space

# Health
curl -fsS $SPACE/healthz | jq .
# {
#   "status": "ok",
#   "env": "production",
#   "version": "0.1.0",
#   "asr_ladder": ["bhashini","ai4bharat","groq","whisper","manual"],
#   "llm_provider": "openrouter",
#   "llm_model": "meta-llama/llama-3.3-70b-instruct:free"
# }

# OpenAPI
open $SPACE/docs

# Smoke-test the cryptographic Sanad path (no API keys needed for this one):
curl -fsS -X POST $SPACE/sanad/keys \
  -H 'content-type: application/json' \
  -d '{"master_id":"00000000-0000-4000-8000-000000000001","version":1}' | jq .
```

If `/healthz` returns 200 and `/sanad/keys` returns a `kid` and `public_key_b64`, the database, the cryptographic chain, and the Postgres connection are all working.

---

## 6. Wire the Vercel frontend (≈ 30 seconds)

In your Vercel project's **Settings → Environment Variables**, add:

```
NEXT_PUBLIC_HUNARMAND_API=https://<USERNAME>-hunarmand-ai.hf.space
```

Redeploy. Anywhere in the frontend:

```ts
const API = process.env.NEXT_PUBLIC_HUNARMAND_API;

const r = await fetch(`${API}/sanad/sign`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ master_id, payload }),
});
```

CORS is already wired — we set `HUNARMAND_CORS_ORIGINS` in step 3. If you change the Vercel domain later, just edit that secret and the Space restarts in ~10 s.

---

## 7. Demo-day checklist

A few things that will save you on stage:

* **Pre-warm 60 s before the pitch.** Hit `$SPACE/healthz` and run one `/ask` query so the embedding model is in RAM and Neon is awake.
* **Keep `HUNARMAND_KEK_SECRET` stable.** Master keypairs are encrypted with it; if it changes, old keys won't decrypt and signing will fail. If you ever do change it, regenerate keys via `POST /sanad/keys`.
* **Pin the embedding dim.** pgvector enforces dimension at the column. The default `384` matches `intfloat/multilingual-e5-small`. If you switch models, drop and recreate `vault_chunks` in Neon's SQL editor.
* **Have `out/sanad_*.png` on the laptop.** The offline `hunarmand-ai demo` artefacts are your fallback if the venue Wi-Fi dies — the cryptographic Sanad still verifies offline.
* **Keep an eye on the Space "Logs" tab during the demo** — `hunarmand_ai.main`'s structured log lines are the cleanest signal that requests are landing.

---

## Troubleshooting

**Build fails with "ModuleNotFoundError: torch"** — the install of `[local-embeddings]` failed. Check the Space's Logs tab for the actual pip error. If it's a memory issue (rare on the free 16 GB tier), switch to Jina embeddings: in the Space secrets set `HUNARMAND_EMBEDDING_PROVIDER=jina`, `JINA_API_KEY=<your-key>`, `HUNARMAND_EMBEDDING_DIMENSIONS=1024`, and edit the `Dockerfile`'s `pip install` line to drop `[local-embeddings]`. Drop and recreate `vault_chunks` in Neon afterwards.

**`hunarmand.db.init_failed: connection ... refused`** — your `HUNARMAND_DATABASE_URL` is wrong. Common mistakes: forgot to swap `postgresql://` for `postgresql+asyncpg://`, kept `?sslmode=require` (asyncpg doesn't recognise that param), or pasted the **direct** connection string instead of the **pooled** one. Use the *pooled* one (the hostname has `-pooler` in it) — Neon free-tier auto-suspends the direct compute, but the pooler endpoint always answers.

**Frontend gets `CORS preflight blocked`** — `HUNARMAND_CORS_ORIGINS` doesn't include the calling origin. Update the secret. The Space restarts automatically when you edit a secret.

**`git push` to the Space rejected with `"short_description" length must be less than or equal to 60 characters`** — HF Spaces caps the `short_description` frontmatter field at 60 characters. The shipped template is 50 chars; if you customise it, keep it under 60. Edit the `README.md` in the Space's git repo, amend, and push.

**The Space's first request after a long idle is slow** — Neon auto-suspends compute after ~5 min idle on the free plan. The first query takes ~300–500 ms to wake it. This is fine for hackathon load. If it's ever a problem, set `?pool_timeout=10` on the connection string or upgrade Neon (still free for the demo).

**I changed the Dockerfile, now what?** — `git push` to the Space remote and the Space rebuilds automatically. Build time is ~3–5 min after the first build because pip and HF caches are reused.
