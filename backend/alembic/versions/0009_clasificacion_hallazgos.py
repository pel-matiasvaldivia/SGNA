"""calificacion del hallazgo de campo y su reflejo en Hallazgos / Desvios

Revision ID: 0009_clasificacion_hallazgos
Revises: 0008_empresas_auditadas
Create Date: 2026-10-09

El checklist de campo contestaba conforme / no conforme / N-A, y todo lo que
volvia marcado "no conforme" entraba al sistema como No Conformidad. Un informe
de auditoria no se escribe asi: distingue la no conformidad mayor de la menor,
y separa a las dos de la observacion y de la oportunidad de mejora, que no son
incumplimientos y no deberian abrir una accion correctiva.

Ademas, la planilla de Hallazgos / Desvios se cargaba a mano, repitiendo lo que
el auditor ya habia cargado en el celular.

Esta migracion agrega, en el schema de cada tenant:

- respuestas_control.clasificacion: como califica el auditor lo que vio.
  NULLABLE y sin default: NULL significa "sin calificar". Para una respuesta
  'no_conforme' anterior a esta columna, la aplicacion la interpreta como no
  conformidad menor, que es exactamente lo que venia haciendo, asi que ninguna
  respuesta ya cargada cambia de significado. Un default en la base habria
  calificado tambien a las respuestas conformes.
- respuestas_control.hallazgo_id: la fila de Hallazgos / Desvios que genero,
  al lado de nc_id, que ya existia para la No Conformidad.
- auditorias_hallazgos.origen y .asignacion_id: de donde salio el hallazgo.
  NULL = lo cargo alguien a mano en la consola, que es como nacian todos.

Mismas precauciones que 0008: se recorren los schemas uno por uno porque el
create_all del aprovisionamiento no agrega columnas a tablas que ya existen;
todo con IF NOT EXISTS para que un reintento no aborte el arranque; y el
nombre del indice no lleva el schema adentro, que con un slug con guion
(tenant_olca-sa) Postgres lo rechaza por sintaxis.
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0009_clasificacion_hallazgos'
down_revision = '0008_empresas_auditadas'
branch_labels = None
depends_on = None


def _schemas_de_tenants(conn):
    filas = conn.execute(sa.text(
        r"SELECT schema_name FROM information_schema.schemata "
        r"WHERE schema_name LIKE 'tenant\_%' ESCAPE '\'"
    )).fetchall()
    return [f[0] for f in filas]


def upgrade():
    conn = op.get_bind()
    for schema in _schemas_de_tenants(conn):
        conn.execute(sa.text(
            f'ALTER TABLE "{schema}".respuestas_control '
            f'ADD COLUMN IF NOT EXISTS clasificacion VARCHAR(40)'
        ))
        conn.execute(sa.text(
            f'ALTER TABLE "{schema}".respuestas_control '
            f'ADD COLUMN IF NOT EXISTS hallazgo_id UUID'
        ))
        conn.execute(sa.text(
            f'ALTER TABLE "{schema}".auditorias_hallazgos '
            f'ADD COLUMN IF NOT EXISTS origen VARCHAR(20)'
        ))
        conn.execute(sa.text(
            f'ALTER TABLE "{schema}".auditorias_hallazgos '
            f'ADD COLUMN IF NOT EXISTS asignacion_id UUID'
        ))
        conn.execute(sa.text(
            f'CREATE INDEX IF NOT EXISTS ix_auditorias_hallazgos_origen '
            f'ON "{schema}".auditorias_hallazgos (origen)'
        ))
        conn.execute(sa.text(
            f'CREATE INDEX IF NOT EXISTS ix_auditorias_hallazgos_asignacion_id '
            f'ON "{schema}".auditorias_hallazgos (asignacion_id)'
        ))
        # ADD CONSTRAINT no admite IF NOT EXISTS, asi que se consulta antes.
        # ON DELETE CASCADE: el hallazgo de campo no se sostiene solo, lo
        # sostiene la respuesta de la visita; si la visita se borra, el
        # hallazgo que genero se va con ella.
        existe = conn.execute(sa.text(
            "SELECT 1 FROM information_schema.table_constraints "
            "WHERE table_schema = :s AND table_name = 'auditorias_hallazgos' "
            "AND constraint_name = 'fk_hallazgos_asignacion'"
        ), {"s": schema}).first()
        if not existe:
            conn.execute(sa.text(
                f'ALTER TABLE "{schema}".auditorias_hallazgos '
                f'ADD CONSTRAINT fk_hallazgos_asignacion '
                f'FOREIGN KEY (asignacion_id) REFERENCES "{schema}".auditorias_asignaciones(id) '
                f'ON DELETE CASCADE'
            ))


def downgrade():
    conn = op.get_bind()
    for schema in _schemas_de_tenants(conn):
        conn.execute(sa.text(
            f'ALTER TABLE "{schema}".auditorias_hallazgos '
            f'DROP CONSTRAINT IF EXISTS fk_hallazgos_asignacion'
        ))
        for tabla, columnas in (
            ("auditorias_hallazgos", ("origen", "asignacion_id")),
            ("respuestas_control", ("clasificacion", "hallazgo_id")),
        ):
            for columna in columnas:
                conn.execute(sa.text(
                    f'ALTER TABLE "{schema}".{tabla} DROP COLUMN IF EXISTS {columna}'
                ))
