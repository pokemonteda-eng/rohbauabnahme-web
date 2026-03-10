from fastapi import APIRouter

from app.routers.health import router as health_router
from app.routers.kunden import router as kunden_router
from app.routers.protokolle import router as protokolle_router
from app.routers.stammdaten import router as stammdaten_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(health_router)
api_router.include_router(kunden_router)
api_router.include_router(protokolle_router)
api_router.include_router(stammdaten_router)
