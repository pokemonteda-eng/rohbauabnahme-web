from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import delete, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth import require_admin_access_token
from app.db import get_db
from app.models.vertriebsgebiet import Vertriebsgebiet

router = APIRouter(
    prefix="/vertriebsgebiete",
    tags=["vertriebsgebiete"],
    dependencies=[Depends(require_admin_access_token)],
)


class VertriebsgebietPayload(BaseModel):
    name: str = Field(min_length=1, max_length=255)


class VertriebsgebietUpdatePayload(BaseModel):
    version: int = Field(ge=1, description="Erwartete aktuelle Revision")
    name: str | None = Field(default=None, min_length=1, max_length=255)


class VertriebsgebietRead(BaseModel):
    id: int
    name: str
    version: int
    angelegt_am: datetime
    aktualisiert_am: datetime

    model_config = ConfigDict(from_attributes=True)


def _normalize_name(value: str) -> str:
    normalized = value.strip()
    if not normalized:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Name darf nicht leer sein")
    return normalized


def _ensure_unique_name(db: Session, name: str, gebiet_id: int | None = None) -> None:
    existing = db.scalar(select(Vertriebsgebiet).where(Vertriebsgebiet.name == name))
    if existing is None:
        return
    if gebiet_id is not None and existing.id == gebiet_id:
        return
    raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail="Vertriebsgebiet mit diesem Namen existiert bereits",
    )


def _serialize(gebiet: Vertriebsgebiet) -> VertriebsgebietRead:
    return VertriebsgebietRead(
        id=gebiet.id,
        name=gebiet.name,
        version=gebiet.version,
        angelegt_am=gebiet.angelegt_am,
        aktualisiert_am=gebiet.aktualisiert_am,
    )


@router.get(
    "",
    response_model=list[VertriebsgebietRead],
    summary="Listet alle Vertriebsgebiete fuer Admins",
)
def list_vertriebsgebiete(db: Session = Depends(get_db)) -> list[VertriebsgebietRead]:
    gebiete = db.scalars(select(Vertriebsgebiet).order_by(Vertriebsgebiet.name.asc(), Vertriebsgebiet.id.asc())).all()
    return [_serialize(g) for g in gebiete]


@router.post(
    "",
    response_model=VertriebsgebietRead,
    status_code=status.HTTP_201_CREATED,
    summary="Legt ein Vertriebsgebiet an",
    responses={409: {"description": "Conflict"}},
)
def create_vertriebsgebiet(payload: VertriebsgebietPayload, db: Session = Depends(get_db)) -> VertriebsgebietRead:
    normalized = _normalize_name(payload.name)
    _ensure_unique_name(db, normalized)
    gebiet = Vertriebsgebiet(name=normalized)
    db.add(gebiet)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Vertriebsgebiet mit diesem Namen existiert bereits",
        ) from None
    db.refresh(gebiet)
    return _serialize(gebiet)


@router.patch(
    "/{gebiet_id}",
    response_model=VertriebsgebietRead,
    summary="Aktualisiert ein Vertriebsgebiet mit Versionspruefung",
    responses={409: {"description": "Conflict"}},
)
def update_vertriebsgebiet(
    gebiet_id: int,
    payload: VertriebsgebietUpdatePayload,
    db: Session = Depends(get_db),
) -> VertriebsgebietRead:
    gebiet = db.get(Vertriebsgebiet, gebiet_id)
    if gebiet is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vertriebsgebiet nicht gefunden")

    if payload.name is not None:
        gebiet.name = _normalize_name(payload.name)
        _ensure_unique_name(db, gebiet.name, gebiet_id)

    next_version = payload.version + 1
    statement = (
        update(Vertriebsgebiet)
        .where(Vertriebsgebiet.id == gebiet_id, Vertriebsgebiet.version == payload.version)
        .values(
            name=gebiet.name,
            version=next_version,
            aktualisiert_am=datetime.utcnow(),
        )
    )

    try:
        result = db.execute(statement)
        if result.rowcount != 1:
            db.rollback()
            if db.get(Vertriebsgebiet, gebiet_id) is None:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vertriebsgebiet nicht gefunden")
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Vertriebsgebiet wurde zwischenzeitlich geaendert",
            )
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Vertriebsgebiet mit diesem Namen existiert bereits",
        ) from None

    updated = db.get(Vertriebsgebiet, gebiet_id)
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vertriebsgebiet nicht gefunden")
    return _serialize(updated)


@router.delete(
    "/{gebiet_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Loescht ein Vertriebsgebiet mit Versionspruefung",
    responses={409: {"description": "Conflict"}},
)
def delete_vertriebsgebiet(
    gebiet_id: int,
    version: int = Query(ge=1, description="Erwartete aktuelle Revision"),
    db: Session = Depends(get_db),
) -> None:
    statement = delete(Vertriebsgebiet).where(Vertriebsgebiet.id == gebiet_id, Vertriebsgebiet.version == version)
    result = db.execute(statement)
    if result.rowcount != 1:
        db.rollback()
        if db.get(Vertriebsgebiet, gebiet_id) is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vertriebsgebiet nicht gefunden")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Vertriebsgebiet wurde zwischenzeitlich geaendert",
        )
    db.commit()
