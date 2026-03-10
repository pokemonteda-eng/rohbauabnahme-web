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


def get_aufbautypen() -> list[str]:
    return AUFBAUTYPEN


def get_vertriebsgebiete() -> list[str]:
    return VERTRIEBSGEBIETE


def get_projektleiter() -> list[str]:
    return PROJEKTLEITER


@router.get("/aufbautypen", response_model=list[str])
def list_aufbautypen() -> list[str]:
    return get_aufbautypen()


@router.get("/vertriebsgebiete", response_model=list[str])
def list_vertriebsgebiete() -> list[str]:
    return get_vertriebsgebiete()


@router.get("/projektleiter", response_model=list[str])
def list_projektleiter() -> list[str]:
    return get_projektleiter()
