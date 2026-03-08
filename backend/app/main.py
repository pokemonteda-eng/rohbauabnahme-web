from fastapi import FastAPI

from app.routers.kunden import router as kunden_router
from app.routers.protokolle import router as protokolle_router
from app.routers.stammdaten import router as stammdaten_router

app = FastAPI(title="Rohbauabnahme Web API", version="0.1.0")


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(kunden_router)
app.include_router(protokolle_router)
app.include_router(stammdaten_router)
