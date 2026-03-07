from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas.kunde import KundeCreate, KundeListResponse, KundeRead, KundeUpdate
from app.services.kunden_service import (
    KundeConflictError,
    KundeNotFoundError,
    create_kunde as create_kunde_service,
    delete_kunde as delete_kunde_service,
    get_kunde as get_kunde_service,
    list_kunden as list_kunden_service,
    update_kunde as update_kunde_service,
)

router = APIRouter(prefix="/api/v1/kunden", tags=["kunden"])


@router.get("", response_model=KundeListResponse)
def list_kunden(
    offset: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
) -> KundeListResponse:
    if limit < 1 or limit > 100:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="limit muss 1-100 sein")
    if offset < 0:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="offset muss >= 0 sein")

    items, total = list_kunden_service(db, offset=offset, limit=limit)
    return KundeListResponse(items=items, total=total, offset=offset, limit=limit)


@router.post("", response_model=KundeRead, status_code=status.HTTP_201_CREATED)
def create_kunde(payload: KundeCreate, db: Session = Depends(get_db)) -> KundeRead:
    try:
        return create_kunde_service(db, payload)
    except KundeConflictError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Kunde mit dieser kunden_nr existiert bereits",
        ) from None


@router.get("/{kunde_id}", response_model=KundeRead)
def get_kunde(kunde_id: int, db: Session = Depends(get_db)) -> KundeRead:
    try:
        return get_kunde_service(db, kunde_id)
    except KundeNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kunde nicht gefunden")


@router.patch("/{kunde_id}", response_model=KundeRead)
def update_kunde(kunde_id: int, payload: KundeUpdate, db: Session = Depends(get_db)) -> KundeRead:
    try:
        return update_kunde_service(db, kunde_id, payload)
    except KundeNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kunde nicht gefunden")
    except KundeConflictError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Kunde mit dieser kunden_nr existiert bereits",
        ) from None


@router.delete("/{kunde_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_kunde(kunde_id: int, db: Session = Depends(get_db)) -> None:
    try:
        delete_kunde_service(db, kunde_id)
    except KundeNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kunde nicht gefunden")
