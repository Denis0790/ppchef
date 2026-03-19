"""add referral fields

Revision ID: cc852a7323fe
Revises: 9123a7bb38cb
Create Date: 2026-03-15

"""
from alembic import op
import sqlalchemy as sa

revision = 'cc852a7323fe'
down_revision = '9123a7bb38cb'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('users', sa.Column('ref_code', sa.String(20), nullable=True))
    op.add_column('users', sa.Column('referred_by', sa.UUID(), nullable=True))
    op.add_column('users', sa.Column('referral_count', sa.Integer(), nullable=True, server_default='0'))
    op.create_index('ix_users_ref_code', 'users', ['ref_code'], unique=True)
    op.create_foreign_key('fk_users_referred_by', 'users', 'users', ['referred_by'], ['id'], ondelete='SET NULL')


def downgrade() -> None:
    op.drop_constraint('fk_users_referred_by', 'users', type_='foreignkey')
    op.drop_index('ix_users_ref_code', table_name='users')
    op.drop_column('users', 'referral_count')
    op.drop_column('users', 'referred_by')
    op.drop_column('users', 'ref_code')