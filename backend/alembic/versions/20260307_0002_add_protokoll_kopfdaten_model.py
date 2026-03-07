"""add protokoll kopfdaten model

Revision ID: 20260307_0002
Revises: 20260307_0001
Create Date: 2026-03-07 00:10:00

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "20260307_0002"
down_revision: Union[str, Sequence[str], None] = "20260307_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "protokolle",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("auftrags_nr", sa.String(length=64), nullable=False),
        sa.Column("kunde_id", sa.Integer(), nullable=False),
        sa.Column("aufbautyp", sa.String(length=64), nullable=False),
        sa.Column("vertriebsgebiet", sa.String(length=128), nullable=False),
        sa.Column("projektleiter", sa.String(length=255), nullable=False),
        sa.Column("datum", sa.Date(), nullable=False),
        sa.Column("status", sa.String(length=64), nullable=False),
        sa.ForeignKeyConstraint(["kunde_id"], ["customers.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("auftrags_nr"),
    )
    op.create_index(op.f("ix_protokolle_id"), "protokolle", ["id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_protokolle_id"), table_name="protokolle")
    op.drop_table("protokolle")
