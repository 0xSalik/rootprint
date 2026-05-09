import boto3
import logging
import uuid
from botocore.exceptions import ClientError
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.media import PreSignedURLRequest, PreSignedURLResponse, ProcessMediaWebhook
from app.api.deps import get_current_master
from app.core.database import get_db
from app.models.models import Master, Vault
from app.worker.pipeline import process_vault

from app.core.config import settings

log = logging.getLogger(__name__)
router = APIRouter()

# Initialize S3 client using settings
s3_client = boto3.client(
    "s3",
    endpoint_url=settings.S3_ENDPOINT_URL if settings.S3_ENDPOINT_URL else None,
    aws_access_key_id=settings.S3_ACCESS_KEY if settings.S3_ACCESS_KEY else None,
    aws_secret_access_key=settings.S3_SECRET_KEY if settings.S3_SECRET_KEY else None,
    region_name="auto"
)
BUCKET_NAME = settings.S3_BUCKET

@router.post("/presigned-url", response_model=PreSignedURLResponse)
async def generate_presigned_url(
    request: PreSignedURLRequest,
    current_master: Master = Depends(get_current_master),
    db: AsyncSession = Depends(get_db)
):
    """
    Generate a pre-signed URL to upload a file directly to S3.
    Also creates a pending Vault record.
    """
    # Create unique S3 key
    s3_key = f"vaults/{current_master.id}/{uuid.uuid4()}_{request.filename}"
    
    try:
        presigned_url = s3_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': BUCKET_NAME,
                'Key': s3_key,
                'ContentType': request.content_type
            },
            ExpiresIn=3600 # 1 hour
        )
    except ClientError as e:
        raise HTTPException(status_code=500, detail="Could not generate presigned URL")
        
    # Create pending vault record
    new_vault = Vault(
        master_id=current_master.id,
        media_s3_key=s3_key,
        status="pending"
    )
    db.add(new_vault)
    await db.commit()
    await db.refresh(new_vault)
    
    return {
        "url": presigned_url,
        "s3_key": s3_key,
        "vault_id": new_vault.id
    }

@router.post("/process-webhook")
async def trigger_media_processing(
    webhook: ProcessMediaWebhook,
    background_tasks: BackgroundTasks,
    current_master: Master = Depends(get_current_master),
    db: AsyncSession = Depends(get_db),
):
    """
    Webhook called by frontend after S3 upload is complete.

    Dispatches the actual Vault → CraftDNA pipeline (download from S3,
    transcribe via the AI core's ASR ladder, extract Craft DNA, embed,
    persist) either to Celery (if Redis is available) or to FastAPI's
    BackgroundTasks (if ``RUN_INLINE_TASKS=1``). The frontend response
    contract is identical in both modes.
    """

    # Update vault status
    vault = await db.get(Vault, webhook.vault_id)
    if not vault or vault.master_id != current_master.id:
        raise HTTPException(status_code=404, detail="Vault record not found")

    vault.status = "processing"
    await db.commit()

    if settings.RUN_INLINE_TASKS:
        log.info("media.process_webhook.inline vault_id=%s", vault.id)
        background_tasks.add_task(_run_inline_pipeline, str(vault.id), vault.media_s3_key)
        mode = "inline"
    else:
        # Lazy import so a missing Redis at import time doesn't take the
        # whole FastAPI app down.
        from app.worker.tasks import process_vault_media

        log.info("media.process_webhook.celery vault_id=%s", vault.id)
        process_vault_media.delay(str(vault.id), vault.media_s3_key)
        mode = "celery"

    return {"message": "Processing started", "vault_id": vault.id, "mode": mode}


async def _run_inline_pipeline(vault_id: str, s3_key: str) -> None:
    """Inline pipeline runner used by FastAPI BackgroundTasks.

    Logs and swallows exceptions because BackgroundTasks errors don't
    surface to the client — the pipeline already updates the vault's
    status field, which the frontend can poll.
    """

    try:
        await process_vault(vault_id, s3_key)
    except Exception as exc:  # noqa: BLE001
        log.exception("inline_pipeline_failed vault_id=%s err=%s", vault_id, exc)
        # Mark the vault as failed so the frontend's polling loop can react.
        try:
            from app.core.database import AsyncSessionLocal
            from app.models.models import Vault as VaultModel
            import uuid as _uuid

            async with AsyncSessionLocal() as session:
                v = await session.get(VaultModel, _uuid.UUID(vault_id))
                if v:
                    v.status = "failed"
                    await session.commit()
        except Exception:  # noqa: BLE001
            pass
