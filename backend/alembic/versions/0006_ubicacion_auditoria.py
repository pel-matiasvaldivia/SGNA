"""ubicacion y contacto de la auditoria de campo

Revision ID: 0006_ubicacion_auditoria
Revises: 0005_recuperacion_password
Create Date: 2026-10-07

El auditor de campo recibia la asignacion sin saber a donde ir ni a quien
buscar al llegar: el listado mostraba el AREA auditada junto a un icono de
mapa, que no es una ubicacion. Esta migracion agrega las dos mitades del dato:

- public.tenants: domicilio, telefono y contacto de la organizacion. Es el
  valor por defecto —la auditoria se hace casi siempre en la empresa— y se
  carga una sola vez desde Configuracion -> Organizacion.
- <tenant>.auditorias_asignaciones: lugar, domicilio, coordenadas, horario y
  referente en sitio de ESA visita, para cuando se audita en otra sede.

tenants vive en public (una sola tabla); las asignaciones viven en el schema de
cada tenant, y el create_all del aprovisionamiento crea tablas que faltan pero
NO agrega columnas a las que ya existen, asi que se recorren los schemas uno
por uno.
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0006_ubicacion_auditoria'
down_revision = '0005_recuperacion_password'
branch_labels = None
depends_on = None

# Columnas nuevas de la asignacion: (nombre, tipo SQL).
_COLUMNAS_ASIGNACION = [
    ("lugar_nombre", "VARCHAR(255)"),
    ("lugar_direccion", "VARCHAR(500)"),
    ("lugar_lat", "DOUBLE PRECISION"),
    ("lugar_lng", "DOUBLE PRECISION"),
    ("hora_inicio", "VARCHAR(5)"),
    ("hora_fin", "VARCHAR(5)"),
    ("contacto_nombre", "VARCHAR(255)"),
    ("contacto_cargo", "VARCHAR(255)"),
    ("contacto_telefono", "VARCHAR(60)"),
    ("contacto_email", "VARCHAR(255)"),
]

_COLUMNAS_TENANT = [
    ("domicilio", "VARCHAR(500)"),
    ("telefono", "VARCHAR(60)"),
    ("contacto_nombre", "VARCHAR(255)"),
    ("contacto_email", "VARCHAR(255)"),
]


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

    # IF NOT EXISTS en todo: la migracion tiene que poder reintentarse.
    for columna, tipo in _COLUMNAS_TENANT:
        conn.execute(sa.text(
            f'ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS {columna} {tipo}'
        ))

    for schema in _schemas_de_tenants(conn):
        for columna, tipo in _COLUMNAS_ASIGNACION:
            conn.execute(sa.text(
                f'ALTER TABLE IF EXISTS "{schema}".auditorias_asignaciones '
                f'ADD COLUMN IF NOT EXISTS {columna} {tipo}'
            ))


def downgrade() -> None:
    conn = op.get_bind()

    for schema in _schemas_de_tenants(conn):
        for columna, _ in _COLUMNAS_ASIGNACION:
            conn.execute(sa.text(
                f'ALTER TABLE IF EXISTS "{schema}".auditorias_asignaciones '
                f'DROP COLUMN IF EXISTS {columna}'
            ))

    for columna, _ in _COLUMNAS_TENANT:
        conn.execute(sa.text(
            f'ALTER TABLE public.tenants DROP COLUMN IF EXISTS {columna}'
        ))
