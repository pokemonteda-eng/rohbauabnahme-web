from collections.abc import Generator

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.db import Base, get_db
from app.main import app

API_PREFIX = "/api/v1"


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


def _client() -> TestClient:
    session_local = _session_factory()

    def override_db() -> Generator[Session, None, None]:
        yield from _override_get_db(session_local)

    app.dependency_overrides[get_db] = override_db
    return TestClient(app)


def test_kunden_crud_flow() -> None:
    client = _client()

    create_response = client.post(
        f"{API_PREFIX}/kunden",
        json={
            "kunden_nr": "K-5000",
            "name": "Musterbau GmbH",
            "adresse": "Beispielweg 7, 10115 Berlin",
        },
    )
    assert create_response.status_code == 201
    created = create_response.json()
    kunde_id = created["id"]
    assert created["kunden_nr"] == "K-5000"

    list_response = client.get(f"{API_PREFIX}/kunden")
    assert list_response.status_code == 200
    kunden = list_response.json()
    assert len(kunden) == 1
    assert kunden[0]["id"] == kunde_id

    get_response = client.get(f"{API_PREFIX}/kunden/{kunde_id}")
    assert get_response.status_code == 200
    assert get_response.json()["name"] == "Musterbau GmbH"

    patch_response = client.patch(
        f"{API_PREFIX}/kunden/{kunde_id}",
        json={"name": "Musterbau AG", "adresse": "Ring 1, 20095 Hamburg"},
    )
    assert patch_response.status_code == 200
    patched = patch_response.json()
    assert patched["name"] == "Musterbau AG"
    assert patched["adresse"] == "Ring 1, 20095 Hamburg"
    assert patched["kunden_nr"] == "K-5000"

    delete_response = client.delete(f"{API_PREFIX}/kunden/{kunde_id}")
    assert delete_response.status_code == 204
    assert delete_response.content == b""

    missing_response = client.get(f"{API_PREFIX}/kunden/{kunde_id}")
    assert missing_response.status_code == 404

    app.dependency_overrides.clear()


def test_kunden_error_cases() -> None:
    client = _client()

    payload = {"kunden_nr": "K-6000", "name": "Alpha GmbH", "adresse": "Alpha-Str. 1"}
    assert client.post(f"{API_PREFIX}/kunden", json=payload).status_code == 201

    duplicate_response = client.post(f"{API_PREFIX}/kunden", json=payload)
    assert duplicate_response.status_code == 409

    empty_patch_response = client.patch(f"{API_PREFIX}/kunden/1", json={})
    assert empty_patch_response.status_code == 400

    patch_missing_response = client.patch(f"{API_PREFIX}/kunden/9999", json={"name": "Neu"})
    assert patch_missing_response.status_code == 404

    delete_missing_response = client.delete(f"{API_PREFIX}/kunden/9999")
    assert delete_missing_response.status_code == 404

    app.dependency_overrides.clear()
