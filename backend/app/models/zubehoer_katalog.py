from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class ZubehoerKatalog(Base):
    __tablename__ = "zubehoer_katalog"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    kategorie: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    bezeichnung: Mapped[str] = mapped_column(String(255), nullable=False)
    artikel_nr: Mapped[str | None] = mapped_column(String(80), nullable=True, unique=True)
    standard_preis: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    aktiv: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    erstellt_am: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
