from collections.abc import Generator

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.db import Base, get_db
from app.main import app


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


def _create_kunde(client: TestClient, kunden_nr: str = "K-9000") -> int:
    response = client.post(
        "/kunden",
        json={
            "kunden_nr": kunden_nr,
            "name": "Protokoll Testkunde",
            "adresse": "Abnahmeweg 42, 10115 Berlin",
        },
    )
    assert response.status_code == 201
    return response.json()["id"]


def test_create_get_and_list_protokolle() -> None:
    client = _client()
    kunde_id = _create_kunde(client)

    create_response = client.post(
        "/protokolle",
        json={
            "auftrags_nr": "A-10001",
            "kunde_id": kunde_id,
            "aufbautyp": "Container",
            "projektleiter": "Max Mustermann",
            "vertriebsgebiet": "Nord",
            "kabel_funklayout_geaendert": True,
            "techn_aenderungen": "Neue Kabeldurchfuehrung an Position 3",
            "datum": "2026-03-08",
            "anlage_datum": "2026-03-08",
        },
    )
    assert create_response.status_code == 201
    created = create_response.json()
    protokoll_id = created["id"]
    assert created["auftrags_nr"] == "A-10001"
    assert created["kunde_id"] == kunde_id
    assert created["kabel_funklayout_geaendert"] is True

    get_response = client.get(f"/protokolle/{protokoll_id}")
    assert get_response.status_code == 200
    assert get_response.json()["id"] == protokoll_id

    list_response = client.get("/protokolle")
    assert list_response.status_code == 200
    protokolle = list_response.json()
    assert len(protokolle) == 1
    assert protokolle[0]["id"] == protokoll_id

    app.dependency_overrides.clear()


def test_list_protokolle_with_pagination_and_404() -> None:
    client = _client()
    kunde_id = _create_kunde(client, kunden_nr="K-9001")

    for i in range(3):
        response = client.post(
            "/protokolle",
            json={
                "auftrags_nr": f"A-2000{i}",
                "kunde_id": kunde_id,
                "aufbautyp": "Koffer",
                "projektleiter": f"PL-{i}",
                "vertriebsgebiet": "Sued",
                "kabel_funklayout_geaendert": False,
                "techn_aenderungen": None,
                "datum": "2026-03-08",
                "anlage_datum": "2026-03-08",
            },
        )
        assert response.status_code == 201

    paged_response = client.get("/protokolle?skip=1&limit=1")
    assert paged_response.status_code == 200
    paged_items = paged_response.json()
    assert len(paged_items) == 1
    assert paged_items[0]["auftrags_nr"] == "A-20001"

    missing_response = client.get("/protokolle/9999")
    assert missing_response.status_code == 404

    app.dependency_overrides.clear()
