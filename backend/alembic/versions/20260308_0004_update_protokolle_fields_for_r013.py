"""update protokolle fields for r013

Revision ID: 20260308_0004
Revises: 4f42fda21170
Create Date: 2026-03-08 16:37:00

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
    op.add_column(
        "protokolle",
        sa.Column("kabel_funklayout_geaendert", sa.Boolean(), server_default=sa.false(), nullable=False),
    )
    op.add_column("protokolle", sa.Column("techn_aenderungen", sa.Text(), nullable=True))
    op.add_column("protokolle", sa.Column("anlage_datum", sa.Date(), nullable=True))
    op.execute("UPDATE protokolle SET anlage_datum = datum WHERE anlage_datum IS NULL")
    op.alter_column("protokolle", "anlage_datum", nullable=False)
    op.drop_column("protokolle", "status")


def downgrade() -> None:
    op.add_column("protokolle", sa.Column("status", sa.String(length=64), server_default="offen", nullable=False))
    op.drop_column("protokolle", "anlage_datum")
    op.drop_column("protokolle", "techn_aenderungen")
    op.drop_column("protokolle", "kabel_funklayout_geaendert")
