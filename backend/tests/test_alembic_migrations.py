from __future__ import annotations

import os
import subprocess
from pathlib import Path

import sqlalchemy as sa


def _backend_dir() -> Path:
    return Path(__file__).resolve().parents[1]


def _database_env(db_path: Path) -> dict[str, str]:
    env = os.environ.copy()
    env["DATABASE_URL"] = f"sqlite:///{db_path}"
    return env


def _run_alembic(
    backend_dir: Path,
    *args: str,
    env: dict[str, str] | None = None,
) -> subprocess.CompletedProcess[str]:
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
    backend_dir = _backend_dir()
    db_path = tmp_path / "alembic_test.db"

    _run_alembic(backend_dir, "upgrade", "head", env=_database_env(db_path))

    engine = sa.create_engine(f"sqlite+pysqlite:///{db_path}")
    inspector = sa.inspect(engine)
    tables = set(inspector.get_table_names())

    expected_tables = {
        "alembic_version",
        "kunden",
        "lampen_typen",
        "protokolle",
        "lackierungsdaten",
        "protokoll_kopfdaten",
        "zubehoer_katalog",
        "zubehoer_auswahl",
        "technische_aenderungen",
    }

    assert tables == expected_tables


def test_alembic_has_single_head() -> None:
    backend_dir = _backend_dir()

    result = _run_alembic(backend_dir, "heads")

    head_lines = [line.strip() for line in result.stdout.splitlines() if line.strip()]
    assert len(head_lines) == 1, f"Expected exactly one head, got: {head_lines}"


def test_alembic_upgrade_head_matches_expected_schema_details(tmp_path: Path) -> None:
    backend_dir = _backend_dir()
    db_path = tmp_path / "alembic_schema_details.db"

    _run_alembic(backend_dir, "upgrade", "head", env=_database_env(db_path))

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
        "lampen_typen": {
            "id",
            "name",
            "beschreibung",
            "icon_url",
            "standard_preis",
            "version",
            "angelegt_am",
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
            "bewertung",
            "kunden_beigestellt",
            "bemerkung",
            "erstellt_am",
        },
    }

    for table_name, expected in expected_columns.items():
        present = {column["name"] for column in inspector.get_columns(table_name)}
        assert present == expected, f"Unexpected columns in {table_name}: {present ^ expected}"

    kunden_columns = {column["name"]: column for column in inspector.get_columns("kunden")}
    assert kunden_columns["kunden_nr"]["nullable"] is False
    assert kunden_columns["angelegt_am"]["nullable"] is False
    assert kunden_columns["angelegt_am"]["default"] is not None

    protokolle_columns = {column["name"]: column for column in inspector.get_columns("protokolle")}
    assert protokolle_columns["auftrags_nr"]["nullable"] is False
    assert protokolle_columns["kunde_id"]["nullable"] is False
    assert protokolle_columns["anlage_datum"]["nullable"] is False
    assert protokolle_columns["kabel_funklayout_geaendert"]["nullable"] is True
    assert protokolle_columns["techn_aenderungen"]["nullable"] is True
    assert protokolle_columns["datum"]["nullable"] is True

    lackierungs_columns = {column["name"]: column for column in inspector.get_columns("lackierungsdaten")}
    assert lackierungs_columns["protokoll_id"]["nullable"] is False
    assert lackierungs_columns["klarlackschicht"]["nullable"] is False
    assert lackierungs_columns["zinkstaubbeschichtung"]["nullable"] is False
    assert lackierungs_columns["e_kolben_beschichtung"]["nullable"] is False
    assert lackierungs_columns["erstellt_am"]["default"] is not None
    assert lackierungs_columns["aktualisiert_am"]["default"] is not None

    lampentypen_columns = {column["name"]: column for column in inspector.get_columns("lampen_typen")}
    assert lampentypen_columns["name"]["nullable"] is False
    assert lampentypen_columns["beschreibung"]["nullable"] is False
    assert lampentypen_columns["icon_url"]["nullable"] is False
    assert lampentypen_columns["standard_preis"]["nullable"] is False
    assert lampentypen_columns["version"]["nullable"] is False
    assert lampentypen_columns["version"]["default"] is not None
    assert lampentypen_columns["angelegt_am"]["default"] is not None
    assert lampentypen_columns["aktualisiert_am"]["default"] is not None

    technische_columns = {
        column["name"]: column for column in inspector.get_columns("technische_aenderungen")
    }
    assert technische_columns["protokoll_id"]["nullable"] is False
    assert technische_columns["kabel_funklayout_geaendert"]["nullable"] is False
    assert technische_columns["kabel_funklayout_geaendert"]["default"] is not None
    assert technische_columns["datum"]["nullable"] is False

    zubehoer_katalog_columns = {
        column["name"]: column for column in inspector.get_columns("zubehoer_katalog")
    }
    assert zubehoer_katalog_columns["kategorie"]["nullable"] is False
    assert zubehoer_katalog_columns["bezeichnung"]["nullable"] is False
    assert zubehoer_katalog_columns["aktiv"]["nullable"] is False
    assert zubehoer_katalog_columns["erstellt_am"]["default"] is not None

    zubehoer_auswahl_columns = {
        column["name"]: column for column in inspector.get_columns("zubehoer_auswahl")
    }
    assert zubehoer_auswahl_columns["protokoll_id"]["nullable"] is False
    assert zubehoer_auswahl_columns["katalog_id"]["nullable"] is False
    assert zubehoer_auswahl_columns["menge"]["nullable"] is False
    assert zubehoer_auswahl_columns["kunden_beigestellt"]["nullable"] is False
    assert zubehoer_auswahl_columns["erstellt_am"]["default"] is not None

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

    lampentypen_unique_constraints = {
        tuple(constraint["column_names"])
        for constraint in inspector.get_unique_constraints("lampen_typen")
        if constraint.get("column_names")
    }
    assert ("name",) in lampentypen_unique_constraints

    technische_unique_constraints = {
        tuple(constraint["column_names"])
        for constraint in inspector.get_unique_constraints("technische_aenderungen")
        if constraint.get("column_names")
    }
    assert ("protokoll_id",) in technische_unique_constraints

    lackierungs_foreign_keys = {
        tuple(foreign_key["constrained_columns"]): (
            foreign_key["referred_table"],
            tuple(foreign_key["referred_columns"]),
        )
        for foreign_key in inspector.get_foreign_keys("lackierungsdaten")
    }
    assert lackierungs_foreign_keys[("protokoll_id",)] == ("protokolle", ("id",))

    protokolle_foreign_keys = {
        tuple(foreign_key["constrained_columns"]): (
            foreign_key["referred_table"],
            tuple(foreign_key["referred_columns"]),
        )
        for foreign_key in inspector.get_foreign_keys("protokolle")
    }
    assert protokolle_foreign_keys[("kunde_id",)] == ("kunden", ("id",))

    kopfdaten_foreign_keys = {
        tuple(foreign_key["constrained_columns"]): (
            foreign_key["referred_table"],
            tuple(foreign_key["referred_columns"]),
        )
        for foreign_key in inspector.get_foreign_keys("protokoll_kopfdaten")
    }
    assert kopfdaten_foreign_keys[("protokoll_id",)] == ("protokolle", ("id",))

    technische_foreign_keys = {
        tuple(foreign_key["constrained_columns"]): (
            foreign_key["referred_table"],
            tuple(foreign_key["referred_columns"]),
        )
        for foreign_key in inspector.get_foreign_keys("technische_aenderungen")
    }
    assert technische_foreign_keys[("protokoll_id",)] == ("protokolle", ("id",))

    zubehoer_auswahl_foreign_keys = {
        tuple(foreign_key["constrained_columns"]): (
            foreign_key["referred_table"],
            tuple(foreign_key["referred_columns"]),
        )
        for foreign_key in inspector.get_foreign_keys("zubehoer_auswahl")
    }
    assert zubehoer_auswahl_foreign_keys[("protokoll_id",)] == ("protokolle", ("id",))
    assert zubehoer_auswahl_foreign_keys[("katalog_id",)] == ("zubehoer_katalog", ("id",))

    lackierungs_indexes = {
        index["name"]: bool(index.get("unique")) for index in inspector.get_indexes("lackierungsdaten")
    }
    assert lackierungs_indexes["ix_lackierungsdaten_protokoll_id"] is True

    zubehoer_katalog_indexes = {
        index["name"]: tuple(index["column_names"]) for index in inspector.get_indexes("zubehoer_katalog")
    }
    assert zubehoer_katalog_indexes["ix_zubehoer_katalog_kategorie"] == ("kategorie",)

    zubehoer_auswahl_indexes = {
        index["name"]: tuple(index["column_names"]) for index in inspector.get_indexes("zubehoer_auswahl")
    }
    assert zubehoer_auswahl_indexes["ix_zubehoer_auswahl_protokoll_id"] == ("protokoll_id",)
    assert zubehoer_auswahl_indexes["ix_zubehoer_auswahl_katalog_id"] == ("katalog_id",)


def test_alembic_upgrade_deduplicates_lackierungsdaten_before_unique_index(tmp_path: Path) -> None:
    backend_dir = _backend_dir()
    db_path = tmp_path / "alembic_deduplicate_test.db"

    env = _database_env(db_path)

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
