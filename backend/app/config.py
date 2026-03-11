from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Rohbauabnahme Web API"
    app_version: str = "0.1.0"
    api_v1_prefix: str = "/api/v1"
    admin_api_token: str = "dev-admin-token"
    auth_role_header: str = "X-User-Role"
    max_aufbau_upload_size_bytes: int = 2 * 1024 * 1024

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
    )


settings = Settings()
