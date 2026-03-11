import base64
import crypt
import hashlib
import hmac
import json
import secrets
from datetime import UTC, datetime, timedelta

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import settings

http_bearer = HTTPBearer(auto_error=False)
ACCESS_TOKEN_TYPE = "access"
REFRESH_TOKEN_TYPE = "refresh"
BCRYPT_PREFIXES = ("$2a$", "$2b$", "$2y$")


def _b64url_encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")


def _b64url_decode(raw: str) -> bytes:
    padding = "=" * (-len(raw) % 4)
    return base64.urlsafe_b64decode(f"{raw}{padding}")


def _verify_bcrypt_password(password: str, password_hash: str) -> bool | None:
    try:
        import bcrypt
    except ImportError:
        return None

    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def verify_password(password: str, password_hash: str) -> bool:
    if password_hash.startswith(BCRYPT_PREFIXES):
        bcrypt_result = _verify_bcrypt_password(password, password_hash)
        if bcrypt_result is not None:
            return bcrypt_result

    return crypt.crypt(password, password_hash) == password_hash


def authenticate_configured_user(username: str, password: str) -> dict[str, str] | None:
    if username != settings.auth_login_username:
        return None

    if not verify_password(password, settings.auth_login_password_hash):
        return None

    return {"sub": username, "role": "admin"}


def _sign_token(payload: dict[str, object]) -> str:
    encoded_header = _b64url_encode(
        json.dumps({"alg": "HS256", "typ": "JWT"}, separators=(",", ":")).encode("utf-8")
    )
    encoded_payload = _b64url_encode(
        json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
    )
    signing_input = f"{encoded_header}.{encoded_payload}".encode("ascii")
    signature = hmac.new(
        settings.jwt_secret_key.encode("utf-8"),
        signing_input,
        hashlib.sha256,
    ).digest()
    return f"{encoded_header}.{encoded_payload}.{_b64url_encode(signature)}"


def _build_token(subject: str, role: str, token_type: str, expires_in_minutes: int) -> tuple[str, datetime]:
    now = datetime.now(UTC)
    expires_at = now + timedelta(minutes=expires_in_minutes)
    payload = {
        "sub": subject,
        "role": role,
        "type": token_type,
        "jti": secrets.token_urlsafe(12),
        "iat": int(now.timestamp()),
        "exp": int(expires_at.timestamp()),
    }
    return _sign_token(payload), expires_at


def issue_token_pair(subject: str, role: str) -> dict[str, object]:
    access_token, _ = _build_token(
        subject=subject,
        role=role,
        token_type=ACCESS_TOKEN_TYPE,
        expires_in_minutes=settings.jwt_access_token_expire_minutes,
    )
    refresh_token, _ = _build_token(
        subject=subject,
        role=role,
        token_type=REFRESH_TOKEN_TYPE,
        expires_in_minutes=settings.jwt_refresh_token_expire_minutes,
    )
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": settings.jwt_access_token_expire_minutes * 60,
        "refresh_expires_in": settings.jwt_refresh_token_expire_minutes * 60,
    }


def decode_jwt(token: str, expected_type: str | None = None) -> dict[str, object]:
    try:
        encoded_header, encoded_payload, encoded_signature = token.split(".")
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Ungueltiges Zugriffstoken",
        ) from exc

    signing_input = f"{encoded_header}.{encoded_payload}".encode("ascii")
    expected_signature = hmac.new(
        settings.jwt_secret_key.encode("utf-8"),
        signing_input,
        hashlib.sha256,
    ).digest()

    try:
        header = json.loads(_b64url_decode(encoded_header))
        actual_signature = _b64url_decode(encoded_signature)
        payload = json.loads(_b64url_decode(encoded_payload))
    except (ValueError, json.JSONDecodeError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Ungueltiges Zugriffstoken",
        ) from exc

    if not isinstance(header, dict):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Ungueltiges Zugriffstoken",
        )

    if header.get("alg") != "HS256" or header.get("typ") != "JWT":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Ungueltiges Zugriffstoken",
        )

    if not isinstance(payload, dict):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Ungueltiges Zugriffstoken",
        )

    if not hmac.compare_digest(actual_signature, expected_signature):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Ungueltiges Zugriffstoken",
        )

    expires_at = payload.get("exp")
    if not isinstance(expires_at, int) or expires_at <= int(datetime.now(UTC).timestamp()):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token abgelaufen",
        )

    token_type = payload.get("type")
    if expected_type is not None and token_type != expected_type:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Ungueltiger Tokentyp",
        )

    if not isinstance(payload.get("sub"), str) or not isinstance(payload.get("role"), str):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Ungueltiges Zugriffstoken",
        )

    return payload


def require_access_token(
    credentials: HTTPAuthorizationCredentials | None = Depends(http_bearer),
) -> dict[str, object]:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentifizierung erforderlich",
        )

    return decode_jwt(credentials.credentials, expected_type=ACCESS_TOKEN_TYPE)
