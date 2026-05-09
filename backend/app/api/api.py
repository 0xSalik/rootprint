from fastapi import APIRouter

from app.api.endpoints import (
    ask,
    auth,
    bookings,
    bundles,
    commerce,
    feed,
    masters,
    media,
    orders,
    sanad,
    search,
    vaults,
    workshops,
)

api_router = APIRouter()

# Auth + identity
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(masters.router, prefix="/masters", tags=["masters"])

# Capture
api_router.include_router(media.router, prefix="/media", tags=["media"])
api_router.include_router(vaults.router, prefix="/vaults", tags=["vaults"])

# Discovery / RAG
api_router.include_router(search.router, prefix="/search", tags=["search"])
api_router.include_router(ask.router, prefix="/ask", tags=["ask"])
api_router.include_router(feed.router, prefix="/feed", tags=["feed"])

# Sanad
api_router.include_router(sanad.router, prefix="/sanad", tags=["sanad"])

# Ustaad (workshops + bookings)
api_router.include_router(workshops.router, prefix="/workshops", tags=["workshops"])
api_router.include_router(bookings.router, prefix="/bookings", tags=["bookings"])

# Bazaar (bundles + orders)
api_router.include_router(bundles.router, prefix="/bundles", tags=["bundles"])
api_router.include_router(orders.router, prefix="/orders", tags=["orders"])

# Legacy commerce paths (kept for any frontend that already wired them).
api_router.include_router(commerce.router, prefix="/commerce", tags=["commerce-legacy"])
