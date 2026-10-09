"""cartera de empresas auditadas

Revision ID: 0008_empresas_auditadas
Revises: 0007_edicion_tenant
Create Date: 2026-10-09

La plataforma asumia que la organizacion auditaba SU PROPIA casa: la ficha de
public.tenants era a la vez quien usa el sistema y que se audita. Para un
auditor interno eso es cierto; para un auditor externo o un consultor con
quince clientes, no: todas sus auditorias salian con el nombre y el domicilio
de su propio estudio, y el auditor de campo recibia la direccion equivocada.

Esta migracion agrega, en el schema de cada tenant:

- empresas_auditadas: la cartera de clientes, con domicilio, pin, referente y
  actividad. Vive en el schema del tenant porque la cartera de un estudio es
  informacion suya.
- auditorias_asignaciones.empresa_id: a que empresa corresponde esa visita.
  NULLABLE y sin default: NULL significa "se audita la propia organizacion",
  que es como se comportaba todo hasta ahora. Asi, ninguna asignacion
  existente cambia de significado ni de domicilio.

El create_all del aprovisionamiento crea tablas que faltan pero NO agrega
columnas a las que ya existen, asi que se recorren los schemas uno por uno.
Todo con IF NOT EXISTS para que un reintento tras un fallo parcial no aborte el
arranque del contenedor (el CMD del Dockerfile encadena con &&).

El nombre del indice NO lleva el schema adentro: un slug con guion
(tenant_olca-sa) produciria ix_tenant_olca-sa_... y Postgres lo rechaza por
sintaxis. El indice se crea dentro del schema, que ya lo distingue.
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0008_empresas_auditadas'
down_revision = '0007_edicion_tenant'
branch_labels = None
depends_on = None


_CREAR_TABLA = """
CREATE TABLE IF NOT EXISTS "{schema}".empresas_auditadas (
    id UUID PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    identificacion VARCHAR(60),
    actividad VARCHAR(255),
    domicilio VARCHAR(500),
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    telefono VARCHAR(60),
    contacto_nombre VARCHAR(255),
    contacto_cargo VARCHAR(255),
    contacto_telefono VARCHAR(60),
    contacto_email VARCHAR(255),
    notas TEXT,
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
)
"""


def _schemas_de_tenants(conn):
    filas = conn.execute(sa.text(
        r"SELECT schema_name FROM information_schema.schemata "
        r"WHERE schema_name LIKE 'tenant\_%' ESCAPE '\'"
    )).fetchall()
    return [f[0] for f in filas]


def upgrade():
    conn = op.get_bind()
    for schema in _schemas_de_tenants(conn):
        conn.execute(sa.text(_CREAR_TABLA.format(schema=schema)))
        conn.execute(sa.text(
            f'CREATE INDEX IF NOT EXISTS ix_empresas_auditadas_tenant_id '
            f'ON "{schema}".empresas_auditadas (tenant_id)'
        ))
        conn.execute(sa.text(
            f'ALTER TABLE "{schema}".auditorias_asignaciones '
            f'ADD COLUMN IF NOT EXISTS empresa_id UUID'
        ))
        conn.execute(sa.text(
            f'CREATE INDEX IF NOT EXISTS ix_auditorias_asignaciones_empresa_id '
            f'ON "{schema}".auditorias_asignaciones (empresa_id)'
        ))
        # La FK va aparte y tolera repetirse: ADD CONSTRAINT no admite
        # IF NOT EXISTS, asi que se consulta antes. ON DELETE SET NULL y no
        # CASCADE: borrar una empresa de la cartera no puede llevarse puestas
        # las auditorias que ya se le hicieron.
        existe = conn.execute(sa.text(
            "SELECT 1 FROM information_schema.table_constraints "
            "WHERE table_schema = :s AND table_name = 'auditorias_asignaciones' "
            "AND constraint_name = 'fk_asignaciones_empresa'"
        ), {"s": schema}).first()
        if not existe:
            conn.execute(sa.text(
                f'ALTER TABLE "{schema}".auditorias_asignaciones '
                f'ADD CONSTRAINT fk_asignaciones_empresa '
                f'FOREIGN KEY (empresa_id) REFERENCES "{schema}".empresas_auditadas(id) '
                f'ON DELETE SET NULL'
            ))


def downgrade():
    conn = op.get_bind()
    for schema in _schemas_de_tenants(conn):
        conn.execute(sa.text(
            f'ALTER TABLE "{schema}".auditorias_asignaciones '
            f'DROP CONSTRAINT IF EXISTS fk_asignaciones_empresa'
        ))
        conn.execute(sa.text(
            f'ALTER TABLE "{schema}".auditorias_asignaciones '
            f'DROP COLUMN IF EXISTS empresa_id'
        ))
        conn.execute(sa.text(f'DROP TABLE IF EXISTS "{schema}".empresas_auditadas'))
