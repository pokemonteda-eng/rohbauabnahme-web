from fastapi import FastAPI

from app.routers.kunden import router as kunden_router

app = FastAPI(title="Rohbauabnahme Web API", version="0.1.0")


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(kunden_router)
