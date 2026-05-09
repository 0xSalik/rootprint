from celery import Celery

from app.core.config import settings

celery_app = Celery(
    "worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

celery_app.conf.update(
    task_routes={"app.worker.tasks.process_vault_media": "main-queue"},
    task_default_queue="main-queue",
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)
