from secrets import token_urlsafe

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Rohbauabnahme Web API"
    app_version: str = "0.1.0"
    api_v1_prefix: str = "/api/v1"
    auth_allow_insecure_dev_defaults: bool = False
    auth_login_username: str | None = None
    auth_login_password_hash: str | None = None
    jwt_secret_key: str | None = None
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
    )

    @model_validator(mode="after")
    def validate_auth_configuration(self) -> "Settings":
        if self.auth_allow_insecure_dev_defaults:
            if self.auth_login_username is None:
                self.auth_login_username = f"dev-disabled-{token_urlsafe(8)}"
            if self.auth_login_password_hash is None:
                self.auth_login_password_hash = "!"
            if self.jwt_secret_key is None:
                self.jwt_secret_key = token_urlsafe(32)
            return self

        missing_settings: list[str] = []
        if self.auth_login_username is None:
            missing_settings.append("AUTH_LOGIN_USERNAME")
        if self.auth_login_password_hash is None:
            missing_settings.append("AUTH_LOGIN_PASSWORD_HASH")
        if self.jwt_secret_key is None:
            missing_settings.append("JWT_SECRET_KEY")

        if missing_settings:
            raise ValueError(
                "Missing required auth settings: "
                + ", ".join(missing_settings)
                + ". Set them via environment variables or opt into AUTH_ALLOW_INSECURE_DEV_DEFAULTS=true."
            )

        return self


settings = Settings()
