from app.models.kunde import Kunde
from app.models.lackierungsdaten import Lackierungsdaten
from app.models.lampentyp import Lampentyp
from app.models.protokoll import Protokoll
from app.models.protokoll_kopfdaten import ProtokollKopfdaten
from app.models.technische_aenderung import TechnischeAenderung
from app.models.vertriebsgebiet import Vertriebsgebiet
from app.models.zubehoer_auswahl import ZubehoerAuswahl
from app.models.zubehoer_katalog import ZubehoerKatalog

__all__ = [
    "Kunde",
    "Lackierungsdaten",
    "Lampentyp",
    "Protokoll",
    "ProtokollKopfdaten",
    "TechnischeAenderung",
    "Vertriebsgebiet",
    "ZubehoerAuswahl",
    "ZubehoerKatalog",
]
