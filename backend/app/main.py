from fastapi import FastAPI

from app.config import settings
from app.routers.api import api_router
from app.routers.health import router as health_router
from app.routers.stammdaten import (
    get_aufbautypen,
    get_projektleiter,
    get_vertriebsgebiete,
)

app = FastAPI(title=settings.app_name, version=settings.app_version)

app.include_router(health_router)
app.include_router(api_router)

# Keep backward-compatible dropdown aliases outside the versioned router wiring.
app.add_api_route(
    "/stammdaten/aufbautypen",
    get_aufbautypen,
    methods=["GET"],
    response_model=list[str],
    include_in_schema=False,
)
app.add_api_route(
    "/stammdaten/vertriebsgebiete",
    get_vertriebsgebiete,
    methods=["GET"],
    response_model=list[str],
    include_in_schema=False,
)
app.add_api_route(
    "/stammdaten/projektleiter",
    get_projektleiter,
    methods=["GET"],
    response_model=list[str],
    include_in_schema=False,
)
