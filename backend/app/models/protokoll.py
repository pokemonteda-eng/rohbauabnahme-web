from datetime import date
from typing import Any

from sqlalchemy import JSON, Date, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


zubehoer_auswahl_type = JSON().with_variant(JSONB(), "postgresql")


class Protokoll(Base):
    __tablename__ = "protokolle"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    auftrags_nr: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    kunde_id: Mapped[int] = mapped_column(Integer, ForeignKey("customers.id"), nullable=False)
    aufbautyp: Mapped[str] = mapped_column(String(64), nullable=False)
    vertriebsgebiet: Mapped[str] = mapped_column(String(128), nullable=False)
    projektleiter: Mapped[str] = mapped_column(String(255), nullable=False)
    datum: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(64), nullable=False)
    zubehoer_auswahl: Mapped[dict[str, Any] | list[Any] | None] = mapped_column(
        zubehoer_auswahl_type,
        nullable=True,
    )
