import threading
import zlib

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    # Toda conexión nueva arranca apuntando a public. Sin esto el default sería
    # ("$user", public) y un RESET dejaría el search_path fuera de nuestro control.
    connect_args={"options": "-csearch_path=public"},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@event.listens_for(SessionLocal, "after_begin")
def _apply_search_path(session, transaction, connection):
    """
    Re-aplica el search_path al comenzar CADA transacción de la sesión.

    Es imprescindible, no una optimización: `Session.commit()` devuelve la
    conexión al pool, así que la sentencia siguiente (el `db.refresh(obj)` que
    va después de un `db.commit()`, por ejemplo) puede tomar OTRA conexión, con
    el search_path en public. Sin este hook esa sentencia busca las tablas del
    tenant en public y falla con `relation "..." does not exist` aunque el INSERT
    anterior haya funcionado — dejando la fila creada pero la request en 500.
    """
    schema = session.info.get("tenant_schema")
    connection.exec_driver_sql(
        f'SET search_path TO "{schema}", public' if schema else "SET search_path TO public"
    )


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Schemas ya provisionados en ESTE proceso. Provisionar es idempotente pero
# costoso (create_all + ~15 ALTER), y se llamaba en cada request: con la página
# disparando 4-5 fetches en paralelo, todos entraban a la vez. El caché lo deja
# en una sola pasada por arranque; un deploy reinicia el proceso y lo vacía, así
# que los cambios de modelo se siguen aplicando igual que antes.
_provisioned_schemas: set[str] = set()
_provision_lock = threading.Lock()


def provision_tenant_schema(tenant_slug: str):
    """
    Ensures that the tenant schema exists and contains all required tables.
    """
    schema = f"tenant_{tenant_slug}"
    if schema in _provisioned_schemas:
        return

    # El lock serializa a los hilos de ESTE proceso; el advisory lock de abajo
    # serializa entre procesos/workers. Solo se cachea si todo salió bien.
    with _provision_lock:
        if schema in _provisioned_schemas:
            return
        _provision_tenant_schema(tenant_slug, schema)
        _provisioned_schemas.add(schema)


def _provision_tenant_schema(tenant_slug: str, schema: str):
    from app.models.base_class import Base
    import app.models  # Registers all models

    # Everything runs on a SINGLE dedicated connection whose search_path points at
    # the tenant schema. This is essential: Base.metadata.create_all must be bound
    # to the very same connection that has the search_path set, otherwise the pool
    # may hand create_all a different connection (default search_path) and the
    # tenant tables would be created in "public" instead of the tenant schema.
    with engine.begin() as conn:
        # 0. Lock de aplicación por schema, tomado ANTES de cualquier DDL y
        #    liberado solo al cerrar esta transacción. `CREATE SCHEMA IF NOT
        #    EXISTS` y el `checkfirst` de create_all NO son atómicos en Postgres:
        #    dos requests simultáneas del mismo tenant chequean "no existe" a la
        #    vez y la perdedora aborta con UniqueViolation sobre
        #    pg_namespace_nspname_index. Serializando acá, la segunda entra
        #    cuando la primera ya terminó y ve todo creado.
        conn.execute(text("SELECT pg_advisory_xact_lock(:key)"),
                     {"key": zlib.crc32(schema.encode("utf-8"))})

        # 1. Create schema and scope the connection to it.
        conn.execute(text(f'CREATE SCHEMA IF NOT EXISTS "{schema}"'))
        conn.execute(text(f'SET search_path TO "{schema}", public'))

        # 2. Create all SGI tables inside the tenant schema. Models with an explicit
        #    schema="public" (User, Tenant) stay in public regardless of search_path.
        Base.metadata.create_all(bind=conn)

        # 3b. Módulo Auditor en Campo (Fase 2): columna 'norma' en asignaciones si la
        #     tabla ya existía de una provisión anterior. Las tablas puntos_control y
        #     respuestas_control las crea create_all automáticamente.
        conn.execute(text(f'ALTER TABLE IF EXISTS "{schema}".auditorias_asignaciones ADD COLUMN IF NOT EXISTS norma VARCHAR(50);'))
        # Fase 4: firma digital de cierre y vínculo respuesta -> No Conformidad.
        conn.execute(text(f'ALTER TABLE IF EXISTS "{schema}".auditorias_asignaciones ADD COLUMN IF NOT EXISTS firma_url VARCHAR(500);'))
        conn.execute(text(f'ALTER TABLE IF EXISTS "{schema}".auditorias_asignaciones ADD COLUMN IF NOT EXISTS firmado_por VARCHAR(255);'))
        conn.execute(text(f'ALTER TABLE IF EXISTS "{schema}".auditorias_asignaciones ADD COLUMN IF NOT EXISTS firmado_at TIMESTAMPTZ;'))
        conn.execute(text(f'ALTER TABLE IF EXISTS "{schema}".respuestas_control ADD COLUMN IF NOT EXISTS nc_id UUID;'))
        # Fase 5: evidencia de voz por punto de control y su transcripción a texto.
        conn.execute(text(f'ALTER TABLE IF EXISTS "{schema}".respuestas_control ADD COLUMN IF NOT EXISTS audio_url VARCHAR(500);'))
        conn.execute(text(f'ALTER TABLE IF EXISTS "{schema}".respuestas_control ADD COLUMN IF NOT EXISTS transcripcion TEXT;'))
        conn.execute(text(f'ALTER TABLE IF EXISTS "{schema}".respuestas_control ADD COLUMN IF NOT EXISTS transcripcion_estado VARCHAR(20);'))

        # 3. Dynamic schema migration for Phase 10 (RiesgoOportunidad columns).
        conn.execute(text(f'ALTER TABLE "{schema}".riesgos_oportunidades ADD COLUMN IF NOT EXISTS probabilidad_residual INTEGER DEFAULT 3;'))
        conn.execute(text(f'ALTER TABLE "{schema}".riesgos_oportunidades ADD COLUMN IF NOT EXISTS impacto_residual INTEGER DEFAULT 3;'))
        conn.execute(text(f'ALTER TABLE "{schema}".riesgos_oportunidades ADD COLUMN IF NOT EXISTS proceso_id UUID;'))
        conn.execute(text(f'ALTER TABLE "{schema}".riesgos_oportunidades ADD COLUMN IF NOT EXISTS evidencia_documento_id UUID;'))

        # Add foreign key constraints if not exists
        conn.execute(text(f'''
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_riesgos_proceso') THEN
                    ALTER TABLE "{schema}".riesgos_oportunidades
                    ADD CONSTRAINT fk_riesgos_proceso
                    FOREIGN KEY (proceso_id) REFERENCES "{schema}".procesos_bpm(id) ON DELETE SET NULL;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_riesgos_evidencia') THEN
                    ALTER TABLE "{schema}".riesgos_oportunidades
                    ADD CONSTRAINT fk_riesgos_evidencia
                    FOREIGN KEY (evidencia_documento_id) REFERENCES "{schema}".documents(id) ON DELETE SET NULL;
                END IF;
            END $$;
        '''))
        # Reset the search_path before the connection returns to the pool so it does
        # not leak the tenant scope to an unrelated request that reuses it.
        conn.execute(text('SET search_path TO public'))

    # 4. Provision the isolated object-storage bucket for this tenant.
    #    Bucket creation is handled lazily by S3Service on first upload,
    #    but we provision it up-front here so it exists from day one.
    try:
        from app.services.s3 import s3_service
        s3_service._ensure_bucket_exists(f"tenant-{tenant_slug}")
    except Exception as e:
        print(f"Warning: bucket provisioning failed for {tenant_slug}: {e}")

def get_tenant_db(tenant_slug: str):
    """
    Dependency that returns a DB session with the search_path configured
    for the specific tenant, providing data isolation.
    """
    provision_tenant_schema(tenant_slug)
    db = SessionLocal()
    # El search_path lo aplica el listener `_apply_search_path` al inicio de cada
    # transacción, no una sola vez acá: así sobrevive a los commits intermedios.
    db.info["tenant_schema"] = f"tenant_{tenant_slug}"
    try:
        yield db
    finally:
        # Sin SET de vuelta a public: si la request terminó con la transacción
        # abortada, ese SET explotaba con InFailedSqlTransaction y enmascaraba el
        # error real. `close()` devuelve la conexión al pool haciendo rollback, y
        # el listener fija el search_path del próximo uso.
        db.close()
