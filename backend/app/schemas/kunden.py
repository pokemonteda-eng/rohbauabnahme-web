from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class KundeBase(BaseModel):
    kunden_nr: str = Field(min_length=1, max_length=64)
    name: str = Field(min_length=1, max_length=255)
    adresse: str = Field(min_length=1, max_length=500)


class KundeCreate(KundeBase):
    pass


class KundeUpdate(BaseModel):
    kunden_nr: str | None = Field(default=None, min_length=1, max_length=64)
    name: str | None = Field(default=None, min_length=1, max_length=255)
    adresse: str | None = Field(default=None, min_length=1, max_length=500)


class KundeRead(KundeBase):
    id: int
    angelegt_am: datetime

    model_config = ConfigDict(from_attributes=True)
