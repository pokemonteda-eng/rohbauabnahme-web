from fastapi.testclient import TestClient

from app.main import app

EXPECTED_AUFBAUTYPEN = ["FB", "FZB", "Koffer", "Container", "Pritsche"]
EXPECTED_VERTRIEBSGEBIETE = ["Nord", "Sued", "West", "Ost", "Mitte"]
EXPECTED_PROJEKTLEITER = ["Max Mustermann", "Erika Musterfrau", "Thomas Beispiel"]


def test_unversioned_aufbautypen_route_is_not_available() -> None:
    client = TestClient(app)
    response = client.get("/stammdaten/aufbautypen")

    assert response.status_code == 404


def test_unversioned_vertriebsgebiete_route_is_not_available() -> None:
    client = TestClient(app)
    response = client.get("/stammdaten/vertriebsgebiete")

    assert response.status_code == 404


def test_unversioned_projektleiter_route_is_not_available() -> None:
    client = TestClient(app)
    response = client.get("/stammdaten/projektleiter")

    assert response.status_code == 404


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
    response = client.get("/api/v1/master-data/aufbautypen")

    assert response.status_code == 200
    assert response.json() == EXPECTED_AUFBAUTYPEN


def test_get_vertriebsgebiete_returns_values_with_api_prefix() -> None:
    client = TestClient(app)
    response = client.get("/api/v1/master-data/vertriebsgebiete")

    assert response.status_code == 200
    assert response.json() == EXPECTED_VERTRIEBSGEBIETE


def test_get_projektleiter_returns_values_with_api_prefix() -> None:
    client = TestClient(app)
    response = client.get("/api/v1/master-data/projektleiter")

    assert response.status_code == 200
    assert response.json() == EXPECTED_PROJEKTLEITER


def test_legacy_versioned_stammdaten_routes_remain_available() -> None:
    client = TestClient(app)

    assert client.get("/api/v1/stammdaten/aufbautypen").json() == EXPECTED_AUFBAUTYPEN
    assert client.get("/api/v1/stammdaten/vertriebsgebiete").json() == EXPECTED_VERTRIEBSGEBIETE
    assert client.get("/api/v1/stammdaten/projektleiter").json() == EXPECTED_PROJEKTLEITER


def test_openapi_exposes_only_versioned_master_data_routes() -> None:
    client = TestClient(app)
    response = client.get("/openapi.json")

    assert response.status_code == 200
    paths = response.json()["paths"]

    assert "/api/v1/master-data/aufbautypen" in paths
    assert "/api/v1/master-data/vertriebsgebiete" in paths
    assert "/api/v1/master-data/projektleiter" in paths
    assert "/api/v1/stammdaten/aufbautypen" not in paths
    assert "/api/v1/stammdaten/vertriebsgebiete" not in paths
    assert "/api/v1/stammdaten/projektleiter" not in paths
    assert "/stammdaten/aufbautypen" not in paths
    assert "/stammdaten/vertriebsgebiete" not in paths
    assert "/stammdaten/projektleiter" not in paths
