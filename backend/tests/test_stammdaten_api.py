from fastapi.testclient import TestClient

from app.main import app


def test_get_aufbautypen_returns_values() -> None:
    client = TestClient(app)
    response = client.get("/stammdaten/aufbautypen")

    assert response.status_code == 200
    assert response.json() == ["FB", "FZB", "Koffer", "Container", "Pritsche"]


def test_get_vertriebsgebiete_returns_values() -> None:
    client = TestClient(app)
    response = client.get("/stammdaten/vertriebsgebiete")

    assert response.status_code == 200
    assert response.json() == ["Nord", "Sued", "West", "Ost", "Mitte"]


def test_get_projektleiter_returns_values() -> None:
    client = TestClient(app)
    response = client.get("/stammdaten/projektleiter")

    assert response.status_code == 200
    assert response.json() == ["Max Mustermann", "Erika Musterfrau", "Thomas Beispiel"]
