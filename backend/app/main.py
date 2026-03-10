from fastapi import FastAPI

from app.config import settings
from app.routers.api import api_router
from app.routers.health import router as health_router
from app.routers.stammdaten import legacy_dropdown_router

app = FastAPI(title=settings.app_name, version=settings.app_version)

app.include_router(health_router)
app.include_router(legacy_dropdown_router)
app.include_router(api_router)
