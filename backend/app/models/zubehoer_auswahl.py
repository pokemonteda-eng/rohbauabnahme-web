from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class ZubehoerAuswahl(Base):
    __tablename__ = "zubehoer_auswahl"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    protokoll_id: Mapped[int] = mapped_column(Integer, ForeignKey("protokolle.id"), nullable=False, index=True)
    katalog_id: Mapped[int] = mapped_column(Integer, ForeignKey("zubehoer_katalog.id"), nullable=False, index=True)
    menge: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    einzelpreis: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    kunden_beigestellt: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    bemerkung: Mapped[str | None] = mapped_column(Text, nullable=True)
    erstellt_am: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
