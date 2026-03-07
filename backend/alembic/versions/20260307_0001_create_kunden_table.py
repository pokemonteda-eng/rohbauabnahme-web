"""create kunden table

Revision ID: 20260307_0001
Revises:
Create Date: 2026-03-07 00:00:00

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "20260307_0001"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "kunden",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("kunden_nr", sa.String(length=64), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("adresse", sa.String(length=500), nullable=False),
        sa.Column("angelegt_am", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_kunden_id"), "kunden", ["id"], unique=False)
    op.create_index(op.f("ix_kunden_kunden_nr"), "kunden", ["kunden_nr"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_kunden_kunden_nr"), table_name="kunden")
    op.drop_index(op.f("ix_kunden_id"), table_name="kunden")
    op.drop_table("kunden")
