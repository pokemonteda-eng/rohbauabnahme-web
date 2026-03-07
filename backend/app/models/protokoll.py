from datetime import date

from sqlalchemy import Date, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


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
