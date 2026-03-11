from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.aufbau import Aufbau
from app.schemas.aufbauten import AufbauRead

router = APIRouter(prefix="/aufbauten", tags=["aufbauten"])

UPLOAD_DIRECTORY = Path(__file__).resolve().parents[2] / "uploads" / "aufbauten"
PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"


def _public_image_url(bild_pfad: str) -> str:
    return f"/uploads/{bild_pfad}"


def _serialize_aufbau(aufbau: Aufbau) -> AufbauRead:
    return AufbauRead(
        id=aufbau.id,
        name=aufbau.name,
        bild_pfad=aufbau.bild_pfad,
        bild_url=_public_image_url(aufbau.bild_pfad),
        aktiv=aufbau.aktiv,
        angelegt_am=aufbau.angelegt_am,
        aktualisiert_am=aufbau.aktualisiert_am,
    )


def _validate_png(upload: UploadFile, content: bytes) -> None:
    filename = (upload.filename or "").lower()
    if not filename.endswith(".png"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Es sind nur PNG-Dateien erlaubt",
        )

    if upload.content_type not in {None, "", "image/png"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Es sind nur PNG-Dateien erlaubt",
        )

    if not content.startswith(PNG_SIGNATURE):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Die hochgeladene Datei ist kein gueltiges PNG",
        )


def _normalize_name(value: str) -> str:
    normalized = value.strip()
    if not normalized:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Name darf nicht leer sein",
        )
    return normalized


def _store_png(upload: UploadFile) -> str:
    content = upload.file.read()
    _validate_png(upload, content)

    UPLOAD_DIRECTORY.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid4().hex}.png"
    relative_path = Path("aufbauten") / filename
    target_path = UPLOAD_DIRECTORY / filename
    target_path.write_bytes(content)
    return relative_path.as_posix()


def _delete_image_if_present(bild_pfad: str) -> None:
    target_path = UPLOAD_DIRECTORY.parent / bild_pfad
    if target_path.exists():
        target_path.unlink()


@router.get("", response_model=list[AufbauRead])
def list_aufbauten(db: Session = Depends(get_db)) -> list[AufbauRead]:
    aufbauten = db.scalars(select(Aufbau).order_by(Aufbau.name.asc(), Aufbau.id.asc())).all()
    return [_serialize_aufbau(aufbau) for aufbau in aufbauten]


@router.post("", response_model=AufbauRead, status_code=status.HTTP_201_CREATED)
def create_aufbau(
    name: str = Form(..., min_length=1, max_length=255),
    aktiv: bool = Form(True),
    bild: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> AufbauRead:
    normalized_name = _normalize_name(name)
    bild_pfad = _store_png(bild)
    aufbau = Aufbau(name=normalized_name, aktiv=aktiv, bild_pfad=bild_pfad)
    db.add(aufbau)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        _delete_image_if_present(bild_pfad)
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Aufbau mit diesem Namen existiert bereits",
        ) from None

    db.refresh(aufbau)
    return _serialize_aufbau(aufbau)


@router.patch("/{aufbau_id}", response_model=AufbauRead)
def update_aufbau(
    aufbau_id: int,
    name: str = Form(..., min_length=1, max_length=255),
    aktiv: bool = Form(...),
    bild: UploadFile | None = File(default=None),
    db: Session = Depends(get_db),
) -> AufbauRead:
    aufbau = db.get(Aufbau, aufbau_id)
    if aufbau is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Aufbau nicht gefunden")

    normalized_name = _normalize_name(name)
    previous_image = aufbau.bild_pfad
    replacement_image: str | None = None

    if bild is not None:
        replacement_image = _store_png(bild)
        aufbau.bild_pfad = replacement_image

    aufbau.name = normalized_name
    aufbau.aktiv = aktiv

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        if replacement_image is not None:
            _delete_image_if_present(replacement_image)
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Aufbau mit diesem Namen existiert bereits",
        ) from None

    if replacement_image is not None and previous_image != replacement_image:
        _delete_image_if_present(previous_image)

    db.refresh(aufbau)
    return _serialize_aufbau(aufbau)


@router.delete("/{aufbau_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_aufbau(aufbau_id: int, db: Session = Depends(get_db)) -> None:
    aufbau = db.get(Aufbau, aufbau_id)
    if aufbau is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Aufbau nicht gefunden")

    bild_pfad = aufbau.bild_pfad
    db.delete(aufbau)
    db.commit()
    _delete_image_if_present(bild_pfad)
