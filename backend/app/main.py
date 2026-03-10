from fastapi import FastAPI

from app.config import settings
from app.routers.api import api_router
from app.routers.health import router as health_router
from app.routers.kunden import router as kunden_router
from app.routers.protokolle import router as protokolle_router
from app.routers.stammdaten import router as stammdaten_router

app = FastAPI(title=settings.app_name, version=settings.app_version)

app.include_router(health_router)
app.include_router(kunden_router)
app.include_router(protokolle_router)
app.include_router(stammdaten_router)
app.include_router(api_router)
