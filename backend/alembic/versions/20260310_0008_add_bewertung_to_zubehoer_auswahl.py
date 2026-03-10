"""add bewertung to zubehoer_auswahl for r031

Revision ID: 20260310_0008
Revises: 20260309_0007
Create Date: 2026-03-10 00:00:00

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "20260310_0008"
down_revision: Union[str, Sequence[str], None] = "20260309_0007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("zubehoer_auswahl") as batch_op:
        batch_op.add_column(sa.Column("bewertung", sa.String(length=3), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("zubehoer_auswahl") as batch_op:
        batch_op.drop_column("bewertung")
