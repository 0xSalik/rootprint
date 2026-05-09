---
title: Hunarmand AI
emoji: 🧵
colorFrom: indigo
colorTo: yellow
sdk: docker
app_port: 7860
pinned: false
license: mit
short_description: Tacit Knowledge OS for heritage artisans — Vault, Sanad, Ask the Hunarmand
---

# Hunarmand AI

This Hugging Face Space hosts the Hunarmand AI core: Vault interviewer,
Craft DNA extractor, ASR fallback ladder, RAG / "Ask the Hunarmand", and
the cryptographic Sanad signing service.

* OpenAPI docs: `/docs`
* Health: `/healthz`

## Required Space secrets

Set these under **Settings → Variables and secrets**:

| Key | What it is |
|---|---|
| `OPENROUTER_API_KEY` | Free key at https://openrouter.ai/keys |
| `GROQ_API_KEY` | Free key at https://console.groq.com/keys |
| `HUNARMAND_KEK_SECRET` | 32+ byte secret, e.g. `python -c "import secrets; print(secrets.token_urlsafe(32))"` |
| `HUNARMAND_DATABASE_URL` | Pooled `postgresql+asyncpg://...?sslmode=require` from Neon |
| `HUNARMAND_CORS_ORIGINS` | Your Vercel frontend origin, e.g. `https://hunarmand.vercel.app` |

See the project repo's `ai/DEPLOY.md` for the full step-by-step guide.
