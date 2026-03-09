from __future__ import annotations

import os
import subprocess
from pathlib import Path

import sqlalchemy as sa


def _run_alembic(backend_dir: Path, *args: str, env: dict[str, str] | None = None) -> subprocess.CompletedProcess[str]:
    command = [
        "python3",
        "-m",
        "alembic",
        "-c",
        str(backend_dir / "alembic.ini"),
        *args,
    ]
    return subprocess.run(
        command,
        cwd=backend_dir,
        env=env,
        check=True,
        capture_output=True,
        text=True,
    )


def test_alembic_upgrade_head_creates_all_expected_tables(tmp_path: Path) -> None:
    backend_dir = Path(__file__).resolve().parents[1]
    db_path = tmp_path / "alembic_test.db"

    env = os.environ.copy()
    env["DATABASE_URL"] = f"sqlite:///{db_path}"

    _run_alembic(backend_dir, "upgrade", "head", env=env)

    engine = sa.create_engine(f"sqlite+pysqlite:///{db_path}")
    inspector = sa.inspect(engine)
    tables = set(inspector.get_table_names())

    expected_tables = {
        "alembic_version",
        "kunden",
        "protokolle",
        "lackierungsdaten",
        "protokoll_kopfdaten",
        "zubehoer_katalog",
        "zubehoer_auswahl",
        "technische_aenderungen",
    }

    assert expected_tables.issubset(tables)


def test_alembic_has_single_head() -> None:
    backend_dir = Path(__file__).resolve().parents[1]

    result = _run_alembic(backend_dir, "heads")

    head_lines = [line.strip() for line in result.stdout.splitlines() if line.strip()]
    assert len(head_lines) == 1, f"Expected exactly one head, got: {head_lines}"


def test_alembic_upgrade_head_matches_expected_schema_details(tmp_path: Path) -> None:
    backend_dir = Path(__file__).resolve().parents[1]
    db_path = tmp_path / "alembic_schema_details.db"

    env = os.environ.copy()
    env["DATABASE_URL"] = f"sqlite:///{db_path}"

    _run_alembic(backend_dir, "upgrade", "head", env=env)

    engine = sa.create_engine(f"sqlite+pysqlite:///{db_path}")
    inspector = sa.inspect(engine)

    expected_columns = {
        "kunden": {"id", "kunden_nr", "name", "adresse", "angelegt_am"},
        "protokolle": {
            "id",
            "auftrags_nr",
            "kunde_id",
            "aufbautyp",
            "vertriebsgebiet",
            "projektleiter",
            "kabel_funklayout_geaendert",
            "techn_aenderungen",
            "datum",
            "anlage_datum",
        },
        "protokoll_kopfdaten": {
            "id",
            "protokoll_id",
            "aufbautyp",
            "vertriebsgebiet",
            "projektleiter",
            "erstellt_am",
        },
        "lackierungsdaten": {
            "id",
            "protokoll_id",
            "klarlackschicht",
            "klarlackschicht_bemerkung",
            "zinkstaubbeschichtung",
            "zinkstaub_bemerkung",
            "e_kolben_beschichtung",
            "e_kolben_bemerkung",
            "erstellt_am",
            "aktualisiert_am",
        },
        "technische_aenderungen": {
            "id",
            "protokoll_id",
            "kabel_funklayout_geaendert",
            "techn_aenderungen",
            "datum",
        },
        "zubehoer_katalog": {
            "id",
            "kategorie",
            "bezeichnung",
            "artikel_nr",
            "standard_preis",
            "aktiv",
            "erstellt_am",
        },
        "zubehoer_auswahl": {
            "id",
            "protokoll_id",
            "katalog_id",
            "menge",
            "einzelpreis",
            "kunden_beigestellt",
            "bemerkung",
            "erstellt_am",
        },
    }

    for table_name, expected in expected_columns.items():
        present = {column["name"] for column in inspector.get_columns(table_name)}
        assert expected.issubset(present), f"Missing columns in {table_name}: {expected - present}"

    protokolle_unique_constraints = {
        tuple(constraint["column_names"])
        for constraint in inspector.get_unique_constraints("protokolle")
        if constraint.get("column_names")
    }
    assert ("auftrags_nr",) in protokolle_unique_constraints

    kopfdaten_unique_constraints = {
        tuple(constraint["column_names"])
        for constraint in inspector.get_unique_constraints("protokoll_kopfdaten")
        if constraint.get("column_names")
    }
    assert ("protokoll_id",) in kopfdaten_unique_constraints

    technische_unique_constraints = {
        tuple(constraint["column_names"])
        for constraint in inspector.get_unique_constraints("technische_aenderungen")
        if constraint.get("column_names")
    }
    assert ("protokoll_id",) in technische_unique_constraints

    lackierungs_indexes = {index["name"]: bool(index.get("unique")) for index in inspector.get_indexes("lackierungsdaten")}
    assert lackierungs_indexes["ix_lackierungsdaten_protokoll_id"] is True


def test_alembic_upgrade_deduplicates_lackierungsdaten_before_unique_index(tmp_path: Path) -> None:
    backend_dir = Path(__file__).resolve().parents[1]
    db_path = tmp_path / "alembic_deduplicate_test.db"

    env = os.environ.copy()
    env["DATABASE_URL"] = f"sqlite:///{db_path}"

    _run_alembic(backend_dir, "upgrade", "20260308_0006", env=env)

    engine = sa.create_engine(f"sqlite+pysqlite:///{db_path}")
    with engine.begin() as conn:
        conn.execute(
            sa.text(
                """
                INSERT INTO kunden (kunden_nr, name, adresse)
                VALUES ('K-MIG-1', 'Migration Test', 'Testweg 1, 12345 Berlin')
                """
            )
        )
        conn.execute(
            sa.text(
                """
                INSERT INTO protokolle (
                    auftrags_nr,
                    kunde_id,
                    aufbautyp,
                    vertriebsgebiet,
                    projektleiter,
                    kabel_funklayout_geaendert,
                    techn_aenderungen,
                    datum,
                    anlage_datum
                ) VALUES (
                    'A-MIG-1',
                    1,
                    'Container',
                    'Nord',
                    'Migration Tester',
                    0,
                    NULL,
                    '2026-03-08',
                    '2026-03-08'
                )
                """
            )
        )
        conn.execute(sa.text("DROP INDEX IF EXISTS ix_lackierungsdaten_protokoll_id"))
        conn.execute(
            sa.text(
                """
                INSERT INTO lackierungsdaten (
                    protokoll_id,
                    klarlackschicht,
                    klarlackschicht_bemerkung,
                    zinkstaubbeschichtung,
                    zinkstaub_bemerkung,
                    e_kolben_beschichtung,
                    e_kolben_bemerkung
                ) VALUES
                    (1, 0, NULL, 0, NULL, 0, NULL),
                    (1, 1, 'Duplikat', 1, 'Duplikat', 1, 'Duplikat')
                """
            )
        )

    _run_alembic(backend_dir, "upgrade", "head", env=env)

    with engine.connect() as conn:
        remaining_rows = conn.execute(
            sa.text("SELECT COUNT(*) FROM lackierungsdaten WHERE protokoll_id = 1")
        ).scalar_one()
    assert remaining_rows == 1

    inspector = sa.inspect(engine)
    indexes = inspector.get_indexes("lackierungsdaten")
    index_by_name = {index["name"]: index for index in indexes}
    assert bool(index_by_name["ix_lackierungsdaten_protokoll_id"]["unique"]) is True
