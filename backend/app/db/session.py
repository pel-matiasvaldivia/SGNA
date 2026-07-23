from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL, 
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def provision_tenant_schema(tenant_slug: str):
    """
    Ensures that the tenant schema exists and contains all required tables.
    """
    from app.models.base_class import Base
    import app.models  # Registers all models

    schema = f"tenant_{tenant_slug}"

    # Everything runs on a SINGLE dedicated connection whose search_path points at
    # the tenant schema. This is essential: Base.metadata.create_all must be bound
    # to the very same connection that has the search_path set, otherwise the pool
    # may hand create_all a different connection (default search_path) and the
    # tenant tables would be created in "public" instead of the tenant schema.
    with engine.begin() as conn:
        # 1. Create schema and scope the connection to it.
        conn.execute(text(f'CREATE SCHEMA IF NOT EXISTS "{schema}"'))
        conn.execute(text(f'SET search_path TO "{schema}", public'))

        # 2. Create all SGI tables inside the tenant schema. Models with an explicit
        #    schema="public" (User, Tenant) stay in public regardless of search_path.
        Base.metadata.create_all(bind=conn)

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
    try:
        db.execute(text(f'SET search_path TO "tenant_{tenant_slug}", public'))
        yield db
    finally:
        db.execute(text('SET search_path TO public'))
        db.close()
