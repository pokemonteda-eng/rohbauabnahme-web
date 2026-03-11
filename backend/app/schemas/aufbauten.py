from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AufbauRead(BaseModel):
    id: int
    name: str = Field(min_length=1, max_length=255)
    bild_pfad: str = Field(min_length=1, max_length=500)
    bild_url: str = Field(min_length=1, max_length=500)
    aktiv: bool
    angelegt_am: datetime
    aktualisiert_am: datetime

    model_config = ConfigDict(from_attributes=True)
