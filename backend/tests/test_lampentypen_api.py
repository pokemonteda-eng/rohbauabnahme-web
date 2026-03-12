import base64
import hashlib
import hmac
import json
import os
import subprocess
from collections.abc import Generator
from pathlib import Path

from fastapi.testclient import TestClient
from sqlalchemy import create_engine, inspect
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app import models
from app.config import settings
from app.db import Base, get_db
from app.main import app

API_PREFIX = "/api/v1/lampen-typen"


def _b64url_encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")


def _sign_access_token(subject: str, role: str) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "sub": subject,
        "role": role,
        "type": "access",
        "jti": "test-token",
        "iat": 1,
        "exp": 4102444800,
    }
    encoded_header = _b64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    encoded_payload = _b64url_encode(
        json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
    )
    signing_input = f"{encoded_header}.{encoded_payload}".encode("ascii")
    signature = hmac.new(
        settings.jwt_secret_key.encode("utf-8"),
        signing_input,
        hashlib.sha256,
    ).digest()
    return f"{encoded_header}.{encoded_payload}.{_b64url_encode(signature)}"


def _auth_header(role: str = "admin") -> dict[str, str]:
    return {"Authorization": f"Bearer {_sign_access_token('test-user', role)}"}


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


def _backend_dir() -> Path:
    return Path(__file__).resolve().parents[1]


def _database_env(db_path: Path) -> dict[str, str]:
    env = os.environ.copy()
    env["DATABASE_URL"] = f"sqlite:///{db_path}"
    return env


def _run_alembic(backend_dir: Path, *args: str, env: dict[str, str] | None = None) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [
            "python3",
            "-m",
            "alembic",
            "-c",
            str(backend_dir / "alembic.ini"),
            *args,
        ],
        cwd=backend_dir,
        env=env,
        check=True,
        capture_output=True,
        text=True,
    )


def test_lampentyp_routes_require_admin_authentication() -> None:
    client = TestClient(app)
    payload = {
        "name": "Heckblitzer",
        "beschreibung": "Kompakter LED-Blitzer fuer das Heck.",
        "icon_url": "https://cdn.example.com/icons/heckblitzer.png",
        "standard_preis": 149.9,
    }

    missing_list_response = client.get(API_PREFIX)
    assert missing_list_response.status_code == 401
    assert missing_list_response.json()["detail"] == "Authentifizierung erforderlich"

    missing_auth_response = client.post(API_PREFIX, json=payload)
    assert missing_auth_response.status_code == 401
    assert missing_auth_response.json()["detail"] == "Authentifizierung erforderlich"

    forbidden_list_response = client.get(
        API_PREFIX,
        headers=_auth_header(role="viewer"),
    )
    assert forbidden_list_response.status_code == 403
    assert forbidden_list_response.json()["detail"] == "Admin-Berechtigung erforderlich"

    forbidden_response = client.post(
        API_PREFIX,
        json=payload,
        headers=_auth_header(role="viewer"),
    )
    assert forbidden_response.status_code == 403
    assert forbidden_response.json()["detail"] == "Admin-Berechtigung erforderlich"


def test_create_update_and_list_lampentypen() -> None:
    session_local = _session_factory()

    def override_db() -> Generator[Session, None, None]:
        yield from _override_get_db(session_local)

    app.dependency_overrides[get_db] = override_db
    client = TestClient(app)

    try:
        create_response = client.post(
            API_PREFIX,
            json={
                "name": "Heckblitzer",
                "beschreibung": "Kompakter LED-Blitzer fuer das Heck.",
                "icon_url": "https://cdn.example.com/icons/heckblitzer.png",
                "standard_preis": 149.9,
            },
            headers=_auth_header(),
        )
        assert create_response.status_code == 201
        created = create_response.json()
        assert created["name"] == "Heckblitzer"
        assert created["beschreibung"] == "Kompakter LED-Blitzer fuer das Heck."
        assert created["icon_url"] == "https://cdn.example.com/icons/heckblitzer.png"
        assert created["standard_preis"] == 149.9

        update_response = client.patch(
            f"{API_PREFIX}/{created['id']}",
            json={
                "name": "Heckblitzer Plus",
                "beschreibung": "Kompakter LED-Blitzer fuer Heck und Seitenbereich.",
                "icon_url": "https://cdn.example.com/icons/heckblitzer-plus.png",
                "standard_preis": 189.4,
            },
            headers=_auth_header(),
        )
        assert update_response.status_code == 200
        updated = update_response.json()
        assert updated["name"] == "Heckblitzer Plus"
        assert updated["icon_url"] == "https://cdn.example.com/icons/heckblitzer-plus.png"
        assert updated["standard_preis"] == 189.4

        second_response = client.post(
            API_PREFIX,
            json={
                "name": "Arbeitsscheinwerfer",
                "beschreibung": "Breiter Lichtkegel fuer den Arbeitsbereich.",
                "icon_url": "https://cdn.example.com/icons/arbeitsscheinwerfer.png",
                "standard_preis": 99,
            },
            headers=_auth_header(),
        )
        assert second_response.status_code == 201

        list_response = client.get(API_PREFIX, headers=_auth_header())
        assert list_response.status_code == 200
        assert [entry["name"] for entry in list_response.json()] == ["Arbeitsscheinwerfer", "Heckblitzer Plus"]
    finally:
        app.dependency_overrides.clear()


def test_lampentypen_reject_duplicate_names_and_missing_records() -> None:
    session_local = _session_factory()

    def override_db() -> Generator[Session, None, None]:
        yield from _override_get_db(session_local)

    app.dependency_overrides[get_db] = override_db
    client = TestClient(app)

    try:
        first_response = client.post(
            API_PREFIX,
            json={
                "name": "Frontblitzer",
                "beschreibung": "Frontwarnleuchte mit schmalem Aufbau.",
                "icon_url": "https://cdn.example.com/icons/frontblitzer.png",
                "standard_preis": 79.5,
            },
            headers=_auth_header(),
        )
        assert first_response.status_code == 201

        duplicate_response = client.post(
            API_PREFIX,
            json={
                "name": "Frontblitzer",
                "beschreibung": "Alternative Beschreibung.",
                "icon_url": "https://cdn.example.com/icons/frontblitzer-alt.png",
                "standard_preis": 89.5,
            },
            headers=_auth_header(),
        )
        assert duplicate_response.status_code == 409
        assert duplicate_response.json()["detail"] == "Lampentyp mit diesem Namen existiert bereits"

        second_response = client.post(
            API_PREFIX,
            json={
                "name": "Heckblitzer",
                "beschreibung": "Warnleuchte fuer den Heckbereich.",
                "icon_url": "https://cdn.example.com/icons/heckblitzer.png",
                "standard_preis": 99.5,
            },
            headers=_auth_header(),
        )
        assert second_response.status_code == 201

        duplicate_update_response = client.patch(
            f"{API_PREFIX}/{second_response.json()['id']}",
            json={
                "name": "Frontblitzer",
                "beschreibung": "Soll auf bestehenden Namen kollidieren.",
                "icon_url": "https://cdn.example.com/icons/heckblitzer.png",
                "standard_preis": 99.5,
            },
            headers=_auth_header(),
        )
        assert duplicate_update_response.status_code == 409
        assert duplicate_update_response.json()["detail"] == "Lampentyp mit diesem Namen existiert bereits"

        missing_response = client.patch(
            f"{API_PREFIX}/9999",
            json={
                "name": "Nicht vorhanden",
                "beschreibung": "Sollte 404 liefern.",
                "icon_url": "https://cdn.example.com/icons/missing.png",
                "standard_preis": 1,
            },
            headers=_auth_header(),
        )
        assert missing_response.status_code == 404
        assert missing_response.json()["detail"] == "Lampentyp nicht gefunden"
    finally:
        app.dependency_overrides.clear()


def test_lampentypen_returns_conflict_when_commit_hits_unique_constraint() -> None:
    session_local = _session_factory()
    db = session_local()

    def override_db() -> Generator[Session, None, None]:
        try:
            yield db
        finally:
            db.close()

    def failing_commit() -> None:
        raise IntegrityError("insert into lampen_typen", {}, Exception("duplicate key"))

    app.dependency_overrides[get_db] = override_db
    original_commit = db.commit
    db.commit = failing_commit  # type: ignore[method-assign]
    client = TestClient(app)

    try:
        response = client.post(
            API_PREFIX,
            json={
                "name": "Frontblitzer",
                "beschreibung": "Frontwarnleuchte mit schmalem Aufbau.",
                "icon_url": "https://cdn.example.com/icons/frontblitzer.png",
                "standard_preis": 79.5,
            },
            headers=_auth_header(),
        )
        assert response.status_code == 409
        assert response.json()["detail"] == "Lampentyp mit diesem Namen existiert bereits"
    finally:
        db.commit = original_commit  # type: ignore[method-assign]
        app.dependency_overrides.clear()


def test_lampen_typen_migration_creates_expected_schema(tmp_path: Path) -> None:
    backend_dir = _backend_dir()
    db_path = tmp_path / "lampen_typen.db"

    _run_alembic(backend_dir, "upgrade", "head", env=_database_env(db_path))

    engine = create_engine(f"sqlite+pysqlite:///{db_path}")
    inspector = inspect(engine)
    columns = {column["name"]: column for column in inspector.get_columns("lampen_typen")}

    assert set(columns) == {
        "id",
        "name",
        "beschreibung",
        "icon_url",
        "standard_preis",
        "angelegt_am",
        "aktualisiert_am",
    }
    assert columns["name"]["nullable"] is False
    assert columns["beschreibung"]["nullable"] is False
    assert columns["icon_url"]["nullable"] is False
    assert columns["standard_preis"]["nullable"] is False
    unique_constraints = {
        tuple(constraint["column_names"])
        for constraint in inspector.get_unique_constraints("lampen_typen")
        if constraint.get("column_names")
    }
    assert ("name",) in unique_constraints


def test_models_package_exports_lampentyp() -> None:
    assert "Lampentyp" in models.__all__
    assert models.Lampentyp.__tablename__ == "lampen_typen"
