from fastapi import FastAPI
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from routers import sanad, ustaad, bazaar

app = FastAPI(
    title="Hunarmand API",
    description="Tacit Knowledge OS for Heritage Artisans",
    version="1.0.0"
)

app.include_router(sanad.router, prefix="/api/sanad", tags=["Sanad Provenance"])
app.include_router(ustaad.router, prefix="/api/ustaad", tags=["Ustaad Workshop"])
app.include_router(bazaar.router, prefix="/api/bazaar", tags=["Bazaar Commerce"])

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Hunarmand API is running."}

# To run: uvicorn main:app --reload
