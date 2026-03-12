import base64
import hashlib
import hmac
import importlib
import json
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

API_PREFIX = "/api/v1"
TEST_USERNAME = "admin"
TEST_PASSWORD = "admin"
TEST_PASSWORD_HASH = "$2b$12$C5WmrDo6ftE/lFt/w5klsOdAYeLRamb6Lo4fKi9KXUujXFwN2BB0C"
TEST_JWT_SECRET = "test-jwt-secret-for-auth-api"
BACKEND_ROOT = Path(__file__).resolve().parents[1]
AUTH_ENV_VARS = (
    "AUTH_LOGIN_USERNAME",
    "AUTH_LOGIN_PASSWORD_HASH",
    "JWT_SECRET_KEY",
)


def _b64url_encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")


def _clear_app_modules() -> None:
    for module_name in list(sys.modules):
        if module_name == "app" or module_name.startswith("app."):
            sys.modules.pop(module_name, None)


def _ensure_backend_on_syspath() -> None:
    backend_root = str(BACKEND_ROOT)
    if backend_root not in sys.path:
        sys.path.insert(0, backend_root)


def _load_auth_app(
    monkeypatch: pytest.MonkeyPatch,
    *,
    username: str | None = TEST_USERNAME,
    password_hash: str | None = TEST_PASSWORD_HASH,
    jwt_secret_key: str | None = TEST_JWT_SECRET,
) -> tuple[object, object, object, object]:
    _ensure_backend_on_syspath()

    for env_var in AUTH_ENV_VARS:
        monkeypatch.delenv(env_var, raising=False)

    if username is not None:
        monkeypatch.setenv("AUTH_LOGIN_USERNAME", username)
    if password_hash is not None:
        monkeypatch.setenv("AUTH_LOGIN_PASSWORD_HASH", password_hash)
    if jwt_secret_key is not None:
        monkeypatch.setenv("JWT_SECRET_KEY", jwt_secret_key)

    _clear_app_modules()

    config_module = importlib.import_module("app.config")
    auth_module = importlib.import_module("app.auth")
    main_module = importlib.import_module("app.main")
    return config_module, config_module.get_settings(), auth_module, main_module.app


def _sign_test_token(header: object, payload: object, jwt_secret_key: str) -> str:
    encoded_header = _b64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    encoded_payload = _b64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signing_input = f"{encoded_header}.{encoded_payload}".encode("ascii")
    signature = hmac.new(
        jwt_secret_key.encode("utf-8"),
        signing_input,
        hashlib.sha256,
    ).digest()
    return f"{encoded_header}.{encoded_payload}.{_b64url_encode(signature)}"


def test_app_start_fails_without_required_auth_env(monkeypatch: pytest.MonkeyPatch) -> None:
    _ensure_backend_on_syspath()

    for env_var in AUTH_ENV_VARS:
        monkeypatch.delenv(env_var, raising=False)

    _clear_app_modules()

    with pytest.raises(ValidationError) as exc_info:
        importlib.import_module("app.main")

    assert "AUTH_LOGIN_USERNAME muss gesetzt sein." in str(exc_info.value)


def test_login_verify_and_refresh_with_env_config(monkeypatch: pytest.MonkeyPatch) -> None:
    _config_module, settings, _auth_module, app = _load_auth_app(monkeypatch)
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
    assert settings.jwt_secret_key == TEST_JWT_SECRET


def test_auth_rejects_invalid_credentials_and_wrong_token_type(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _config_module, _settings, _auth_module, app = _load_auth_app(monkeypatch)
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


def test_verify_rejects_malformed_token_payload_shape(monkeypatch: pytest.MonkeyPatch) -> None:
    _config_module, settings, _auth_module, app = _load_auth_app(monkeypatch)
    client = TestClient(app)
    malformed_token = _sign_test_token(
        header={"alg": "HS256", "typ": "JWT"},
        payload=["not", "an", "object"],
        jwt_secret_key=settings.jwt_secret_key,
    )

    response = client.get(
        f"{API_PREFIX}/auth/verify",
        headers={"Authorization": f"Bearer {malformed_token}"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Ungueltiges Zugriffstoken"


def test_verify_password_prefers_bcrypt_for_bcrypt_hashes(monkeypatch: pytest.MonkeyPatch) -> None:
    _config_module, _settings, auth_module, _app = _load_auth_app(monkeypatch)
    bcrypt = pytest.importorskip("bcrypt")

    password_hash = bcrypt.hashpw(b"admin", bcrypt.gensalt()).decode("utf-8")

    def fail_crypt(*args: object, **kwargs: object) -> str:
        raise AssertionError("crypt fallback should not be used for bcrypt hashes")

    monkeypatch.setattr(auth_module.crypt, "crypt", fail_crypt)

    assert auth_module.verify_password(TEST_PASSWORD, password_hash) is True


def test_login_rejects_invalid_bcrypt_hash_configuration(monkeypatch: pytest.MonkeyPatch) -> None:
    _config_module, settings, _auth_module, app = _load_auth_app(monkeypatch)
    client = TestClient(app)
    monkeypatch.setattr(settings, "auth_login_password_hash", "$2b$12$invalid")

    response = client.post(
        f"{API_PREFIX}/auth/login",
        json={"username": TEST_USERNAME, "password": TEST_PASSWORD},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Ungueltige Zugangsdaten"


@pytest.mark.parametrize(
    ("env_var", "env_value", "expected_message"),
    [
        ("AUTH_LOGIN_USERNAME", None, "AUTH_LOGIN_USERNAME muss gesetzt sein."),
        ("AUTH_LOGIN_USERNAME", "   ", "AUTH_LOGIN_USERNAME darf nicht leer sein."),
        ("AUTH_LOGIN_PASSWORD_HASH", None, "AUTH_LOGIN_PASSWORD_HASH muss gesetzt sein."),
        ("AUTH_LOGIN_PASSWORD_HASH", "   ", "AUTH_LOGIN_PASSWORD_HASH darf nicht leer sein."),
        ("JWT_SECRET_KEY", None, "JWT_SECRET_KEY muss gesetzt sein."),
        ("JWT_SECRET_KEY", "", "JWT_SECRET_KEY darf nicht leer sein."),
    ],
)
def test_app_start_rejects_missing_or_empty_auth_env_values(
    monkeypatch: pytest.MonkeyPatch,
    env_var: str,
    env_value: str | None,
    expected_message: str,
) -> None:
    _ensure_backend_on_syspath()

    monkeypatch.setenv("AUTH_LOGIN_USERNAME", TEST_USERNAME)
    monkeypatch.setenv("AUTH_LOGIN_PASSWORD_HASH", TEST_PASSWORD_HASH)
    monkeypatch.setenv("JWT_SECRET_KEY", TEST_JWT_SECRET)

    if env_value is None:
        monkeypatch.delenv(env_var, raising=False)
    else:
        monkeypatch.setenv(env_var, env_value)

    _clear_app_modules()

    with pytest.raises(ValidationError) as exc_info:
        importlib.import_module("app.main")

    assert expected_message in str(exc_info.value)


def test_issue_token_pair_fails_at_runtime_when_jwt_secret_is_empty(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _config_module, settings, auth_module, _app = _load_auth_app(monkeypatch)
    monkeypatch.setattr(settings, "jwt_secret_key", "   ")

    with pytest.raises(RuntimeError) as exc_info:
        auth_module.issue_token_pair(subject=TEST_USERNAME, role="admin")

    assert "JWT_SECRET_KEY darf nicht leer sein." in str(exc_info.value)


def test_authenticate_configured_user_fails_at_runtime_when_password_hash_is_empty(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _config_module, settings, auth_module, _app = _load_auth_app(monkeypatch)
    monkeypatch.setattr(settings, "auth_login_password_hash", "")

    with pytest.raises(RuntimeError) as exc_info:
        auth_module.authenticate_configured_user(TEST_USERNAME, TEST_PASSWORD)

    assert "AUTH_LOGIN_PASSWORD_HASH muss gesetzt sein." in str(exc_info.value)
