from fastapi.testclient import TestClient

from app.main import app

API_PREFIX = "/api/v1"


def test_login_verify_and_refresh() -> None:
    client = TestClient(app)

    login_response = client.post(
        f"{API_PREFIX}/auth/login",
        json={"username": "admin", "password": "admin"},
    )
    assert login_response.status_code == 200
    login_payload = login_response.json()
    assert login_payload["token_type"] == "bearer"
    assert login_payload["username"] == "admin"
    assert login_payload["role"] == "admin"
    assert login_payload["access_token"] != login_payload["refresh_token"]

    verify_response = client.get(
        f"{API_PREFIX}/auth/verify",
        headers={"Authorization": f"Bearer {login_payload['access_token']}"},
    )
    assert verify_response.status_code == 200
    verify_payload = verify_response.json()
    assert verify_payload["authenticated"] is True
    assert verify_payload["username"] == "admin"
    assert verify_payload["role"] == "admin"
    assert verify_payload["token_type"] == "access"

    refresh_response = client.post(
        f"{API_PREFIX}/auth/refresh",
        json={"refresh_token": login_payload["refresh_token"]},
    )
    assert refresh_response.status_code == 200
    refresh_payload = refresh_response.json()
    assert refresh_payload["access_token"] != login_payload["access_token"]
    assert refresh_payload["refresh_token"] != login_payload["refresh_token"]


def test_auth_rejects_invalid_credentials_and_wrong_token_type() -> None:
    client = TestClient(app)

    invalid_login_response = client.post(
        f"{API_PREFIX}/auth/login",
        json={"username": "admin", "password": "falsch"},
    )
    assert invalid_login_response.status_code == 401
    assert invalid_login_response.json()["detail"] == "Ungueltige Zugangsdaten"

    login_response = client.post(
        f"{API_PREFIX}/auth/login",
        json={"username": "admin", "password": "admin"},
    )
    assert login_response.status_code == 200

    wrong_type_response = client.post(
        f"{API_PREFIX}/auth/refresh",
        json={"refresh_token": login_response.json()["access_token"]},
    )
    assert wrong_type_response.status_code == 401
    assert wrong_type_response.json()["detail"] == "Ungueltiger Tokentyp"

    missing_auth_response = client.get(f"{API_PREFIX}/auth/verify")
    assert missing_auth_response.status_code == 401
    assert missing_auth_response.json()["detail"] == "Authentifizierung erforderlich"
