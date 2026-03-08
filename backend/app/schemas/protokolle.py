from datetime import date

from pydantic import BaseModel, ConfigDict, Field


class ProtokollBase(BaseModel):
    auftrags_nr: str = Field(min_length=1, max_length=64)
    kunde_id: int = Field(gt=0)
    aufbautyp: str = Field(min_length=1, max_length=64)
    projektleiter: str = Field(min_length=1, max_length=255)
    vertriebsgebiet: str = Field(min_length=1, max_length=128)
    kabel_funklayout_geaendert: bool
    techn_aenderungen: str | None = None
    datum: date
    anlage_datum: date


class ProtokollCreate(ProtokollBase):
    pass


class ProtokollRead(ProtokollBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
