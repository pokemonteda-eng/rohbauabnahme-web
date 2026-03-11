from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Rohbauabnahme Web API"
    app_version: str = "0.1.0"
    api_v1_prefix: str = "/api/v1"
    auth_login_username: str = "admin"
    auth_login_password_hash: str = "$2b$12$C5WmrDo6ftE/lFt/w5klsOdAYeLRamb6Lo4fKi9KXUujXFwN2BB0C"
    jwt_secret_key: str = "change-me-dev-jwt-secret"
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


settings = Settings()
