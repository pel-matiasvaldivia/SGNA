"""recuperacion de contrasena (vales de un solo uso)

Revision ID: 0005_recuperacion_password
Revises: 0004_plan_auditoria
Create Date: 2026-10-07

Crea public.password_reset_tokens, la tabla que respalda el flujo de "olvide mi
contrasena". Va en public —y no en el schema de cada tenant— porque las cuentas
viven en public.users: la misma persona puede pertenecer a varias
organizaciones y su contrasena es una sola.

Lo que se guarda es el SHA-256 del token, nunca el token: el valor en claro
existe solo en el enlace que recibio la persona.
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0005_recuperacion_password'
down_revision = '0004_plan_auditoria'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    # IF NOT EXISTS: la migracion tiene que poder reintentarse, y una base
    # recien creada ya puede traer la tabla desde el create_all del modelo.
    conn.execute(sa.text('''
        CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
            id UUID PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
            token_hash VARCHAR(64) NOT NULL UNIQUE,
            expires_at TIMESTAMPTZ NOT NULL,
            used_at TIMESTAMPTZ,
            ip_solicitud VARCHAR(64),
            created_at TIMESTAMPTZ DEFAULT now()
        )
    '''))
    # Por usuario: la consulta del throttle y la invalidacion de los vales
    # anteriores filtran por user_id.
    conn.execute(sa.text(
        'CREATE INDEX IF NOT EXISTS ix_password_reset_tokens_user_id '
        'ON public.password_reset_tokens (user_id)'
    ))
    # Por huella: es el camino de lectura de cada canje. UNIQUE ya crea un
    # indice, pero se declara igual para que coincida con el modelo
    # (index=True) y un autogenerate no lo proponga de nuevo.
    conn.execute(sa.text(
        'CREATE INDEX IF NOT EXISTS ix_password_reset_tokens_token_hash '
        'ON public.password_reset_tokens (token_hash)'
    ))


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text('DROP TABLE IF EXISTS public.password_reset_tokens'))
