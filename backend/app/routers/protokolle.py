from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.lackierungsdaten import Lackierungsdaten
from app.models.protokoll import Protokoll
from app.schemas.protokolle import (
    LackierungsdatenRead,
    LackierungsdatenSave,
    ProtokollCreate,
    ProtokollRead,
    ProtokollUpdate,
)
from app.services.validation_service import validate_lackierungsdaten

router = APIRouter(prefix="/protokolle", tags=["protokolle"])


@router.post("", response_model=ProtokollRead, status_code=status.HTTP_201_CREATED)
def create_protokoll(payload: ProtokollCreate, db: Session = Depends(get_db)) -> Protokoll:
    protokoll = Protokoll(**payload.model_dump())
    db.add(protokoll)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Protokoll konnte nicht gespeichert werden (duplizierte auftrags_nr oder ungueltige Referenz)",
        ) from None

    db.refresh(protokoll)
    return protokoll


@router.get("/{protokoll_id}", response_model=ProtokollRead)
def get_protokoll(protokoll_id: int, db: Session = Depends(get_db)) -> Protokoll:
    protokoll = db.get(Protokoll, protokoll_id)
    if protokoll is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Protokoll nicht gefunden")
    return protokoll


@router.get("", response_model=list[ProtokollRead])
def list_protokolle(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=200),
    db: Session = Depends(get_db),
) -> list[Protokoll]:
    return db.scalars(select(Protokoll).order_by(Protokoll.id).offset(skip).limit(limit)).all()


@router.patch("/{protokoll_id}", response_model=ProtokollRead)
def update_protokoll(
    protokoll_id: int,
    payload: ProtokollUpdate,
    db: Session = Depends(get_db),
) -> Protokoll:
    protokoll = db.get(Protokoll, protokoll_id)
    if protokoll is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Protokoll nicht gefunden")

    update_data = payload.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mindestens ein Feld muss angegeben werden",
        )

    for key, value in update_data.items():
        setattr(protokoll, key, value)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ungueltige Protokoll-Daten",
        ) from None

    db.refresh(protokoll)
    return protokoll


@router.put("/{protokoll_id}/lackierungsdaten", response_model=LackierungsdatenRead)
def save_lackierungsdaten(
    protokoll_id: int,
    payload: LackierungsdatenSave,
    db: Session = Depends(get_db),
) -> Lackierungsdaten:
    protokoll = db.get(Protokoll, protokoll_id)
    if protokoll is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Protokoll nicht gefunden")

    validate_lackierungsdaten(payload)
    data = payload.model_dump()

    for note_field in ("klarlackschicht_bemerkung", "zinkstaub_bemerkung", "e_kolben_bemerkung"):
        value = data[note_field]
        if value is None:
            continue
        cleaned = value.strip()
        data[note_field] = cleaned or None

    lackierungsdaten = db.scalar(select(Lackierungsdaten).where(Lackierungsdaten.protokoll_id == protokoll_id))

    is_new_row = lackierungsdaten is None
    if is_new_row:
        lackierungsdaten = Lackierungsdaten(protokoll_id=protokoll_id, **data)
        db.add(lackierungsdaten)
    else:
        for key, value in data.items():
            setattr(lackierungsdaten, key, value)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()

        if not is_new_row:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Lackierungsdaten konnten nicht gespeichert werden",
            ) from None

        lackierungsdaten = db.scalar(select(Lackierungsdaten).where(Lackierungsdaten.protokoll_id == protokoll_id))
        if lackierungsdaten is None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Lackierungsdaten konnten nicht gespeichert werden",
            ) from None

        for key, value in data.items():
            setattr(lackierungsdaten, key, value)

        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Lackierungsdaten konnten nicht gespeichert werden",
            ) from None

    db.refresh(lackierungsdaten)
    return lackierungsdaten


@router.get("/{protokoll_id}/lackierungsdaten", response_model=LackierungsdatenRead)
def get_lackierungsdaten(protokoll_id: int, db: Session = Depends(get_db)) -> Lackierungsdaten:
    protokoll = db.get(Protokoll, protokoll_id)
    if protokoll is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Protokoll nicht gefunden")

    lackierungsdaten = db.scalar(
        select(Lackierungsdaten).where(Lackierungsdaten.protokoll_id == protokoll_id)
    )
    if lackierungsdaten is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lackierungsdaten nicht gefunden")

    return lackierungsdaten
