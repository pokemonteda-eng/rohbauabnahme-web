"""deduplicate lackierungsdaten and add unique index for protokoll_id

Revision ID: 20260309_0007
Revises: 20260308_0006
Create Date: 2026-03-09 00:00:00

"""

from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "20260309_0007"
down_revision: Union[str, Sequence[str], None] = "20260308_0006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Keep the latest row per protokoll_id before enforcing uniqueness.
    op.execute(
        """
        WITH ranked AS (
            SELECT
                id,
                ROW_NUMBER() OVER (PARTITION BY protokoll_id ORDER BY id DESC) AS row_num
            FROM lackierungsdaten
        )
        DELETE FROM lackierungsdaten
        WHERE id IN (
            SELECT id
            FROM ranked
            WHERE row_num > 1
        )
        """
    )
    op.execute(f"DROP INDEX IF EXISTS {op.f('ix_lackierungsdaten_protokoll_id')}")
    op.create_index(op.f("ix_lackierungsdaten_protokoll_id"), "lackierungsdaten", ["protokoll_id"], unique=True)


def downgrade() -> None:
    op.execute(f"DROP INDEX IF EXISTS {op.f('ix_lackierungsdaten_protokoll_id')}")
    op.create_index(op.f("ix_lackierungsdaten_protokoll_id"), "lackierungsdaten", ["protokoll_id"], unique=False)
