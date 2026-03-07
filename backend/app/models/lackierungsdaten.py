from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Text, func, text
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class Lackierungsdaten(Base):
    __tablename__ = "lackierungsdaten"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    protokoll_id: Mapped[int] = mapped_column(Integer, ForeignKey("protokolle.id"), nullable=False)

    klarlackschicht: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("false"))
    klarlackschicht_bemerkung: Mapped[str | None] = mapped_column(Text, nullable=True)

    zinkstaubbeschichtung: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("false"))
    zinkstaub_bemerkung: Mapped[str | None] = mapped_column(Text, nullable=True)

    e_kolben_beschichtung: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("false"))
    e_kolben_bemerkung: Mapped[str | None] = mapped_column(Text, nullable=True)

    erstellt_am: Mapped[datetime] = mapped_column(
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
