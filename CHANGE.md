# Ticket R010-Tech

## DB / Migration
- Neue Alembic-Migration `20260308_0005_make_protokolle_technical_fields_nullable.py`
- `protokolle.kabel_funklayout_geaendert` auf `nullable=True`
- `protokolle.techn_aenderungen` explizit auf `nullable=True` (kompatibel)
- `protokolle.datum` auf `nullable=True`

## SQLAlchemy / Schemas
- `app/models/protokoll.py`
  - `kabel_funklayout_geaendert: bool | None`
  - `datum: date | None`
- `app/schemas/protokolle.py`
  - `kabel_funklayout_geaendert: bool | None = None`
  - `datum: date | None = None`

## Tests
- `backend/tests/test_protokolle_api.py`
  - Neuer Test `test_create_protokoll_allows_nullable_technical_fields`
  - Validiert Create-Request mit `null` in technischen Feldern

# Ticket R011-Alembic

## DB / Migration
- Doppelte Alembic-Revision `20260308_0004` aufgeloest
- Migration `add_technische_aenderungen_model` auf `20260308_0006` umgestellt
- Revisionskette linearisiert: `... -> 20260308_0004 -> 20260308_0005 -> 20260308_0006`

## Tests
- Neuer Test `backend/tests/test_alembic_migrations.py`
  - `test_alembic_upgrade_head_creates_all_expected_tables`
  - `test_alembic_has_single_head`

# Ticket TASK-100

## Status
- Implementiert

## Frontend
- Einfache App-Routenstruktur ohne zusätzliche Routing-Dependency aufgebaut
- Geschützte Route `/admin` ergänzt
- Admin-Layout mit responsiver Navigation für Aufbauten, Lampen, Benutzer und Stammdaten ergänzt
- Rollenprüfung auf Frontend-Seite vorbereitet über lokale Benutzerrolle mit Zugriff nur für `admin`

# Ticket TASK-116

## Frontend
- Admin-Bereich `Lampen` mit echter Lampentypen-Verwaltung vervollständigt
- Formular für Anlegen und Bearbeiten mit Feldvalidierung für Pflichtfelder, URL und Preis ergänzt
- API-Anbindung für Laden, Anlegen, Bearbeiten und Löschen gegen `/api/v1/lampen-typen` ergänzt
- Robuste Fehlerbehandlung für fehlende Session, fehlende Berechtigung, gelöschte Datensätze, Versionskonflikte und Netzwerk-/Serverfehler ergänzt
- Erfolgs- und Fehlerzustände sind im Formular klar sichtbar und per Reload/Abbrechen sauber recoverbar

## Tests
- Frontend-Tests für Lampentypen-Laden, Validierung, Create/Edit, API-Konflikte und Recovery ergänzt

# Ticket TASK-117

## Jest / Stabilitaet
- Zentrales Jest-Setup `frontend/jest.setup.ts` ergaenzt
- Browserzustand wird nach jedem Test deterministisch zurueckgesetzt: URL, `localStorage`, `sessionStorage`, Mock- und Timer-Zustand
- `frontend/jest.config.js` setzt die jsdom-Basis-URL explizit auf `http://localhost/` und bindet das gemeinsame Setup ueber `setupFilesAfterEnv` ein

## Ursachenanalyse
- Die Admin-Lampentypen-Tests haengen an Browserzustand (`window.location`, `localStorage`, globalen Mocks fuer `fetch`) und asynchronen Effects
- Vor TASK-117 gab es dafuer kein gemeinsames Jest-Setup; die Isolation hing damit an einzelnen Testdateien und der jeweiligen Ausfuehrungsreihenfolge
- Das war kein reproduzierbarer Fachfehler im Lampentypen-Code, sondern ein Setup-Risiko fuer flakey Tests bei Suite-Kombinationen und CI-Reihenfolgen

## Testnachweis
- Lokal stabil: `npm test -- --runInBand --runTestsByPath src/__tests__/AdminLampentypenSection.test.tsx src/__tests__/AdminPage.test.tsx` fuenfmal in Folge gruen
- CI-nah lokal stabil: `npm run test:coverage -- --runInBand` mit 19/19 Suites und 83/83 Tests gruen

# Ticket TASK-118

## Auth Backend
- Unsichere Defaults und `AUTH_ALLOW_INSECURE_DEV_DEFAULTS` entfernt
- Auth-Konfiguration wird nur noch ueber ENV geladen; `AUTH_LOGIN_USERNAME`, `AUTH_LOGIN_PASSWORD_HASH` und `JWT_SECRET_KEY` sind Pflichtwerte
- App verweigert Import/Start bei fehlenden oder leeren Auth-ENV-Werten mit klarer Fehlermeldung
- Auth-Funktionen validieren kritische Werte zusaetzlich im Laufzeitpfad

## Tests
- `backend/tests/conftest.py` setzt Test-ENV fuer importierende Backend-Tests zentral
- `backend/tests/test_auth_api.py` prueft Erfolgsfall sowie Start- und Runtime-Fehlerpfade fuer fehlende oder leere Auth-ENV-Werte
