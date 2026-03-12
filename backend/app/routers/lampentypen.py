from datetime import datetime
from decimal import Decimal, InvalidOperation

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth import require_admin_access_token
from app.db import get_db
from app.models.lampentyp import Lampentyp

router = APIRouter(
    prefix="/lampen-typen",
    tags=["lampen-typen"],
    dependencies=[Depends(require_admin_access_token)],
)


class LampentypPayload(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    beschreibung: str = Field(min_length=1, max_length=5000)
    icon_url: str = Field(min_length=1, max_length=500)
    standard_preis: float = Field(ge=0)


class LampentypRead(BaseModel):
    id: int
    name: str
    beschreibung: str
    icon_url: str
    standard_preis: float
    angelegt_am: datetime
    aktualisiert_am: datetime

    model_config = ConfigDict(from_attributes=True)


def _normalize_payload(payload: LampentypPayload) -> LampentypPayload:
    normalized_name = payload.name.strip()
    normalized_beschreibung = payload.beschreibung.strip()
    normalized_icon_url = payload.icon_url.strip()

    if not normalized_name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Name darf nicht leer sein")
    if not normalized_beschreibung:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Beschreibung darf nicht leer sein")
    if not normalized_icon_url:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Icon-URL darf nicht leer sein")

    try:
        normalized_preis = Decimal(str(payload.standard_preis)).quantize(Decimal("0.01"))
    except InvalidOperation as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Standard-Preis ist ungueltig",
        ) from exc

    return LampentypPayload(
        name=normalized_name,
        beschreibung=normalized_beschreibung,
        icon_url=normalized_icon_url,
        standard_preis=float(normalized_preis),
    )


def _serialize_lampentyp(lampentyp: Lampentyp) -> LampentypRead:
    return LampentypRead(
        id=lampentyp.id,
        name=lampentyp.name,
        beschreibung=lampentyp.beschreibung,
        icon_url=lampentyp.icon_url,
        standard_preis=float(lampentyp.standard_preis),
        angelegt_am=lampentyp.angelegt_am,
        aktualisiert_am=lampentyp.aktualisiert_am,
    )


def _ensure_unique_name(db: Session, name: str, lampentyp_id: int | None = None) -> None:
    existing_lampentyp = db.scalar(select(Lampentyp).where(Lampentyp.name == name))
    if existing_lampentyp is None:
        return

    if lampentyp_id is not None and existing_lampentyp.id == lampentyp_id:
        return

    raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail="Lampentyp mit diesem Namen existiert bereits",
    )


def _commit_lampentyp_change(db: Session) -> None:
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Lampentyp mit diesem Namen existiert bereits",
        ) from None


@router.get("", response_model=list[LampentypRead])
def list_lampentypen(db: Session = Depends(get_db)) -> list[LampentypRead]:
    lampentypen = db.scalars(select(Lampentyp).order_by(Lampentyp.name.asc(), Lampentyp.id.asc())).all()
    return [_serialize_lampentyp(lampentyp) for lampentyp in lampentypen]


@router.post("", response_model=LampentypRead, status_code=status.HTTP_201_CREATED)
def create_lampentyp(payload: LampentypPayload, db: Session = Depends(get_db)) -> LampentypRead:
    normalized = _normalize_payload(payload)
    _ensure_unique_name(db, normalized.name)
    lampentyp = Lampentyp(
        name=normalized.name,
        beschreibung=normalized.beschreibung,
        icon_url=normalized.icon_url,
        standard_preis=Decimal(str(normalized.standard_preis)),
    )
    db.add(lampentyp)
    _commit_lampentyp_change(db)
    db.refresh(lampentyp)
    return _serialize_lampentyp(lampentyp)


@router.patch("/{lampentyp_id}", response_model=LampentypRead)
def update_lampentyp(
    lampentyp_id: int,
    payload: LampentypPayload,
    db: Session = Depends(get_db),
) -> LampentypRead:
    normalized = _normalize_payload(payload)
    lampentyp = db.get(Lampentyp, lampentyp_id)
    if lampentyp is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lampentyp nicht gefunden")

    _ensure_unique_name(db, normalized.name, lampentyp_id=lampentyp.id)
    lampentyp.name = normalized.name
    lampentyp.beschreibung = normalized.beschreibung
    lampentyp.icon_url = normalized.icon_url
    lampentyp.standard_preis = Decimal(str(normalized.standard_preis))
    _commit_lampentyp_change(db)
    db.refresh(lampentyp)
    return _serialize_lampentyp(lampentyp)
