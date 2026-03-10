from datetime import date
from decimal import Decimal

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.db import Base
from app.models.kunde import Kunde
from app.models.protokoll import Protokoll
from app.models.zubehoer_auswahl import ZubehoerAuswahl
from app.models.zubehoer_katalog import ZubehoerKatalog
from app.services.calculation_service import calculate_accessory_net_total


def _session() -> Session:
    engine = create_engine(
        "sqlite+pysqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    session_local = sessionmaker(bind=engine, autocommit=False, autoflush=False, class_=Session)
    return session_local()


def test_calculate_accessory_net_total_uses_override_price_and_catalog_fallback() -> None:
    db = _session()
    kunde = Kunde(kunden_nr="K-9300", name="Preis Kunde", adresse="Preisweg 1")
    db.add(kunde)
    db.flush()

    protokoll = Protokoll(
        auftrags_nr="A-9300",
        kunde_id=kunde.id,
        aufbautyp="Container",
        projektleiter="PL",
        vertriebsgebiet="Nord",
        anlage_datum=date(2026, 3, 10),
    )
    db.add(protokoll)
    db.flush()

    katalog_a = ZubehoerKatalog(kategorie="Aufbau", bezeichnung="Leiter", standard_preis=Decimal("12.50"))
    katalog_b = ZubehoerKatalog(kategorie="Rahmen", bezeichnung="Tritt", standard_preis=Decimal("9.99"))
    db.add_all([katalog_a, katalog_b])
    db.flush()

    db.add_all(
        [
            ZubehoerAuswahl(
                protokoll_id=protokoll.id,
                katalog_id=katalog_a.id,
                menge=2,
                einzelpreis=Decimal("10.00"),
                kunden_beigestellt=False,
            ),
            ZubehoerAuswahl(
                protokoll_id=protokoll.id,
                katalog_id=katalog_b.id,
                menge=3,
                einzelpreis=None,
                kunden_beigestellt=False,
            ),
        ]
    )
    db.commit()

    calculation = calculate_accessory_net_total(db, protokoll.id)

    assert calculation.netto_gesamt == Decimal("49.97")
    assert [position.einzelpreis_netto for position in calculation.positionen] == [
        Decimal("10.00"),
        Decimal("9.99"),
    ]
    assert [position.gesamtpreis_netto for position in calculation.positionen] == [
        Decimal("20.00"),
        Decimal("29.97"),
    ]


def test_calculate_accessory_net_total_counts_customer_supplied_as_zero() -> None:
    db = _session()
    kunde = Kunde(kunden_nr="K-9301", name="Preis Kunde", adresse="Preisweg 2")
    db.add(kunde)
    db.flush()

    protokoll = Protokoll(
        auftrags_nr="A-9301",
        kunde_id=kunde.id,
        aufbautyp="Container",
        projektleiter="PL",
        vertriebsgebiet="Nord",
        anlage_datum=date(2026, 3, 10),
    )
    db.add(protokoll)
    db.flush()

    katalog = ZubehoerKatalog(kategorie="Aufbau", bezeichnung="Plane", standard_preis=Decimal("100.00"))
    db.add(katalog)
    db.flush()

    db.add(
        ZubehoerAuswahl(
            protokoll_id=protokoll.id,
            katalog_id=katalog.id,
            menge=4,
            einzelpreis=Decimal("88.00"),
            kunden_beigestellt=True,
        )
    )
    db.commit()

    calculation = calculate_accessory_net_total(db, protokoll.id)

    assert calculation.netto_gesamt == Decimal("0.00")
    assert calculation.positionen[0].einzelpreis_netto == Decimal("0.00")
    assert calculation.positionen[0].gesamtpreis_netto == Decimal("0.00")
