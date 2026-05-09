from pydantic import BaseModel
import uuid

class PreSignedURLRequest(BaseModel):
    filename: str
    content_type: str

class PreSignedURLResponse(BaseModel):
    url: str
    s3_key: str
    vault_id: uuid.UUID

class ProcessMediaWebhook(BaseModel):
    vault_id: uuid.UUID
    s3_key: str
