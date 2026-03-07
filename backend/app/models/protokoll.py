from datetime import date
from enum import Enum
from uuid import UUID, uuid4

from sqlalchemy import Date, Enum as SQLEnum, ForeignKey, Integer, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class AufbauTyp(str, Enum):
    FB = "FB"
    FZB = "FZB"


class ProtokollStatus(str, Enum):
    ENTWURF = "entwurf"
    FREIGEGEBEN = "freigegeben"
    ABGESCHLOSSEN = "abgeschlossen"


class Protokoll(Base):
    __tablename__ = "protokolle"

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    auftrags_nr: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    kunde_id: Mapped[int] = mapped_column(Integer, ForeignKey("kunden.id"), nullable=False)
    aufbautyp: Mapped[AufbauTyp] = mapped_column(
        SQLEnum(AufbauTyp, name="aufbautyp_enum", native_enum=False),
        nullable=False,
    )
    vertriebsgebiet: Mapped[str] = mapped_column(String(128), nullable=False)
    projektleiter: Mapped[str] = mapped_column(String(255), nullable=False)
    datum: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[ProtokollStatus] = mapped_column(
        SQLEnum(ProtokollStatus, name="protokoll_status_enum", native_enum=False),
        nullable=False,
        default=ProtokollStatus.ENTWURF,
    )
