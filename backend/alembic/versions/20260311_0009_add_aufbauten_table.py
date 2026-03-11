"""add aufbauten table

Revision ID: 20260311_0009
Revises: 20260310_0008
Create Date: 2026-03-11 00:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "20260311_0009"
down_revision: str | None = "20260310_0008"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "aufbauten",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("bild_pfad", sa.String(length=500), nullable=False),
        sa.Column("aktiv", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("angelegt_am", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column(
            "aktualisiert_am",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_aufbauten_id"), "aufbauten", ["id"], unique=False)
    op.create_index(op.f("ix_aufbauten_name"), "aufbauten", ["name"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_aufbauten_name"), table_name="aufbauten")
    op.drop_index(op.f("ix_aufbauten_id"), table_name="aufbauten")
    op.drop_table("aufbauten")
