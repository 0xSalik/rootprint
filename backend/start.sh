#!/usr/bin/env bash
# Hunarmand backend container entrypoint.
#
# Runs alembic migrations (idempotent) before starting uvicorn so a
# fresh deploy on Render or any other PaaS that re-runs the image
# automatically picks up new migrations. Without this, the schema
# drifts behind the model (most recently visible as
# 'NotNullViolationError: null value in column "craft_dna_id"' on
# /api/v1/sanad/sign because migration b2c3d4e5f6a7 hadn't landed).
#
# alembic failure does NOT abort the boot. The service still has
# value with a stale schema (most read paths work), and a hard fail
# would take the whole API down on a transient DB blip during
# migration. The exit code is captured and logged loudly so the
# operator can react.

set -uo pipefail

echo "[start.sh] running alembic upgrade head…"
if alembic upgrade head; then
  echo "[start.sh] alembic upgrade head: ok"
else
  rc=$?
  echo "[start.sh] WARNING: alembic upgrade head exited with $rc"
  echo "[start.sh] continuing to start uvicorn — schema may be behind models;"
  echo "[start.sh] check Render logs and re-run migrations from the dashboard if needed."
fi

exec uvicorn app.main:app \
  --host 0.0.0.0 \
  --port "${PORT:-8000}" \
  --proxy-headers \
  --forwarded-allow-ips '*'
