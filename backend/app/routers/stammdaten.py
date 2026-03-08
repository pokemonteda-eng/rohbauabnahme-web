from fastapi import APIRouter

router = APIRouter(prefix="/stammdaten", tags=["stammdaten"])

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


@router.get("/aufbautypen", response_model=list[str])
def list_aufbautypen() -> list[str]:
    return AUFBAUTYPEN


@router.get("/vertriebsgebiete", response_model=list[str])
def list_vertriebsgebiete() -> list[str]:
    return VERTRIEBSGEBIETE


@router.get("/projektleiter", response_model=list[str])
def list_projektleiter() -> list[str]:
    return PROJEKTLEITER
