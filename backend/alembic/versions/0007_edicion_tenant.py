"""edicion contratada del tenant

Revision ID: 0007_edicion_tenant
Revises: 0006_ubicacion_auditoria
Create Date: 2026-10-09

La plataforma se ofrece en dos niveles —ejecutar auditorias internas, o
implementar un SGI completo— pero los dos veian los 22 modulos. Quien habia
contratado para auditar entraba y se encontraba con Huella de Carbono, CMMS y
Revision por la Direccion, todos vacios.

Esta migracion agrega la columna que guarda esa eleccion.

Se deja NULLABLE y SIN default a proposito. NULL no significa "completa":
significa "todavia no contesto la pregunta del asistente de alta", y es lo que
hace que el asistente aparezca una sola vez. A efectos de permisos NULL SI se
resuelve como la edicion completa (`normalizar_edicion` en
app/data/modules_catalog.py), de modo que los tenants que ya existian no
pierden el acceso a ningun modulo mientras no elijan.

Poner un default 'completa' en la base habria sido peor: los tenants
existentes quedarian indistinguibles de los que eligieron esa edicion a
conciencia, y no habria forma de saber a quien le falta contestar.

tenants vive en public (una sola tabla), asi que no hay que recorrer schemas.
"""
from alembic import op

# revision identifiers, used by Alembic.
revision = '0007_edicion_tenant'
down_revision = '0006_ubicacion_auditoria'
branch_labels = None
depends_on = None


def upgrade():
    # IF NOT EXISTS para que un reintento tras un fallo parcial no aborte el
    # arranque del contenedor (el CMD del Dockerfile encadena con &&).
    op.execute("ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS edicion VARCHAR(20)")


def downgrade():
    op.execute("ALTER TABLE public.tenants DROP COLUMN IF EXISTS edicion")
