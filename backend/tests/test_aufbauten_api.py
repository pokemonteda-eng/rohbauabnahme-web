from collections.abc import Generator
from io import BytesIO

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.db import Base, get_db
from app.main import app
from app.routers import aufbauten as aufbauten_router

API_PREFIX = "/api/v1"
PNG_BYTES = b"\x89PNG\r\n\x1a\n" + b"\x00" * 16


def _session_factory() -> sessionmaker[Session]:
    engine = create_engine(
        "sqlite+pysqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    return sessionmaker(bind=engine, autocommit=False, autoflush=False, class_=Session)


def _override_get_db(session_local: sessionmaker[Session]) -> Generator[Session, None, None]:
    db = session_local()
    try:
        yield db
    finally:
        db.close()


def _png_file(name: str = "aufbau.png") -> tuple[str, BytesIO, str]:
    return (name, BytesIO(PNG_BYTES), "image/png")


def test_create_update_delete_and_list_aufbauten(tmp_path) -> None:
    session_local = _session_factory()
    original_upload_directory = aufbauten_router.UPLOAD_DIRECTORY
    aufbauten_router.UPLOAD_DIRECTORY = tmp_path / "aufbauten"

    def override_db() -> Generator[Session, None, None]:
        yield from _override_get_db(session_local)

    app.dependency_overrides[get_db] = override_db
    client = TestClient(app)

    try:
        create_response = client.post(
            f"{API_PREFIX}/aufbauten",
            data={"name": "FB 500", "aktiv": "true"},
            files={"bild": _png_file()},
        )
        assert create_response.status_code == 201
        created = create_response.json()
        assert created["name"] == "FB 500"
        assert created["aktiv"] is True
        assert created["bild_url"].startswith("/uploads/aufbauten/")
        assert len(list((tmp_path / "aufbauten").glob("*.png"))) == 1

        list_response = client.get(f"{API_PREFIX}/aufbauten")
        assert list_response.status_code == 200
        assert [entry["name"] for entry in list_response.json()] == ["FB 500"]

        update_response = client.patch(
            f"{API_PREFIX}/aufbauten/{created['id']}",
            data={"name": "FB 500 XL", "aktiv": "false"},
            files={"bild": _png_file("ersatz.png")},
        )
        assert update_response.status_code == 200
        updated = update_response.json()
        assert updated["name"] == "FB 500 XL"
        assert updated["aktiv"] is False
        assert len(list((tmp_path / "aufbauten").glob("*.png"))) == 1

        delete_response = client.delete(f"{API_PREFIX}/aufbauten/{created['id']}")
        assert delete_response.status_code == 204
        assert client.get(f"{API_PREFIX}/aufbauten").json() == []
        assert list((tmp_path / "aufbauten").glob("*.png")) == []
    finally:
        app.dependency_overrides.clear()
        aufbauten_router.UPLOAD_DIRECTORY = original_upload_directory


def test_create_aufbau_rejects_duplicate_names_and_invalid_png(tmp_path) -> None:
    session_local = _session_factory()
    original_upload_directory = aufbauten_router.UPLOAD_DIRECTORY
    aufbauten_router.UPLOAD_DIRECTORY = tmp_path / "aufbauten"

    def override_db() -> Generator[Session, None, None]:
        yield from _override_get_db(session_local)

    app.dependency_overrides[get_db] = override_db
    client = TestClient(app)

    try:
        first_response = client.post(
            f"{API_PREFIX}/aufbauten",
            data={"name": "Container", "aktiv": "true"},
            files={"bild": _png_file()},
        )
        assert first_response.status_code == 201

        duplicate_response = client.post(
            f"{API_PREFIX}/aufbauten",
            data={"name": "Container", "aktiv": "true"},
            files={"bild": _png_file("duplicate.png")},
        )
        assert duplicate_response.status_code == 409
        assert duplicate_response.json()["detail"] == "Aufbau mit diesem Namen existiert bereits"

        invalid_response = client.post(
            f"{API_PREFIX}/aufbauten",
            data={"name": "Pritsche", "aktiv": "true"},
            files={"bild": ("bad.png", BytesIO(b"not-a-png"), "image/png")},
        )
        assert invalid_response.status_code == 400
        assert invalid_response.json()["detail"] == "Die hochgeladene Datei ist kein gueltiges PNG"
    finally:
        app.dependency_overrides.clear()
        aufbauten_router.UPLOAD_DIRECTORY = original_upload_directory


def test_create_aufbau_removes_uploaded_file_when_commit_fails(tmp_path, monkeypatch) -> None:
    session_local = _session_factory()
    original_upload_directory = aufbauten_router.UPLOAD_DIRECTORY
    aufbauten_router.UPLOAD_DIRECTORY = tmp_path / "aufbauten"

    def override_db() -> Generator[Session, None, None]:
        yield from _override_get_db(session_local)

    original_commit = Session.commit

    def failing_commit(self: Session) -> None:
        raise RuntimeError("database unavailable")

    app.dependency_overrides[get_db] = override_db
    monkeypatch.setattr(Session, "commit", failing_commit)
    client = TestClient(app)

    try:
        with pytest.raises(RuntimeError, match="database unavailable"):
            client.post(
                f"{API_PREFIX}/aufbauten",
                data={"name": "FB 500", "aktiv": "true"},
                files={"bild": _png_file()},
            )

        assert list((tmp_path / "aufbauten").glob("*.png")) == []
    finally:
        monkeypatch.setattr(Session, "commit", original_commit)
        app.dependency_overrides.clear()
        aufbauten_router.UPLOAD_DIRECTORY = original_upload_directory
