from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.db import Base, get_db
from app.main import app

EXPECTED_AUFBAUTYPEN = ["FB", "FZB", "Koffer", "Container", "Pritsche"]
EXPECTED_VERTRIEBSGEBIETE = ["Nord", "Sued", "West", "Ost", "Mitte"]
EXPECTED_PROJEKTLEITER = ["Max Mustermann", "Erika Musterfrau", "Thomas Beispiel"]


def _session_factory() -> sessionmaker[Session]:
    engine = create_engine(
        "sqlite+pysqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    return sessionmaker(bind=engine, autocommit=False, autoflush=False, class_=Session)


def test_unversioned_aufbautypen_route_remains_available() -> None:
    client = TestClient(app)
    response = client.get("/stammdaten/aufbautypen")

    assert response.status_code == 200
    assert response.json() == EXPECTED_AUFBAUTYPEN


def test_unversioned_vertriebsgebiete_route_remains_available() -> None:
    client = TestClient(app)
    response = client.get("/stammdaten/vertriebsgebiete")

    assert response.status_code == 200
    assert response.json() == EXPECTED_VERTRIEBSGEBIETE


def test_unversioned_projektleiter_route_remains_available() -> None:
    client = TestClient(app)
    response = client.get("/stammdaten/projektleiter")

    assert response.status_code == 200
    assert response.json() == EXPECTED_PROJEKTLEITER


def test_existing_root_kunden_and_protokolle_routes_remain_available() -> None:
    client = TestClient(app)

    assert client.post("/kunden", json={}).status_code == 422
    assert client.post("/protokolle", json={}).status_code == 422


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

    aufbautypen_response = client.get("/api/v1/stammdaten/aufbautypen")
    vertriebsgebiete_response = client.get("/api/v1/stammdaten/vertriebsgebiete")
    projektleiter_response = client.get("/api/v1/stammdaten/projektleiter")

    assert aufbautypen_response.status_code == 200
    assert aufbautypen_response.json() == EXPECTED_AUFBAUTYPEN
    assert vertriebsgebiete_response.status_code == 200
    assert vertriebsgebiete_response.json() == EXPECTED_VERTRIEBSGEBIETE
    assert projektleiter_response.status_code == 200
    assert projektleiter_response.json() == EXPECTED_PROJEKTLEITER


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


def test_get_aufbautypen_prefers_active_admin_aufbauten() -> None:
    session_local = _session_factory()

    def override_db():
        db = session_local()
        try:
            db.execute(
                text(
                    """
                INSERT INTO aufbauten (name, bild_pfad, aktiv)
                VALUES ('Container XL', 'aufbauten/container-xl.png', 1),
                       ('FB Basic', 'aufbauten/fb-basic.png', 0),
                       ('Koffer S', 'aufbauten/koffer-s.png', 1)
                    """
                )
            )
            db.commit()
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_db
    client = TestClient(app)

    response = client.get("/api/v1/master-data/aufbautypen")

    assert response.status_code == 200
    assert response.json() == ["Container XL", "Koffer S"]

    app.dependency_overrides.clear()
