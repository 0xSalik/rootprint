from fastapi import APIRouter
from app.api.endpoints import auth, media, search, sanad, commerce

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(media.router, prefix="/media", tags=["media"])
api_router.include_router(search.router, prefix="/search", tags=["search"])
api_router.include_router(sanad.router, prefix="/sanad", tags=["Sanad Provenance"])
api_router.include_router(commerce.router, prefix="/commerce", tags=["Bazaar Commerce & Ustaad"])
