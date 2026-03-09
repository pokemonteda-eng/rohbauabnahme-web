"""add lackierungsdaten model

Revision ID: 20260307_0003
Revises: 20260307_0002
Create Date: 2026-03-07 14:20:00

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "20260307_0003"
down_revision: Union[str, Sequence[str], None] = "20260307_0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "lackierungsdaten",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("protokoll_id", sa.Integer(), nullable=False),
        sa.Column("klarlackschicht", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("klarlackschicht_bemerkung", sa.Text(), nullable=True),
        sa.Column("zinkstaubbeschichtung", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("zinkstaub_bemerkung", sa.Text(), nullable=True),
        sa.Column("e_kolben_beschichtung", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("e_kolben_bemerkung", sa.Text(), nullable=True),
        sa.Column("erstellt_am", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("aktualisiert_am", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["protokoll_id"], ["protokolle.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_lackierungsdaten_id"), "lackierungsdaten", ["id"], unique=False)
    op.create_index(op.f("ix_lackierungsdaten_protokoll_id"), "lackierungsdaten", ["protokoll_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_lackierungsdaten_protokoll_id"), table_name="lackierungsdaten")
    op.drop_index(op.f("ix_lackierungsdaten_id"), table_name="lackierungsdaten")
    op.drop_table("lackierungsdaten")
