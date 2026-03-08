from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class ProtokollKopfdaten(Base):
    __tablename__ = "protokoll_kopfdaten"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    protokoll_id: Mapped[int] = mapped_column(Integer, ForeignKey("protokolle.id"), nullable=False, unique=True)
    aufbautyp: Mapped[str] = mapped_column(String(64), nullable=False)
    vertriebsgebiet: Mapped[str] = mapped_column(String(128), nullable=False)
    projektleiter: Mapped[str] = mapped_column(String(255), nullable=False)
    erstellt_am: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
