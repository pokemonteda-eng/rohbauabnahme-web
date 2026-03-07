from datetime import datetime

from sqlalchemy import DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class Kunde(Base):
    __tablename__ = "kunden"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    kunden_nr: Mapped[str] = mapped_column(String(64), nullable=False, unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    adresse: Mapped[str] = mapped_column(String(500), nullable=False)
    angelegt_am: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
