from fastapi import APIRouter

router = APIRouter(prefix="/master-data", tags=["master-data"])
legacy_router = APIRouter(prefix="/stammdaten", include_in_schema=False)

AUFBAUTYPEN = [
    "FB",
    "FZB",
    "Koffer",
    "Container",
    "Pritsche",
]

VERTRIEBSGEBIETE = [
    "Nord",
    "Sued",
    "West",
    "Ost",
    "Mitte",
]

PROJEKTLEITER = [
    "Max Mustermann",
    "Erika Musterfrau",
    "Thomas Beispiel",
]


def get_aufbautypen() -> list[str]:
    return AUFBAUTYPEN.copy()


def get_vertriebsgebiete() -> list[str]:
    return VERTRIEBSGEBIETE.copy()


def get_projektleiter() -> list[str]:
    return PROJEKTLEITER.copy()


@router.get("/aufbautypen", response_model=list[str])
def list_aufbautypen() -> list[str]:
    return get_aufbautypen()


@legacy_router.get("/aufbautypen", response_model=list[str])
def list_legacy_aufbautypen() -> list[str]:
    return get_aufbautypen()


@router.get("/vertriebsgebiete", response_model=list[str])
def list_vertriebsgebiete() -> list[str]:
    return get_vertriebsgebiete()


@legacy_router.get("/vertriebsgebiete", response_model=list[str])
def list_legacy_vertriebsgebiete() -> list[str]:
    return get_vertriebsgebiete()


@router.get("/projektleiter", response_model=list[str])
def list_projektleiter() -> list[str]:
    return get_projektleiter()


@legacy_router.get("/projektleiter", response_model=list[str])
def list_legacy_projektleiter() -> list[str]:
    return get_projektleiter()
