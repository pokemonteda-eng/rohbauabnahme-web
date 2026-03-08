"""add technische aenderungen model

Revision ID: 20260308_0004
Revises: 4f42fda21170
Create Date: 2026-03-08 16:55:00

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "20260308_0004"
down_revision: Union[str, Sequence[str], None] = "4f42fda21170"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "technische_aenderungen",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("protokoll_id", sa.Integer(), nullable=False),
        sa.Column("kabel_funklayout_geaendert", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("techn_aenderungen", sa.Text(), nullable=True),
        sa.Column("datum", sa.Date(), nullable=False),
        sa.ForeignKeyConstraint(["protokoll_id"], ["protokolle.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("protokoll_id"),
    )
    op.create_index(op.f("ix_technische_aenderungen_id"), "technische_aenderungen", ["id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_technische_aenderungen_id"), table_name="technische_aenderungen")
    op.drop_table("technische_aenderungen")
