from collections.abc import Generator
from decimal import Decimal

from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.db import Base, get_db
from app.main import app
from app.models.zubehoer_auswahl import ZubehoerAuswahl
from app.models.zubehoer_katalog import ZubehoerKatalog


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


def _client_with_session() -> tuple[TestClient, sessionmaker[Session]]:
    session_local = _session_factory()

    def override_db() -> Generator[Session, None, None]:
        yield from _override_get_db(session_local)

    app.dependency_overrides[get_db] = override_db
    return TestClient(app), session_local


def _client() -> TestClient:
    client, _ = _client_with_session()
    return client


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


def test_create_protokoll_allows_nullable_technical_fields() -> None:
    client = _client()
    kunde_id = _create_kunde(client, kunden_nr="K-9002")

    create_response = client.post(
        "/protokolle",
        json={
            "auftrags_nr": "A-30001",
            "kunde_id": kunde_id,
            "aufbautyp": "Koffer",
            "projektleiter": "PL-Nullable",
            "vertriebsgebiet": "West",
            "kabel_funklayout_geaendert": None,
            "techn_aenderungen": None,
            "datum": None,
            "anlage_datum": "2026-03-08",
        },
    )
    assert create_response.status_code == 201
    payload = create_response.json()
    assert payload["kabel_funklayout_geaendert"] is None
    assert payload["techn_aenderungen"] is None
    assert payload["datum"] is None

    app.dependency_overrides.clear()


def test_update_protokoll_partial_success() -> None:
    client = _client()
    kunde_id = _create_kunde(client, kunden_nr="K-9003")

    create_response = client.post(
        "/protokolle",
        json={
            "auftrags_nr": "A-40001",
            "kunde_id": kunde_id,
            "aufbautyp": "Container",
            "projektleiter": "PL-Alt",
            "vertriebsgebiet": "Nord",
            "kabel_funklayout_geaendert": False,
            "techn_aenderungen": None,
            "datum": "2026-03-08",
            "anlage_datum": "2026-03-08",
        },
    )
    assert create_response.status_code == 201
    protokoll_id = create_response.json()["id"]

    update_response = client.patch(
        f"/protokolle/{protokoll_id}",
        json={
            "projektleiter": "PL-Neu",
            "kabel_funklayout_geaendert": True,
            "techn_aenderungen": "Nachtrag",
        },
    )
    assert update_response.status_code == 200
    updated = update_response.json()
    assert updated["id"] == protokoll_id
    assert updated["projektleiter"] == "PL-Neu"
    assert updated["kabel_funklayout_geaendert"] is True
    assert updated["techn_aenderungen"] == "Nachtrag"
    assert updated["aufbautyp"] == "Container"
    assert updated["vertriebsgebiet"] == "Nord"

    app.dependency_overrides.clear()


def test_update_protokoll_returns_404_when_missing() -> None:
    client = _client()
    response = client.patch("/protokolle/9999", json={"projektleiter": "Unbekannt"})
    assert response.status_code == 404

    app.dependency_overrides.clear()


def test_update_protokoll_returns_400_for_empty_payload() -> None:
    client = _client()
    kunde_id = _create_kunde(client, kunden_nr="K-9004")
    create_response = client.post(
        "/protokolle",
        json={
            "auftrags_nr": "A-40002",
            "kunde_id": kunde_id,
            "aufbautyp": "Koffer",
            "projektleiter": "PL-Test",
            "vertriebsgebiet": "West",
            "kabel_funklayout_geaendert": False,
            "techn_aenderungen": None,
            "datum": "2026-03-08",
            "anlage_datum": "2026-03-08",
        },
    )
    assert create_response.status_code == 201
    protokoll_id = create_response.json()["id"]

    response = client.patch(f"/protokolle/{protokoll_id}", json={})
    assert response.status_code == 400

    app.dependency_overrides.clear()


def test_save_and_get_lackierungsdaten() -> None:
    client = _client()
    kunde_id = _create_kunde(client, kunden_nr="K-9005")
    create_response = client.post(
        "/protokolle",
        json={
            "auftrags_nr": "A-50001",
            "kunde_id": kunde_id,
            "aufbautyp": "Container",
            "projektleiter": "PL-Lack",
            "vertriebsgebiet": "Nord",
            "kabel_funklayout_geaendert": False,
            "techn_aenderungen": None,
            "datum": "2026-03-08",
            "anlage_datum": "2026-03-08",
        },
    )
    assert create_response.status_code == 201
    protokoll_id = create_response.json()["id"]

    save_response = client.put(
        f"/protokolle/{protokoll_id}/lackierungsdaten",
        json={
            "klarlackschicht": True,
            "klarlackschicht_bemerkung": " Decklack aufgetragen ",
            "zinkstaubbeschichtung": False,
            "zinkstaub_bemerkung": None,
            "e_kolben_beschichtung": True,
            "e_kolben_bemerkung": "Erledigt",
        },
    )
    assert save_response.status_code == 200
    saved_payload = save_response.json()
    assert saved_payload["protokoll_id"] == protokoll_id
    assert saved_payload["klarlackschicht"] is True
    assert saved_payload["klarlackschicht_bemerkung"] == "Decklack aufgetragen"
    assert saved_payload["e_kolben_beschichtung"] is True
    assert saved_payload["e_kolben_bemerkung"] == "Erledigt"

    load_response = client.get(f"/protokolle/{protokoll_id}/lackierungsdaten")
    assert load_response.status_code == 200
    loaded_payload = load_response.json()
    assert loaded_payload["id"] == saved_payload["id"]
    assert loaded_payload["klarlackschicht_bemerkung"] == "Decklack aufgetragen"
    assert loaded_payload["e_kolben_bemerkung"] == "Erledigt"

    app.dependency_overrides.clear()


def test_save_lackierungsdaten_second_put_updates_existing_row() -> None:
    client = _client()
    kunde_id = _create_kunde(client, kunden_nr="K-9007")
    create_response = client.post(
        "/protokolle",
        json={
            "auftrags_nr": "A-50003",
            "kunde_id": kunde_id,
            "aufbautyp": "Container",
            "projektleiter": "PL-Lack-Update",
            "vertriebsgebiet": "Nord",
            "kabel_funklayout_geaendert": False,
            "techn_aenderungen": None,
            "datum": "2026-03-08",
            "anlage_datum": "2026-03-08",
        },
    )
    assert create_response.status_code == 201
    protokoll_id = create_response.json()["id"]

    first_save = client.put(
        f"/protokolle/{protokoll_id}/lackierungsdaten",
        json={
            "klarlackschicht": True,
            "klarlackschicht_bemerkung": "Erster Stand",
            "zinkstaubbeschichtung": False,
            "zinkstaub_bemerkung": None,
            "e_kolben_beschichtung": False,
            "e_kolben_bemerkung": None,
        },
    )
    assert first_save.status_code == 200
    first_payload = first_save.json()

    second_save = client.put(
        f"/protokolle/{protokoll_id}/lackierungsdaten",
        json={
            "klarlackschicht": False,
            "klarlackschicht_bemerkung": None,
            "zinkstaubbeschichtung": True,
            "zinkstaub_bemerkung": "Zweiter Stand",
            "e_kolben_beschichtung": False,
            "e_kolben_bemerkung": None,
        },
    )
    assert second_save.status_code == 200
    second_payload = second_save.json()
    assert second_payload["id"] == first_payload["id"]
    assert second_payload["protokoll_id"] == protokoll_id
    assert second_payload["klarlackschicht"] is False
    assert second_payload["zinkstaubbeschichtung"] is True
    assert second_payload["zinkstaub_bemerkung"] == "Zweiter Stand"

    app.dependency_overrides.clear()


def test_save_lackierungsdaten_rejects_note_without_checkbox() -> None:
    client = _client()
    kunde_id = _create_kunde(client, kunden_nr="K-9006")
    create_response = client.post(
        "/protokolle",
        json={
            "auftrags_nr": "A-50002",
            "kunde_id": kunde_id,
            "aufbautyp": "Koffer",
            "projektleiter": "PL-Lack-Error",
            "vertriebsgebiet": "West",
            "kabel_funklayout_geaendert": False,
            "techn_aenderungen": None,
            "datum": "2026-03-08",
            "anlage_datum": "2026-03-08",
        },
    )
    assert create_response.status_code == 201
    protokoll_id = create_response.json()["id"]

    response = client.put(
        f"/protokolle/{protokoll_id}/lackierungsdaten",
        json={
            "klarlackschicht": False,
            "klarlackschicht_bemerkung": "Darf so nicht gesetzt sein",
            "zinkstaubbeschichtung": False,
            "zinkstaub_bemerkung": None,
            "e_kolben_beschichtung": False,
            "e_kolben_bemerkung": None,
        },
    )
    assert response.status_code == 400
    assert "klarlackschicht_bemerkung" in response.json()["detail"]

    app.dependency_overrides.clear()


def test_save_lackierungsdaten_rejects_partial_payload() -> None:
    client = _client()
    kunde_id = _create_kunde(client, kunden_nr="K-9008")
    create_response = client.post(
        "/protokolle",
        json={
            "auftrags_nr": "A-50004",
            "kunde_id": kunde_id,
            "aufbautyp": "Koffer",
            "projektleiter": "PL-Lack-Partial",
            "vertriebsgebiet": "West",
            "kabel_funklayout_geaendert": False,
            "techn_aenderungen": None,
            "datum": "2026-03-08",
            "anlage_datum": "2026-03-08",
        },
    )
    assert create_response.status_code == 201
    protokoll_id = create_response.json()["id"]

    response = client.put(
        f"/protokolle/{protokoll_id}/lackierungsdaten",
        json={"klarlackschicht": True},
    )
    assert response.status_code == 422

    app.dependency_overrides.clear()


def test_save_lackierungsdaten_rejects_unknown_fields() -> None:
    client = _client()
    kunde_id = _create_kunde(client, kunden_nr="K-9009")
    create_response = client.post(
        "/protokolle",
        json={
            "auftrags_nr": "A-50005",
            "kunde_id": kunde_id,
            "aufbautyp": "Koffer",
            "projektleiter": "PL-Lack-Unknown",
            "vertriebsgebiet": "West",
            "kabel_funklayout_geaendert": False,
            "techn_aenderungen": None,
            "datum": "2026-03-08",
            "anlage_datum": "2026-03-08",
        },
    )
    assert create_response.status_code == 201
    protokoll_id = create_response.json()["id"]

    response = client.put(
        f"/protokolle/{protokoll_id}/lackierungsdaten",
        json={
            "klarlackschicht": True,
            "klarlackschicht_bemerkung": "ok",
            "zinkstaubbeschichtung": False,
            "zinkstaub_bemerkung": None,
            "e_kolben_beschichtung": False,
            "e_kolben_bemerkung": None,
            "klarlackschicht_bemerkunng": "typo",
        },
    )
    assert response.status_code == 422

    app.dependency_overrides.clear()


def test_lackierungsdaten_endpoints_return_409_for_duplicate_rows() -> None:
    client, session_local = _client_with_session()
    kunde_id = _create_kunde(client, kunden_nr="K-9010")
    create_response = client.post(
        "/protokolle",
        json={
            "auftrags_nr": "A-50006",
            "kunde_id": kunde_id,
            "aufbautyp": "Container",
            "projektleiter": "PL-Lack-Duplicate",
            "vertriebsgebiet": "Nord",
            "kabel_funklayout_geaendert": False,
            "techn_aenderungen": None,
            "datum": "2026-03-08",
            "anlage_datum": "2026-03-08",
        },
    )
    assert create_response.status_code == 201
    protokoll_id = create_response.json()["id"]

    with session_local() as db:
        db.execute(text("DROP INDEX IF EXISTS ix_lackierungsdaten_protokoll_id"))
        db.execute(
            text(
                """
                INSERT INTO lackierungsdaten (
                    protokoll_id,
                    klarlackschicht,
                    klarlackschicht_bemerkung,
                    zinkstaubbeschichtung,
                    zinkstaub_bemerkung,
                    e_kolben_beschichtung,
                    e_kolben_bemerkung
                ) VALUES
                    (:protokoll_id, 0, NULL, 0, NULL, 0, NULL),
                    (:protokoll_id, 1, 'Duplikat', 1, 'Duplikat', 1, 'Duplikat')
                """
            ),
            {"protokoll_id": protokoll_id},
        )
        db.commit()

    get_response = client.get(f"/protokolle/{protokoll_id}/lackierungsdaten")
    assert get_response.status_code == 409
    assert "Inkonsistente Lackierungsdaten" in get_response.json()["detail"]

    save_response = client.put(
        f"/protokolle/{protokoll_id}/lackierungsdaten",
        json={
            "klarlackschicht": True,
            "klarlackschicht_bemerkung": "Neu",
            "zinkstaubbeschichtung": False,
            "zinkstaub_bemerkung": None,
            "e_kolben_beschichtung": False,
            "e_kolben_bemerkung": None,
        },
    )
    assert save_response.status_code == 409
    assert "Inkonsistente Lackierungsdaten" in save_response.json()["detail"]

    app.dependency_overrides.clear()


def test_get_zubehoer_preisberechnung_returns_net_total_for_protocol() -> None:
    client, session_local = _client_with_session()
    kunde_id = _create_kunde(client, kunden_nr="K-9011")

    create_response = client.post(
        "/protokolle",
        json={
            "auftrags_nr": "A-60001",
            "kunde_id": kunde_id,
            "aufbautyp": "Container",
            "projektleiter": "PL-Zubehoer",
            "vertriebsgebiet": "Nord",
            "kabel_funklayout_geaendert": False,
            "techn_aenderungen": None,
            "datum": "2026-03-10",
            "anlage_datum": "2026-03-10",
        },
    )
    assert create_response.status_code == 201
    protokoll_id = create_response.json()["id"]

    with session_local() as db:
        katalog_a = ZubehoerKatalog(
            kategorie="Aufbau",
            bezeichnung="Leiter",
            standard_preis=Decimal("15.50"),
        )
        katalog_b = ZubehoerKatalog(
            kategorie="Rahmen",
            bezeichnung="Staukasten",
            standard_preis=Decimal("22.00"),
        )
        db.add_all([katalog_a, katalog_b])
        db.flush()
        db.add_all(
            [
                ZubehoerAuswahl(
                    protokoll_id=protokoll_id,
                    katalog_id=katalog_a.id,
                    menge=2,
                    einzelpreis=Decimal("12.00"),
                    bewertung="TEA",
                    kunden_beigestellt=False,
                ),
                ZubehoerAuswahl(
                    protokoll_id=protokoll_id,
                    katalog_id=katalog_b.id,
                    menge=1,
                    einzelpreis=None,
                    bewertung="TEK",
                    kunden_beigestellt=True,
                ),
            ]
        )
        db.commit()

    response = client.get(f"/protokolle/{protokoll_id}/zubehoer/preisberechnung")

    assert response.status_code == 200
    payload = response.json()
    assert payload["protokoll_id"] == protokoll_id
    assert payload["netto_gesamt"] == "24.00"
    assert payload["preis_tea"] == "24.00"
    assert payload["preis_tek"] == "0.00"
    assert payload["positionen"] == [
        {
            "auswahl_id": 1,
            "katalog_id": 1,
            "kategorie": "Aufbau",
            "bezeichnung": "Leiter",
            "menge": 2,
            "einzelpreis_netto": "12.00",
            "bewertung": "TEA",
            "kunden_beigestellt": False,
            "gesamtpreis_netto": "24.00",
        },
        {
            "auswahl_id": 2,
            "katalog_id": 2,
            "kategorie": "Rahmen",
            "bezeichnung": "Staukasten",
            "menge": 1,
            "einzelpreis_netto": "0.00",
            "bewertung": "TEK",
            "kunden_beigestellt": True,
            "gesamtpreis_netto": "0.00",
        },
    ]

    app.dependency_overrides.clear()


def test_get_zubehoer_preisberechnung_returns_404_for_missing_protocol() -> None:
    client = _client()

    response = client.get("/protokolle/9999/zubehoer/preisberechnung")

    assert response.status_code == 404

    app.dependency_overrides.clear()
