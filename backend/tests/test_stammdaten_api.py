from fastapi.testclient import TestClient

from app.main import app

EXPECTED_AUFBAUTYPEN = ["FB", "FZB", "Koffer", "Container", "Pritsche"]
EXPECTED_VERTRIEBSGEBIETE = ["Nord", "Sued", "West", "Ost", "Mitte"]
EXPECTED_PROJEKTLEITER = ["Max Mustermann", "Erika Musterfrau", "Thomas Beispiel"]


def test_get_aufbautypen_returns_values() -> None:
    client = TestClient(app)
    response = client.get("/stammdaten/aufbautypen")

    assert response.status_code == 200
    assert response.json() == EXPECTED_AUFBAUTYPEN


def test_get_vertriebsgebiete_returns_values() -> None:
    client = TestClient(app)
    response = client.get("/stammdaten/vertriebsgebiete")

    assert response.status_code == 200
    assert response.json() == EXPECTED_VERTRIEBSGEBIETE


def test_get_projektleiter_returns_values() -> None:
    client = TestClient(app)
    response = client.get("/stammdaten/projektleiter")

    assert response.status_code == 200
    assert response.json() == EXPECTED_PROJEKTLEITER


def test_non_masterdata_routes_require_api_prefix() -> None:
    client = TestClient(app)

    assert client.get("/kunden").status_code == 404
    assert client.get("/protokolle").status_code == 404


def test_get_health_returns_status_without_api_prefix() -> None:
    client = TestClient(app)
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_get_health_returns_status_with_api_prefix() -> None:
    client = TestClient(app)
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_get_aufbautypen_returns_values_with_api_prefix() -> None:
    client = TestClient(app)
    response = client.get("/api/v1/stammdaten/aufbautypen")

    assert response.status_code == 200
    assert response.json() == EXPECTED_AUFBAUTYPEN


def test_get_vertriebsgebiete_returns_values_with_api_prefix() -> None:
    client = TestClient(app)
    response = client.get("/api/v1/stammdaten/vertriebsgebiete")

    assert response.status_code == 200
    assert response.json() == EXPECTED_VERTRIEBSGEBIETE


def test_get_projektleiter_returns_values_with_api_prefix() -> None:
    client = TestClient(app)
    response = client.get("/api/v1/stammdaten/projektleiter")

    assert response.status_code == 200
    assert response.json() == EXPECTED_PROJEKTLEITER
