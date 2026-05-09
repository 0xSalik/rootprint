"""Celery task for vault processing.

The actual work lives in ``app.worker.pipeline.process_vault`` so the
inline-task code path (FastAPI BackgroundTasks, used when Redis isn't
available) and the Celery code path execute the *same* coroutine.
"""

from __future__ import annotations

from celery.utils.log import get_task_logger

from app.worker.celery_app import celery_app
from app.worker.pipeline import run_sync

logger = get_task_logger(__name__)


@celery_app.task(name="app.worker.tasks.process_vault_media", bind=True, max_retries=2)
def process_vault_media(self, vault_id: str, s3_key: str):  # noqa: ANN001
    logger.info("Starting processing for Vault %s and S3 key %s", vault_id, s3_key)
    try:
        return run_sync(vault_id, s3_key)
    except Exception as exc:  # noqa: BLE001
        logger.exception("Vault %s processing failed: %s", vault_id, exc)
        raise self.retry(exc=exc, countdown=10)
