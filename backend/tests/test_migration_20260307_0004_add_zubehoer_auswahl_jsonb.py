from pathlib import Path
import runpy

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


def _load_migration() -> dict[str, object]:
    migration_path = (
        Path(__file__).resolve().parents[1]
        / "alembic"
        / "versions"
        / "20260307_0004_add_zubehoer_auswahl_jsonb.py"
    )
    return runpy.run_path(str(migration_path))


def test_upgrade_adds_jsonb_column(monkeypatch) -> None:
    migration = _load_migration()
    added_columns: list[tuple[str, sa.Column]] = []

    def fake_add_column(table_name: str, column: sa.Column) -> None:
        added_columns.append((table_name, column))

    monkeypatch.setattr(migration["op"], "add_column", fake_add_column)

    migration["upgrade"]()

    assert len(added_columns) == 1
    table_name, column = added_columns[0]
    assert table_name == "protokolle"
    assert column.name == "zubehoer_auswahl"
    assert column.nullable is True
    assert isinstance(column.type.dialect_impl(postgresql.dialect()), postgresql.JSONB)


def test_downgrade_drops_zubehoer_auswahl_column(monkeypatch) -> None:
    migration = _load_migration()
    dropped_columns: list[tuple[str, str]] = []

    def fake_drop_column(table_name: str, column_name: str) -> None:
        dropped_columns.append((table_name, column_name))

    monkeypatch.setattr(migration["op"], "drop_column", fake_drop_column)

    migration["downgrade"]()

    assert dropped_columns == [("protokolle", "zubehoer_auswahl")]
