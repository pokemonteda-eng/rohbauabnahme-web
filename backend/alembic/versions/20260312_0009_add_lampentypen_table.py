"""add lampentypen table

Revision ID: 20260312_0009
Revises: 20260310_0008
Create Date: 2026-03-12 00:00:00

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260312_0009"
down_revision: Union[str, Sequence[str], None] = "20260310_0008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "lampen_typen",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("beschreibung", sa.Text(), nullable=False),
        sa.Column("icon_url", sa.String(length=500), nullable=False),
        sa.Column("standard_preis", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("version", sa.Integer(), server_default="1", nullable=False),
        sa.Column("angelegt_am", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("aktualisiert_am", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )
    op.create_index(op.f("ix_lampen_typen_id"), "lampen_typen", ["id"], unique=False)
    op.create_index(op.f("ix_lampen_typen_name"), "lampen_typen", ["name"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_lampen_typen_name"), table_name="lampen_typen")
    op.drop_index(op.f("ix_lampen_typen_id"), table_name="lampen_typen")
    op.drop_table("lampen_typen")
