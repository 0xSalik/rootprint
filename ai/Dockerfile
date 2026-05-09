# =============================================================================
# Hunarmand AI core — production image for Hugging Face Spaces
# -----------------------------------------------------------------------------
# Build context:  ai/   (i.e. this directory)
# HF Space SDK:   docker
# HF Space port:  7860  (set in SPACE_README.md frontmatter)
#
# What this image does:
#   - installs the package + the [local-embeddings] extra (sentence-transformers)
#   - pre-downloads `intfloat/multilingual-e5-small` so the first /ask request
#     after a redeploy answers in <1s instead of taking ~5s to fetch the model
#   - pre-downloads tiktoken's cl100k_base encoding (used by the chunker)
#   - runs as UID 1000 (HF Spaces convention)
# =============================================================================

FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    HF_HOME=/tmp/hf_cache \
    SENTENCE_TRANSFORMERS_HOME=/tmp/hf_cache \
    TIKTOKEN_CACHE_DIR=/tmp/tiktoken_cache \
    HUNARMAND_HOST=0.0.0.0 \
    HUNARMAND_PORT=7860 \
    HUNARMAND_ENV=production

# Build deps for the few wheels that need to compile (asyncpg / pynacl etc.
# already publish manylinux wheels for cpython 3.12, but we keep gcc around
# for any straggler).
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        curl \
        ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# HF Spaces convention: never run as root.
RUN useradd --create-home --uid 1000 user
USER user
WORKDIR /home/user/app

ENV PATH="/home/user/.local/bin:${PATH}"

# Install the package + the local-embeddings extra.
COPY --chown=user pyproject.toml ./
COPY --chown=user src ./src
COPY --chown=user fixtures ./fixtures
COPY --chown=user README.md ./

RUN pip install --user --upgrade pip \
 && pip install --user -e '.[local-embeddings]'

# Pre-warm caches so cold-deploys are fast.
RUN mkdir -p /tmp/hf_cache /tmp/tiktoken_cache \
 && python -c "from sentence_transformers import SentenceTransformer; \
              SentenceTransformer('intfloat/multilingual-e5-small')" \
 && python -c "import tiktoken; tiktoken.get_encoding('cl100k_base')"

EXPOSE 7860

# Liveness probe — HF Spaces uses this to flip the Space to "Running".
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
    CMD curl -fsS http://localhost:7860/healthz || exit 1

# 1 worker is correct on the free tier (2 vCPUs shared).
CMD ["uvicorn", "hunarmand_ai.main:app", \
     "--host", "0.0.0.0", "--port", "7860", \
     "--workers", "1", "--proxy-headers", "--forwarded-allow-ips", "*"]
