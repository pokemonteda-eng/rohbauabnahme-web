from fastapi import APIRouter

from app.config import settings
from app.routers.auth import router as auth_router
from app.routers.health import router as health_router
from app.routers.kunden import router as kunden_router
from app.routers.lampentypen import router as lampentypen_router
from app.routers.protokolle import router as protokolle_router
from app.routers.stammdaten import legacy_router as legacy_stammdaten_router
from app.routers.stammdaten import router as stammdaten_router
from app.routers.vertriebsgebiete import router as vertriebsgebiete_router

api_router = APIRouter(prefix=settings.api_v1_prefix)
api_router.include_router(auth_router)
api_router.include_router(health_router)
api_router.include_router(kunden_router)
api_router.include_router(lampentypen_router)
api_router.include_router(protokolle_router)
api_router.include_router(stammdaten_router)
api_router.include_router(vertriebsgebiete_router)
api_router.include_router(legacy_stammdaten_router)
