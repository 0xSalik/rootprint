from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.config import settings
from app.core.database import get_db
from app.models.models import Master

security = HTTPBearer()

async def get_current_master(
    db: AsyncSession = Depends(get_db), 
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Master:
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        master_id: str = payload.get("sub")
        if master_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    result = await db.execute(select(Master).where(Master.id == master_id))
    master = result.scalars().first()
    if master is None:
        raise credentials_exception
    return master
