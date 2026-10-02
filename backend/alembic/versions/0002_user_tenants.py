"""membresías usuario-organización (auditor externo multi-tenant)

Revision ID: 0002_user_tenants
Revises: 0001_add_smtp_limits
Create Date: 2026-10-01

Separa identidad (public.users, un correo por persona) de pertenencia
(public.user_tenants, una fila por organización). Antes de este cambio una
misma persona no podía existir en dos organizaciones, porque el correo es
único en toda la plataforma: eso bloqueaba invitar como auditor de campo a
alguien que ya tenía cuenta en otra cuenta de cliente.

El correo SIGUE siendo único. No se toca esa restricción: es la que mantiene
sin ambigüedad el 2FA, el login y el restablecimiento de contraseña.
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0002_user_tenants'
down_revision = '0001_add_smtp_limits'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'user_tenants',
        sa.Column('id', sa.dialects.postgresql.UUID(as_uuid=True),
                  primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', sa.dialects.postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tenant_id', sa.dialects.postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('role', sa.String(length=50), nullable=False, server_default='collaborator'),
        sa.Column('active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['public.users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tenant_id'], ['public.tenants.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('user_id', 'tenant_id', name='uq_user_tenants_user_tenant'),
        schema='public',
    )
    op.create_index('ix_user_tenants_user_id', 'user_tenants', ['user_id'], schema='public')
    op.create_index('ix_user_tenants_tenant_id', 'user_tenants', ['tenant_id'], schema='public')
    op.create_index('ix_user_tenants_tenant_role', 'user_tenants', ['tenant_id', 'role'], schema='public')

    # Backfill: cada cuenta existente queda como miembro de su organización de
    # origen, con el rol y el estado que ya tenía. El superadmin tiene
    # tenant_id NULL y queda fuera a propósito: no pertenece a ninguna.
    op.execute(
        """
        INSERT INTO public.user_tenants (id, user_id, tenant_id, role, active, created_at)
        SELECT gen_random_uuid(), u.id, u.tenant_id, u.role, COALESCE(u.active, true),
               COALESCE(u.created_at, now())
        FROM public.users u
        WHERE u.tenant_id IS NOT NULL
        ON CONFLICT (user_id, tenant_id) DO NOTHING
        """
    )


def downgrade() -> None:
    op.drop_index('ix_user_tenants_tenant_role', table_name='user_tenants', schema='public')
    op.drop_index('ix_user_tenants_tenant_id', table_name='user_tenants', schema='public')
    op.drop_index('ix_user_tenants_user_id', table_name='user_tenants', schema='public')
    op.drop_table('user_tenants', schema='public')
