from fastapi import APIRouter
from app.api.endpoints import ask, auth, media, sanad, search

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(media.router, prefix="/media", tags=["media"])
api_router.include_router(search.router, prefix="/search", tags=["search"])
api_router.include_router(sanad.router, prefix="/sanad", tags=["sanad"])
api_router.include_router(ask.router, prefix="/ask", tags=["ask"])
