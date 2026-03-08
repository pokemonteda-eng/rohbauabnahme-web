"""make technical protokolle fields nullable for r010

Revision ID: 20260308_0005
Revises: 20260308_0004
Create Date: 2026-03-08 17:50:00

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "20260308_0005"
down_revision: Union[str, Sequence[str], None] = "20260308_0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column("protokolle", "kabel_funklayout_geaendert", existing_type=sa.Boolean(), nullable=True)
    op.alter_column("protokolle", "techn_aenderungen", existing_type=sa.Text(), nullable=True)
    op.alter_column("protokolle", "datum", existing_type=sa.Date(), nullable=True)


def downgrade() -> None:
    op.execute(
        """
        UPDATE protokolle
        SET kabel_funklayout_geaendert = false
        WHERE kabel_funklayout_geaendert IS NULL
        """
    )
    op.execute(
        """
        UPDATE protokolle
        SET datum = anlage_datum
        WHERE datum IS NULL
        """
    )
    op.alter_column("protokolle", "datum", existing_type=sa.Date(), nullable=False)
    op.alter_column("protokolle", "techn_aenderungen", existing_type=sa.Text(), nullable=True)
    op.alter_column("protokolle", "kabel_funklayout_geaendert", existing_type=sa.Boolean(), nullable=False)
