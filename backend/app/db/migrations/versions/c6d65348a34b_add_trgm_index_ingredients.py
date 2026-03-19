"""add trgm index ingredients

Revision ID: c6d65348a34b
Revises: afe4d1b345b1
Create Date: 2026-03-11

"""
from alembic import op

revision = 'c6d65348a34b'
down_revision = 'afe4d1b345b1'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_ingredients_name_trgm
        ON recipe_ingredients USING gin (name gin_trgm_ops)
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_ingredients_name_normalized_trgm
        ON recipe_ingredients USING gin (name_normalized gin_trgm_ops)
    """)


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_ingredients_name_trgm")
    op.execute("DROP INDEX IF EXISTS ix_ingredients_name_normalized_trgm")