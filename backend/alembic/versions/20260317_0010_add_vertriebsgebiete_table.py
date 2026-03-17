"""add vertriebsgebiete table

Revision ID: 20260317_0010
Revises: 20260312_0009
Create Date: 2026-03-17 00:00:00

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260317_0010"
down_revision: Union[str, Sequence[str], None] = "20260312_0009"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "vertriebsgebiete",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("version", sa.Integer(), server_default="1", nullable=False),
        sa.Column("angelegt_am", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("aktualisiert_am", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )
    op.create_index(op.f("ix_vertriebsgebiete_id"), "vertriebsgebiete", ["id"], unique=False)
    op.create_index(op.f("ix_vertriebsgebiete_name"), "vertriebsgebiete", ["name"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_vertriebsgebiete_name"), table_name="vertriebsgebiete")
    op.drop_index(op.f("ix_vertriebsgebiete_id"), table_name="vertriebsgebiete")
    op.drop_table("vertriebsgebiete")
