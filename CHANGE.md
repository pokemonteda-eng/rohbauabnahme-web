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
