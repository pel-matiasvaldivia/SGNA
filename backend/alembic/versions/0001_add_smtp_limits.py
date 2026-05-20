"""add smtp and limits to tenants

Revision ID: 0001_add_smtp_limits
Revises: 
Create Date: 2026-05-20

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0001_add_smtp_limits'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('tenants', sa.Column('smtp_host', sa.String(), nullable=True))
    op.add_column('tenants', sa.Column('smtp_port', sa.String(), nullable=True))
    op.add_column('tenants', sa.Column('smtp_user', sa.String(), nullable=True))
    op.add_column('tenants', sa.Column('smtp_password', sa.String(), nullable=True))
    op.add_column('tenants', sa.Column('smtp_encryption', sa.String(), nullable=True, server_default='tls'))
    op.add_column('tenants', sa.Column('max_users', sa.Integer(), nullable=True, server_default='10'))
    op.add_column('tenants', sa.Column('storage_limit_mb', sa.Integer(), nullable=True, server_default='5120'))


def downgrade() -> None:
    op.drop_column('tenants', 'storage_limit_mb')
    op.drop_column('tenants', 'max_users')
    op.drop_column('tenants', 'smtp_encryption')
    op.drop_column('tenants', 'smtp_password')
    op.drop_column('tenants', 'smtp_user')
    op.drop_column('tenants', 'smtp_port')
    op.drop_column('tenants', 'smtp_host')
