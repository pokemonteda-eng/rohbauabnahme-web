from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.kunde import Kunde
from app.schemas.kunden import KundeCreate, KundeRead, KundeUpdate

router = APIRouter(prefix="/kunden", tags=["kunden"])


@router.get("", response_model=list[KundeRead])
def list_kunden(db: Session = Depends(get_db)) -> list[Kunde]:
    return db.scalars(select(Kunde).order_by(Kunde.id)).all()


@router.post("", response_model=KundeRead, status_code=status.HTTP_201_CREATED)
def create_kunde(payload: KundeCreate, db: Session = Depends(get_db)) -> Kunde:
    kunde = Kunde(**payload.model_dump())
    db.add(kunde)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Kunde mit dieser kunden_nr existiert bereits",
        ) from None
    db.refresh(kunde)
    return kunde


@router.get("/{kunde_id}", response_model=KundeRead)
def get_kunde(kunde_id: int, db: Session = Depends(get_db)) -> Kunde:
    kunde = db.get(Kunde, kunde_id)
    if kunde is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kunde nicht gefunden")
    return kunde


@router.patch("/{kunde_id}", response_model=KundeRead)
def update_kunde(kunde_id: int, payload: KundeUpdate, db: Session = Depends(get_db)) -> Kunde:
    kunde = db.get(Kunde, kunde_id)
    if kunde is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kunde nicht gefunden")

    update_data = payload.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mindestens ein Feld muss angegeben werden",
        )

    for key, value in update_data.items():
        setattr(kunde, key, value)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Kunde mit dieser kunden_nr existiert bereits",
        ) from None

    db.refresh(kunde)
    return kunde


@router.delete("/{kunde_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_kunde(kunde_id: int, db: Session = Depends(get_db)) -> None:
    kunde = db.get(Kunde, kunde_id)
    if kunde is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kunde nicht gefunden")

    db.delete(kunde)
    db.commit()
