from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.aufbau import Aufbau

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


def get_aufbautypen(db: Session) -> list[str]:
    try:
        values = db.scalars(
            select(Aufbau.name).where(Aufbau.aktiv.is_(True)).order_by(Aufbau.name.asc(), Aufbau.id.asc())
        ).all()
    except OperationalError:
        return AUFBAUTYPEN.copy()

    if values:
        return values
    return AUFBAUTYPEN.copy()


def get_vertriebsgebiete() -> list[str]:
    return VERTRIEBSGEBIETE.copy()


def get_projektleiter() -> list[str]:
    return PROJEKTLEITER.copy()


@router.get("/aufbautypen", response_model=list[str])
def list_aufbautypen(db: Session = Depends(get_db)) -> list[str]:
    return get_aufbautypen(db)


@legacy_router.get("/aufbautypen", response_model=list[str])
def list_legacy_aufbautypen(db: Session = Depends(get_db)) -> list[str]:
    return get_aufbautypen(db)


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
