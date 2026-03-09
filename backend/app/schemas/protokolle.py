from datetime import date

from pydantic import BaseModel, ConfigDict, Field


class ProtokollBase(BaseModel):
    auftrags_nr: str = Field(min_length=1, max_length=64)
    kunde_id: int = Field(gt=0)
    aufbautyp: str = Field(min_length=1, max_length=64)
    projektleiter: str = Field(min_length=1, max_length=255)
    vertriebsgebiet: str = Field(min_length=1, max_length=128)
    kabel_funklayout_geaendert: bool | None = None
    techn_aenderungen: str | None = None
    datum: date | None = None
    anlage_datum: date


class ProtokollCreate(ProtokollBase):
    pass


class ProtokollUpdate(BaseModel):
    auftrags_nr: str | None = Field(default=None, min_length=1, max_length=64)
    kunde_id: int | None = Field(default=None, gt=0)
    aufbautyp: str | None = Field(default=None, min_length=1, max_length=64)
    projektleiter: str | None = Field(default=None, min_length=1, max_length=255)
    vertriebsgebiet: str | None = Field(default=None, min_length=1, max_length=128)
    kabel_funklayout_geaendert: bool | None = None
    techn_aenderungen: str | None = None
    datum: date | None = None
    anlage_datum: date | None = None


class ProtokollRead(ProtokollBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class LackierungsdatenBase(BaseModel):
    klarlackschicht: bool = False
    klarlackschicht_bemerkung: str | None = Field(default=None, max_length=2000)
    zinkstaubbeschichtung: bool = False
    zinkstaub_bemerkung: str | None = Field(default=None, max_length=2000)
    e_kolben_beschichtung: bool = False
    e_kolben_bemerkung: str | None = Field(default=None, max_length=2000)


class LackierungsdatenSave(LackierungsdatenBase):
    klarlackschicht: bool
    klarlackschicht_bemerkung: str | None = Field(default=None, max_length=2000)
    zinkstaubbeschichtung: bool
    zinkstaub_bemerkung: str | None = Field(default=None, max_length=2000)
    e_kolben_beschichtung: bool
    e_kolben_bemerkung: str | None = Field(default=None, max_length=2000)

    model_config = ConfigDict(extra="forbid")


class LackierungsdatenRead(LackierungsdatenBase):
    id: int
    protokoll_id: int

    model_config = ConfigDict(from_attributes=True)
