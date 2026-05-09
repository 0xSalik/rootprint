# Hunarmand backend — production image.
# Build context: backend/
#
# Defaults are tuned for:
#   * Inline tasks (no Redis required) — RUN_INLINE_TASKS=1 by default
#   * AI core deployed elsewhere — set AI_CORE_URL via env
#   * Postgres on Neon — set HUNARMAND_DATABASE_URL via env

FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    RUN_INLINE_TASKS=1

RUN apt-get update \
 && apt-get install -y --no-install-recommends build-essential curl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

RUN useradd --create-home --uid 1000 user
USER user
WORKDIR /home/user/app

ENV PATH="/home/user/.local/bin:${PATH}"

COPY --chown=user pyproject.toml ./
COPY --chown=user app ./app
COPY --chown=user alembic ./alembic
COPY --chown=user alembic.ini ./
COPY --chown=user start.sh ./
COPY --chown=user HANDOVER.md ./

RUN pip install --user --upgrade pip && pip install --user -e . \
 && chmod +x /home/user/app/start.sh

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s \
    CMD curl -fsS http://localhost:8000/healthz || exit 1

# start.sh runs `alembic upgrade head` before launching uvicorn so a
# fresh deploy picks up pending migrations automatically. See start.sh
# for failure-mode behaviour.
CMD ["./start.sh"]
