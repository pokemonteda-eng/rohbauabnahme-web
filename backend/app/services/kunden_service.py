from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.kunde import Kunde
from app.schemas.kunde import KundeCreate, KundeUpdate


class KundeNotFoundError(Exception):
    pass


class KundeConflictError(Exception):
    pass


def list_kunden(db: Session, *, offset: int, limit: int) -> tuple[list[Kunde], int]:
    total = db.scalar(select(func.count()).select_from(Kunde)) or 0
    items = db.scalars(select(Kunde).order_by(Kunde.id).offset(offset).limit(limit)).all()
    return items, total


def create_kunde(db: Session, payload: KundeCreate) -> Kunde:
    kunde = Kunde(**payload.model_dump())
    db.add(kunde)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise KundeConflictError from exc
    db.refresh(kunde)
    return kunde


def get_kunde(db: Session, kunde_id: int) -> Kunde:
    kunde = db.get(Kunde, kunde_id)
    if kunde is None:
        raise KundeNotFoundError
    return kunde


def update_kunde(db: Session, kunde_id: int, payload: KundeUpdate) -> Kunde:
    kunde = get_kunde(db, kunde_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(kunde, field, value)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise KundeConflictError from exc
    db.refresh(kunde)
    return kunde


def delete_kunde(db: Session, kunde_id: int) -> None:
    kunde = get_kunde(db, kunde_id)
    db.delete(kunde)
    db.commit()

