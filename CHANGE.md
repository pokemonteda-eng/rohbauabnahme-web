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

# Ticket R019

## Status
- Überprüfung

# Ticket TASK-100

## Status
- Implementiert

## Frontend
- Einfache App-Routenstruktur ohne zusätzliche Routing-Dependency aufgebaut
- Geschützte Route `/admin` ergänzt
- Admin-Layout mit responsiver Navigation für Aufbauten, Lampen, Benutzer und Stammdaten ergänzt
- Rollenprüfung auf Frontend-Seite vorbereitet über lokale Benutzerrolle mit Zugriff nur für `admin`

## Tests
- Frontend-Tests für Admin-Zugriffsschutz, Admin-Navigation und Navigation aus der Startseite ergänzt

# Ticket TASK-101

## Status
- Implementiert

## Backend
- Neue persistente Tabelle `aufbauten` inkl. Alembic-Migration `20260311_0009_add_aufbauten_table.py`
- CRUD-API unter `/api/v1/aufbauten` mit PNG-Validierung, lokalem Dateispeicher und statischer Auslieferung unter `/uploads/*`
- Bestehende Master-Data-Route fuer `aufbautypen` nutzt bevorzugt aktive Admin-Aufbauten und faellt bei leerem Bestand auf die bisherigen Default-Werte zurueck

## Frontend
- Admin-Sektion `Aufbauten` als echte Verwaltungsoberflaeche mit Liste, Inline-Bearbeitung, Aktiv/Inaktiv-Toggle und PNG-Vorschau umgesetzt
- Neue Frontend-API fuer Aufbauten angebunden und bestehende Admin-Seite auf den neuen CRUD-Flow umgestellt

## Tests
- Backend-API-Tests fuer Aufbau-CRUD, PNG-Validierung und Stammdaten-Fallback/Bevorzugung aktiver Aufbauten ergaenzt
- Frontend-Test fuer Upload-gestuetztes Anlegen eines Aufbaus sowie bestehende Admin-Routing-Tests an die neue Default-Sektion angepasst
