import base64
import hashlib
import hmac
import json

import pytest
from fastapi.testclient import TestClient

from app import auth as auth_module
from app.config import settings
from app.main import app

API_PREFIX = "/api/v1"
TEST_USERNAME = "admin"
TEST_PASSWORD = "admin"
TEST_PASSWORD_HASH = "$2b$12$C5WmrDo6ftE/lFt/w5klsOdAYeLRamb6Lo4fKi9KXUujXFwN2BB0C"
TEST_JWT_SECRET = "test-jwt-secret-for-auth-api"


def _b64url_encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")


def _sign_test_token(header: object, payload: object) -> str:
    encoded_header = _b64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    encoded_payload = _b64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signing_input = f"{encoded_header}.{encoded_payload}".encode("ascii")
    signature = hmac.new(
        settings.jwt_secret_key.encode("utf-8"),
        signing_input,
        hashlib.sha256,
    ).digest()
    return f"{encoded_header}.{encoded_payload}.{_b64url_encode(signature)}"


@pytest.fixture(autouse=True)
def configure_auth_settings(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "auth_login_username", TEST_USERNAME)
    monkeypatch.setattr(settings, "auth_login_password_hash", TEST_PASSWORD_HASH)
    monkeypatch.setattr(settings, "jwt_secret_key", TEST_JWT_SECRET)


def test_login_verify_and_refresh() -> None:
    client = TestClient(app)

    login_response = client.post(
        f"{API_PREFIX}/auth/login",
        json={"username": TEST_USERNAME, "password": TEST_PASSWORD},
    )
    assert login_response.status_code == 200
    login_payload = login_response.json()
    assert login_payload["token_type"] == "bearer"
    assert login_payload["username"] == TEST_USERNAME
    assert login_payload["role"] == "admin"
    assert login_payload["access_token"] != login_payload["refresh_token"]

    verify_response = client.get(
        f"{API_PREFIX}/auth/verify",
        headers={"Authorization": f"Bearer {login_payload['access_token']}"},
    )
    assert verify_response.status_code == 200
    verify_payload = verify_response.json()
    assert verify_payload["authenticated"] is True
    assert verify_payload["username"] == TEST_USERNAME
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
        json={"username": TEST_USERNAME, "password": "falsch"},
    )
    assert invalid_login_response.status_code == 401
    assert invalid_login_response.json()["detail"] == "Ungueltige Zugangsdaten"

    login_response = client.post(
        f"{API_PREFIX}/auth/login",
        json={"username": TEST_USERNAME, "password": TEST_PASSWORD},
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


def test_verify_rejects_malformed_token_payload_shape() -> None:
    client = TestClient(app)
    malformed_token = _sign_test_token(
        header={"alg": "HS256", "typ": "JWT"},
        payload=["not", "an", "object"],
    )

    response = client.get(
        f"{API_PREFIX}/auth/verify",
        headers={"Authorization": f"Bearer {malformed_token}"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Ungueltiges Zugriffstoken"


def test_verify_password_prefers_bcrypt_for_bcrypt_hashes(monkeypatch: pytest.MonkeyPatch) -> None:
    bcrypt = pytest.importorskip("bcrypt")

    password_hash = bcrypt.hashpw(b"admin", bcrypt.gensalt()).decode("utf-8")

    def fail_crypt(*args: object, **kwargs: object) -> str:
        raise AssertionError("crypt fallback should not be used for bcrypt hashes")

    monkeypatch.setattr(auth_module.crypt, "crypt", fail_crypt)

    assert auth_module.verify_password(TEST_PASSWORD, password_hash) is True


def test_login_rejects_invalid_bcrypt_hash_configuration(monkeypatch: pytest.MonkeyPatch) -> None:
    client = TestClient(app)
    monkeypatch.setattr(settings, "auth_login_password_hash", "$2b$12$invalid")

    response = client.post(
        f"{API_PREFIX}/auth/login",
        json={"username": TEST_USERNAME, "password": TEST_PASSWORD},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Ungueltige Zugangsdaten"


def test_login_rejects_when_admin_credentials_are_not_configured(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    client = TestClient(app)
    monkeypatch.setattr(settings, "auth_login_username", None)
    monkeypatch.setattr(settings, "auth_login_password_hash", None)

    response = client.post(
        f"{API_PREFIX}/auth/login",
        json={"username": TEST_USERNAME, "password": TEST_PASSWORD},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Ungueltige Zugangsdaten"
