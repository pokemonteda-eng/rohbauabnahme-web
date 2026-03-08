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
