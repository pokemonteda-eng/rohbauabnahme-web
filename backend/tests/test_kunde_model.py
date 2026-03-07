from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.db import Base
from app.models.kunde import Kunde


def test_kunde_model_persists_fields() -> None:
    engine = create_engine("sqlite+pysqlite:///:memory:")
    Base.metadata.create_all(bind=engine)

    with Session(engine) as db:
        kunde = Kunde(kunden_nr="K-1000", name="Muster GmbH", adresse="Musterstr. 1, 10115 Berlin")
        db.add(kunde)
        db.commit()
        db.refresh(kunde)

        assert kunde.id is not None
        assert kunde.kunden_nr == "K-1000"
        assert kunde.name == "Muster GmbH"
        assert kunde.adresse == "Musterstr. 1, 10115 Berlin"
        assert kunde.angelegt_am is not None
