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


def test_create_and_list_kunden() -> None:
    session_local = _session_factory()
    def override_db() -> Generator[Session, None, None]:
        yield from _override_get_db(session_local)

    app.dependency_overrides[get_db] = override_db

    client = TestClient(app)

    payload = {
        "kunden_nr": "K-2000",
        "name": "Test AG",
        "adresse": "Testweg 5, 80331 Muenchen",
    }
    create_response = client.post(f"{API_PREFIX}/kunden", json=payload)
    assert create_response.status_code == 201

    created = create_response.json()
    assert created["id"] > 0
    assert created["kunden_nr"] == payload["kunden_nr"]

    list_response = client.get(f"{API_PREFIX}/kunden")
    assert list_response.status_code == 200
    kunden = list_response.json()
    assert len(kunden) == 1
    assert kunden[0]["name"] == payload["name"]

    app.dependency_overrides.clear()


def test_get_kunde_by_id_and_404() -> None:
    session_local = _session_factory()
    def override_db() -> Generator[Session, None, None]:
        yield from _override_get_db(session_local)

    app.dependency_overrides[get_db] = override_db

    client = TestClient(app)

    create_response = client.post(
        f"{API_PREFIX}/kunden",
        json={
            "kunden_nr": "K-3000",
            "name": "Abnahme GmbH",
            "adresse": "Hafenstr. 12, 20457 Hamburg",
        },
    )
    kunde_id = create_response.json()["id"]

    get_response = client.get(f"{API_PREFIX}/kunden/{kunde_id}")
    assert get_response.status_code == 200
    assert get_response.json()["id"] == kunde_id

    missing_response = client.get(f"{API_PREFIX}/kunden/9999")
    assert missing_response.status_code == 404

    app.dependency_overrides.clear()
