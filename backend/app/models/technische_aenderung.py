from datetime import date

from sqlalchemy import Boolean, Date, ForeignKey, Integer, Text, text
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class TechnischeAenderung(Base):
    __tablename__ = "technische_aenderungen"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    protokoll_id: Mapped[int] = mapped_column(Integer, ForeignKey("protokolle.id"), nullable=False, unique=True)
    kabel_funklayout_geaendert: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default=text("false"),
    )
    techn_aenderungen: Mapped[str | None] = mapped_column(Text, nullable=True)
    datum: Mapped[date] = mapped_column(Date, nullable=False)
