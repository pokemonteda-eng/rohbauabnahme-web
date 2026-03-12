import os

os.environ.setdefault(
    "AUTH_LOGIN_USERNAME",
    "admin",
)
os.environ.setdefault(
    "AUTH_LOGIN_PASSWORD_HASH",
    "$2b$12$C5WmrDo6ftE/lFt/w5klsOdAYeLRamb6Lo4fKi9KXUujXFwN2BB0C",
)
os.environ.setdefault("JWT_SECRET_KEY", "test-jwt-secret-key")

from app.config import reload_settings


reload_settings()
