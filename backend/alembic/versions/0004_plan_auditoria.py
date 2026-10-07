"""plan de auditoria y checklist por modulos

Revision ID: 0004_plan_auditoria
Revises: 0003_approval_document_version
Create Date: 2026-10-07

Agrega el Plan de Auditoria (documento que se acuerda con la organizacion antes
de auditar, ISO 19011 6.3) y los dos campos que le faltaban al checklist para
servir como el de papel: a que modulo de la jornada pertenece cada punto y que
evidencia hay que pedir.

Todo esto vive en el schema de CADA tenant, no en public, y el create_all del
aprovisionamiento crea tablas que faltan pero NO agrega columnas a las que ya
existen. Por eso se recorren los schemas uno por uno: los tenants nuevos reciben
la tabla del modelo, los existentes de aca.
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0004_plan_auditoria'
down_revision = '0003_approval_document_version'
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
        # IF NOT EXISTS en todo: la migracion tiene que poder reintentarse, y un
        # tenant recien aprovisionado ya puede traer la tabla desde el modelo.
        conn.execute(sa.text(f'''
            CREATE TABLE IF NOT EXISTS "{schema}".planes_auditoria (
                id UUID PRIMARY KEY,
                programa_id UUID NOT NULL UNIQUE
                    REFERENCES "{schema}".programas_auditoria(id) ON DELETE CASCADE,
                codigo VARCHAR(50) NOT NULL,
                revision VARCHAR(10) NOT NULL DEFAULT '01',
                fecha_emision DATE NOT NULL,
                norma VARCHAR(120),
                organizacion VARCHAR(255),
                ente_certificador VARCHAR(255),
                lugar_sede TEXT,
                auditor_lider VARCHAR(255),
                coordinador_sgc VARCHAR(255),
                fecha_auditoria DATE,
                jornada VARCHAR(100),
                objetivo TEXT,
                alcance TEXT,
                criterios TEXT,
                cronograma JSON NOT NULL DEFAULT '[]'::json,
                created_at TIMESTAMPTZ DEFAULT now(),
                updated_at TIMESTAMPTZ DEFAULT now(),
                tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE
            )
        '''))
        # El nombre del indice NO lleva el schema adentro: un slug con guion
        # ("olca-sa") daria ix_tenant_olca-sa_... y Postgres lo rechaza por
        # sintaxis. El indice se crea en el schema de su tabla, asi que el
        # nombre simple ya es unico.
        conn.execute(sa.text(
            'CREATE INDEX IF NOT EXISTS ix_planes_auditoria_tenant '
            f'ON "{schema}".planes_auditoria (tenant_id)'
        ))

        # Contador de codigos emitidos. Va aparte de los planes para que borrar
        # un programa no haga retroceder el correlativo y se reemita un codigo
        # que ya se entrego impreso.
        conn.execute(sa.text(f'''
            CREATE TABLE IF NOT EXISTS "{schema}".planes_auditoria_correlativo (
                tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
                anio INTEGER NOT NULL,
                ultimo INTEGER NOT NULL DEFAULT 0,
                PRIMARY KEY (tenant_id, anio)
            )
        '''))
        # Si ya hubiera planes emitidos, el contador arranca donde ellos
        # terminaron; si no, la tabla queda vacia y el primero sera el 01.
        conn.execute(sa.text(f'''
            INSERT INTO "{schema}".planes_auditoria_correlativo (tenant_id, anio, ultimo)
            SELECT tenant_id,
                   CAST(split_part(codigo, '-', 3) AS INTEGER),
                   MAX(CAST(split_part(codigo, '-', 4) AS INTEGER))
              FROM "{schema}".planes_auditoria
             WHERE codigo ~ '^PL-AUD-[0-9]{{4}}-[0-9]+$'
             GROUP BY tenant_id, CAST(split_part(codigo, '-', 3) AS INTEGER)
            ON CONFLICT (tenant_id, anio) DO NOTHING
        '''))

        conn.execute(sa.text(
            f'ALTER TABLE IF EXISTS "{schema}".programas_auditoria '
            'ADD COLUMN IF NOT EXISTS norma VARCHAR(50)'
        ))
        conn.execute(sa.text(
            f'ALTER TABLE IF EXISTS "{schema}".puntos_control '
            'ADD COLUMN IF NOT EXISTS modulo VARCHAR(255)'
        ))
        conn.execute(sa.text(
            f'ALTER TABLE IF EXISTS "{schema}".puntos_control '
            'ADD COLUMN IF NOT EXISTS evidencia_solicitada TEXT'
        ))


def downgrade() -> None:
    conn = op.get_bind()
    for schema in _schemas_de_tenants(conn):
        conn.execute(sa.text(f'DROP TABLE IF EXISTS "{schema}".planes_auditoria'))
        conn.execute(sa.text(f'DROP TABLE IF EXISTS "{schema}".planes_auditoria_correlativo'))
        conn.execute(sa.text(
            f'ALTER TABLE IF EXISTS "{schema}".programas_auditoria '
            'DROP COLUMN IF EXISTS norma'
        ))
        conn.execute(sa.text(
            f'ALTER TABLE IF EXISTS "{schema}".puntos_control '
            'DROP COLUMN IF EXISTS modulo'
        ))
        conn.execute(sa.text(
            f'ALTER TABLE IF EXISTS "{schema}".puntos_control '
            'DROP COLUMN IF EXISTS evidencia_solicitada'
        ))
