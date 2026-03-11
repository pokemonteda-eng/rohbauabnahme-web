from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.auth import (
    authenticate_configured_user,
    decode_jwt,
    issue_token_pair,
    require_access_token,
)

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    username: str = Field(min_length=1)
    password: str = Field(min_length=1)


class RefreshRequest(BaseModel):
    refresh_token: str = Field(min_length=1)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    expires_in: int
    refresh_expires_in: int
    username: str
    role: str


class VerifyResponse(BaseModel):
    authenticated: bool
    username: str
    role: str
    token_type: str
    expires_at: str


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest) -> TokenResponse:
    user = authenticate_configured_user(payload.username, payload.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Ungueltige Zugangsdaten",
        )

    tokens = issue_token_pair(subject=user["sub"], role=user["role"])
    return TokenResponse(**tokens, username=user["sub"], role=user["role"])


@router.post("/refresh", response_model=TokenResponse)
def refresh(payload: RefreshRequest) -> TokenResponse:
    token_payload = decode_jwt(payload.refresh_token, expected_type="refresh")
    tokens = issue_token_pair(subject=token_payload["sub"], role=token_payload["role"])
    return TokenResponse(**tokens, username=token_payload["sub"], role=token_payload["role"])


@router.get("/verify", response_model=VerifyResponse)
def verify(token_payload: dict[str, object] = Depends(require_access_token)) -> VerifyResponse:
    return VerifyResponse(
        authenticated=True,
        username=str(token_payload["sub"]),
        role=str(token_payload["role"]),
        token_type=str(token_payload["type"]),
        expires_at=datetime.fromtimestamp(int(token_payload["exp"]), tz=UTC).isoformat(),
    )
