from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.zubehoer_auswahl import ZubehoerAuswahl
from app.models.zubehoer_katalog import ZubehoerKatalog

CENT = Decimal("0.01")


def _round_currency(value: Decimal) -> Decimal:
    return value.quantize(CENT, rounding=ROUND_HALF_UP)


@dataclass(slots=True)
class CalculatedAccessoryPrice:
    auswahl_id: int
    katalog_id: int
    kategorie: str
    bezeichnung: str
    menge: int
    einzelpreis_netto: Decimal
    bewertung: str | None
    kunden_beigestellt: bool
    gesamtpreis_netto: Decimal


@dataclass(slots=True)
class AccessoryPriceCalculation:
    protokoll_id: int
    netto_gesamt: Decimal
    preis_tea: Decimal
    preis_tek: Decimal
    positionen: list[CalculatedAccessoryPrice]


def _normalize_bewertung(value: str | None) -> str | None:
    if value is None:
        return None

    normalized = value.strip().upper()
    return normalized or None


def _resolve_unit_price(auswahl: ZubehoerAuswahl, katalog: ZubehoerKatalog) -> Decimal:
    if auswahl.kunden_beigestellt:
        return Decimal("0.00")

    price = auswahl.einzelpreis if auswahl.einzelpreis is not None else katalog.standard_preis
    if price is None:
        return Decimal("0.00")

    return _round_currency(Decimal(price))


def calculate_accessory_net_total(db: Session, protokoll_id: int) -> AccessoryPriceCalculation:
    rows = db.execute(
        select(ZubehoerAuswahl, ZubehoerKatalog)
        .join(ZubehoerKatalog, ZubehoerKatalog.id == ZubehoerAuswahl.katalog_id)
        .where(ZubehoerAuswahl.protokoll_id == protokoll_id)
        .order_by(ZubehoerAuswahl.id)
    ).all()

    positionen: list[CalculatedAccessoryPrice] = []
    netto_gesamt = Decimal("0.00")
    preis_tea = Decimal("0.00")
    preis_tek = Decimal("0.00")

    for auswahl, katalog in rows:
        einzelpreis = _resolve_unit_price(auswahl, katalog)
        gesamtpreis = _round_currency(einzelpreis * Decimal(auswahl.menge))
        bewertung = _normalize_bewertung(auswahl.bewertung)
        netto_gesamt += gesamtpreis
        if bewertung == "TEA":
            preis_tea += gesamtpreis
        if bewertung == "TEK":
            preis_tek += gesamtpreis
        positionen.append(
            CalculatedAccessoryPrice(
                auswahl_id=auswahl.id,
                katalog_id=katalog.id,
                kategorie=katalog.kategorie,
                bezeichnung=katalog.bezeichnung,
                menge=auswahl.menge,
                einzelpreis_netto=einzelpreis,
                bewertung=bewertung,
                kunden_beigestellt=auswahl.kunden_beigestellt,
                gesamtpreis_netto=gesamtpreis,
            )
        )

    return AccessoryPriceCalculation(
        protokoll_id=protokoll_id,
        netto_gesamt=_round_currency(netto_gesamt),
        preis_tea=_round_currency(preis_tea),
        preis_tek=_round_currency(preis_tek),
        positionen=positionen,
    )
