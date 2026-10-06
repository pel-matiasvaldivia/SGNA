"""atar la firma de aprobacion a la version del documento

Revision ID: 0003_approval_document_version
Revises: 0002_user_tenants
Create Date: 2026-10-06

El hash de la aprobacion se calculaba sobre aprobador, fecha, estado y id del
documento, pero no sobre la version: una version subida despues quedaba
aparentemente cubierta por una aprobacion anterior. Se agrega la columna para
guardar que version se firmo y poder recalcular el hash al verificar.

`document_approvals` vive en el schema de cada tenant, no en public, y el
`create_all` del aprovisionamiento crea tablas que faltan pero NO agrega
columnas a las que ya existen. Por eso hay que recorrer los schemas uno por
uno: los tenants nuevos la reciben del modelo, los existentes de aca.
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0003_approval_document_version'
down_revision = '0002_user_tenants'
branch_labels = None
depends_on = None


def _schemas_de_tenants(conn):
    return [
        r[0] for r in conn.execute(
            sa.text(
                "SELECT schema_name FROM information_schema.schemata "
                "WHERE schema_name LIKE 'tenant\\_%' ESCAPE '\\' ORDER BY schema_name"
            )
        )
    ]


def upgrade() -> None:
    conn = op.get_bind()
    for schema in _schemas_de_tenants(conn):
        # IF NOT EXISTS: la migracion tiene que poder reintentarse, y un tenant
        # recien aprovisionado ya puede traer la columna desde el modelo.
        conn.execute(
            sa.text(
                f'ALTER TABLE IF EXISTS "{schema}".document_approvals '
                'ADD COLUMN IF NOT EXISTS document_version INTEGER'
            )
        )


def downgrade() -> None:
    conn = op.get_bind()
    for schema in _schemas_de_tenants(conn):
        conn.execute(
            sa.text(
                f'ALTER TABLE IF EXISTS "{schema}".document_approvals '
                'DROP COLUMN IF EXISTS document_version'
            )
        )
