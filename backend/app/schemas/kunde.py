from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class KundeBase(BaseModel):
    kunden_nr: str = Field(min_length=1, max_length=64)
    name: str = Field(min_length=1, max_length=255)
    adresse: str = Field(min_length=1, max_length=500)


class KundeCreate(KundeBase):
    pass


class KundeRead(KundeBase):
    id: int
    angelegt_am: datetime

    model_config = ConfigDict(from_attributes=True)
