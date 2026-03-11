from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class Aufbau(Base):
    __tablename__ = "aufbauten"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    bild_pfad: Mapped[str] = mapped_column(String(500), nullable=False)
    aktiv: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="1")
    angelegt_am: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    aktualisiert_am: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
