"""add lampen typen table

Revision ID: 20260311_0010
Revises: 20260310_0008
Create Date: 2026-03-11 00:00:01.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "20260311_0010"
down_revision: str | None = "20260310_0008"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "lampen_typen",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("beschreibung", sa.Text(), nullable=False),
        sa.Column("icon_url", sa.String(length=500), nullable=False),
        sa.Column("standard_preis", sa.Numeric(10, 2), nullable=False),
        sa.Column("angelegt_am", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("aktualisiert_am", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )
    op.create_index(op.f("ix_lampen_typen_id"), "lampen_typen", ["id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_lampen_typen_id"), table_name="lampen_typen")
    op.drop_table("lampen_typen")
