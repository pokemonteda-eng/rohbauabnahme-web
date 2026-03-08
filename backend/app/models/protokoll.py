from datetime import date

from sqlalchemy import Boolean, Date, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class Protokoll(Base):
    __tablename__ = "protokolle"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    auftrags_nr: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    kunde_id: Mapped[int] = mapped_column(Integer, ForeignKey("kunden.id"), nullable=False)
    aufbautyp: Mapped[str] = mapped_column(String(64), nullable=False)
    vertriebsgebiet: Mapped[str] = mapped_column(String(128), nullable=False)
    projektleiter: Mapped[str] = mapped_column(String(255), nullable=False)
    kabel_funklayout_geaendert: Mapped[bool | None] = mapped_column(Boolean, nullable=True, default=None)
    techn_aenderungen: Mapped[str | None] = mapped_column(Text, nullable=True)
    datum: Mapped[date | None] = mapped_column(Date, nullable=True)
    anlage_datum: Mapped[date] = mapped_column(Date, nullable=False)
