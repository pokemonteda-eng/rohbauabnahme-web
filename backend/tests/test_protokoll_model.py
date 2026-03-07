from datetime import date

from sqlalchemy import create_engine
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import Session

from app.db import Base
from app.models.kunde import Kunde
from app.models.protokoll import Protokoll


def test_protokoll_model_uses_jsonb_for_postgresql() -> None:
    column = Protokoll.__table__.c.zubehoer_auswahl
    dialect_type = column.type.dialect_impl(postgresql.dialect())

    assert isinstance(dialect_type, postgresql.JSONB)
    assert column.nullable is True


def test_protokoll_model_persists_zubehoer_auswahl_data() -> None:
    engine = create_engine("sqlite+pysqlite:///:memory:")
    Base.metadata.create_all(bind=engine)

    payload = {
        "positionen": [
            {"id": "SCHMUTZFANG", "menge": 2},
            {"id": "LEITERHALTER", "menge": 1},
        ],
        "hinweis": "inkl. Montageset",
    }

    with Session(engine) as db:
        kunde = Kunde(
            kunden_nr="K-4000",
            name="JSONB Test GmbH",
            adresse="Werkstr. 10, 20095 Hamburg",
        )
        db.add(kunde)
        db.flush()

        protokoll = Protokoll(
            auftrags_nr="A-JSONB-1",
            kunde_id=kunde.id,
            aufbautyp="Kipper",
            vertriebsgebiet="Nord",
            projektleiter="Max Muster",
            datum=date(2026, 3, 7),
            status="offen",
            zubehoer_auswahl=payload,
        )
        db.add(protokoll)
        db.commit()
        db.refresh(protokoll)

        assert protokoll.id is not None
        assert protokoll.zubehoer_auswahl == payload
