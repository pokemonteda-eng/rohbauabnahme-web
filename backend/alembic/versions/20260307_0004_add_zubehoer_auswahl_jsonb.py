"""add zubehoer auswahl jsonb column

Revision ID: 20260307_0004
Revises: 20260307_0003
Create Date: 2026-03-07 19:40:00

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "20260307_0004"
down_revision: Union[str, Sequence[str], None] = "20260307_0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "protokolle",
        sa.Column(
            "zubehoer_auswahl",
            sa.JSON().with_variant(postgresql.JSONB(astext_type=sa.Text()), "postgresql"),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column("protokolle", "zubehoer_auswahl")
