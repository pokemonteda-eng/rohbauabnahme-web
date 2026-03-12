from functools import lru_cache

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

REQUIRED_AUTH_FIELDS = {
    "auth_login_username": "AUTH_LOGIN_USERNAME",
    "auth_login_password_hash": "AUTH_LOGIN_PASSWORD_HASH",
    "jwt_secret_key": "JWT_SECRET_KEY",
}


class Settings(BaseSettings):
    app_name: str = "Rohbauabnahme Web API"
    app_version: str = "0.1.0"
    api_v1_prefix: str = "/api/v1"
    auth_login_username: str = Field(..., alias="AUTH_LOGIN_USERNAME")
    auth_login_password_hash: str = Field(..., alias="AUTH_LOGIN_PASSWORD_HASH")
    jwt_secret_key: str = Field(..., alias="JWT_SECRET_KEY")
    jwt_access_token_expire_minutes: int = 15
    jwt_refresh_token_expire_minutes: int = 60 * 24 * 7

    cors_allow_origins: list[str] = ["*"]
    cors_allow_credentials: bool = True
    cors_allow_methods: list[str] = ["*"]
    cors_allow_headers: list[str] = ["*"]

    log_level: str = "INFO"
    database_url: str = "sqlite:///./app.db"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
        populate_by_name=True,
    )

    @model_validator(mode="before")
    @classmethod
    def _require_auth_env_values(cls, data: object) -> object:
        if not isinstance(data, dict):
            return data

        for field_name, env_var in REQUIRED_AUTH_FIELDS.items():
            value = data.get(env_var, data.get(field_name))
            if value is None:
                raise ValueError(f"{env_var} muss gesetzt sein.")
            if isinstance(value, str) and not value.strip():
                raise ValueError(f"{env_var} darf nicht leer sein.")

        return data


@lru_cache
def get_settings() -> Settings:
    return Settings()


def clear_settings_cache() -> None:
    get_settings.cache_clear()


def reload_settings() -> Settings:
    clear_settings_cache()
    return get_settings()


def _require_runtime_auth_value(value: str, env_var: str) -> None:
    if not value:
        raise RuntimeError(f"{env_var} muss gesetzt sein.")
    if not value.strip():
        raise RuntimeError(f"{env_var} darf nicht leer sein.")


def validate_auth_configuration() -> Settings:
    current_settings = get_settings()
    _require_runtime_auth_value(current_settings.auth_login_username, "AUTH_LOGIN_USERNAME")
    _require_runtime_auth_value(current_settings.auth_login_password_hash, "AUTH_LOGIN_PASSWORD_HASH")
    _require_runtime_auth_value(current_settings.jwt_secret_key, "JWT_SECRET_KEY")
    return current_settings


def validate_auth_secrets() -> Settings:
    return validate_auth_configuration()


settings = get_settings()
