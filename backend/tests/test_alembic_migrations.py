from __future__ import annotations

import os
import subprocess
from pathlib import Path

import sqlalchemy as sa


def test_alembic_upgrade_head_creates_all_expected_tables(tmp_path: Path) -> None:
    backend_dir = Path(__file__).resolve().parents[1]
    db_path = tmp_path / "alembic_test.db"

    env = os.environ.copy()
    env["DATABASE_URL"] = f"sqlite:///{db_path}"

    subprocess.run(
        ["python3", "-m", "alembic", "upgrade", "head"],
        cwd=backend_dir,
        env=env,
        check=True,
        capture_output=True,
        text=True,
    )

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

    result = subprocess.run(
        ["python3", "-m", "alembic", "heads"],
        cwd=backend_dir,
        check=True,
        capture_output=True,
        text=True,
    )

    head_lines = [line.strip() for line in result.stdout.splitlines() if line.strip()]
    assert len(head_lines) == 1, f"Expected exactly one head, got: {head_lines}"


def test_alembic_upgrade_deduplicates_lackierungsdaten_before_unique_index(tmp_path: Path) -> None:
    backend_dir = Path(__file__).resolve().parents[1]
    db_path = tmp_path / "alembic_deduplicate_test.db"

    env = os.environ.copy()
    env["DATABASE_URL"] = f"sqlite:///{db_path}"

    subprocess.run(
        ["python3", "-m", "alembic", "upgrade", "20260308_0006"],
        cwd=backend_dir,
        env=env,
        check=True,
        capture_output=True,
        text=True,
    )

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

    subprocess.run(
        ["python3", "-m", "alembic", "upgrade", "head"],
        cwd=backend_dir,
        env=env,
        check=True,
        capture_output=True,
        text=True,
    )

    with engine.connect() as conn:
        remaining_rows = conn.execute(
            sa.text("SELECT COUNT(*) FROM lackierungsdaten WHERE protokoll_id = 1")
        ).scalar_one()
    assert remaining_rows == 1

    inspector = sa.inspect(engine)
    indexes = inspector.get_indexes("lackierungsdaten")
    index_by_name = {index["name"]: index for index in indexes}
    assert bool(index_by_name["ix_lackierungsdaten_protokoll_id"]["unique"]) is True
