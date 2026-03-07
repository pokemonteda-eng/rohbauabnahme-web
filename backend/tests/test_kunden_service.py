import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.db import Base
from app.schemas.kunde import KundeCreate, KundeUpdate
from app.services.kunden_service import (
    KundeConflictError,
    KundeNotFoundError,
    create_kunde,
    delete_kunde,
    get_kunde,
    list_kunden,
    update_kunde,
)


def _session_factory() -> sessionmaker[Session]:
    engine = create_engine(
        "sqlite+pysqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    return sessionmaker(bind=engine, autocommit=False, autoflush=False, class_=Session)


def test_service_create_get_list_update_delete_flow() -> None:
    session_local = _session_factory()
    with session_local() as db:
        created = create_kunde(
            db,
            KundeCreate(kunden_nr="K-7000", name="Service Bau", adresse="Serviceweg 7"),
        )
        fetched = get_kunde(db, created.id)
        assert fetched.id == created.id

        updated = update_kunde(db, created.id, KundeUpdate(name="Service Bau Neu"))
        assert updated.name == "Service Bau Neu"

        items, total = list_kunden(db, offset=0, limit=10)
        assert total == 1
        assert len(items) == 1
        assert items[0].kunden_nr == "K-7000"

        delete_kunde(db, created.id)

        with pytest.raises(KundeNotFoundError):
            get_kunde(db, created.id)


def test_service_conflict_and_not_found_errors() -> None:
    session_local = _session_factory()
    with session_local() as db:
        create_kunde(db, KundeCreate(kunden_nr="K-7100", name="Alpha", adresse="A"))

        with pytest.raises(KundeConflictError):
            create_kunde(db, KundeCreate(kunden_nr="K-7100", name="Beta", adresse="B"))

        with pytest.raises(KundeNotFoundError):
            update_kunde(db, 9999, KundeUpdate(name="X"))

        with pytest.raises(KundeNotFoundError):
            delete_kunde(db, 9999)
