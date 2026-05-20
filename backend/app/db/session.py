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

    db = SessionLocal()
    try:
        # 1. Create schema dynamically
        db.execute(text(f'CREATE SCHEMA IF NOT EXISTS "tenant_{tenant_slug}"'))
        db.execute(text(f'SET search_path TO "tenant_{tenant_slug}", public'))
        db.commit()
        # 2. Run metadata DDL generation on search_path
        Base.metadata.create_all(bind=engine)

        # 3. Dynamic schema migration for Phase 10 (RiesgoOportunidad columns)
        db.execute(text(f'ALTER TABLE "tenant_{tenant_slug}".riesgos_oportunidades ADD COLUMN IF NOT EXISTS probabilidad_residual INTEGER DEFAULT 3;'))
        db.execute(text(f'ALTER TABLE "tenant_{tenant_slug}".riesgos_oportunidades ADD COLUMN IF NOT EXISTS impacto_residual INTEGER DEFAULT 3;'))
        db.execute(text(f'ALTER TABLE "tenant_{tenant_slug}".riesgos_oportunidades ADD COLUMN IF NOT EXISTS proceso_id UUID;'))
        db.execute(text(f'ALTER TABLE "tenant_{tenant_slug}".riesgos_oportunidades ADD COLUMN IF NOT EXISTS evidencia_documento_id UUID;'))
        
        # Add foreign key constraints if not exists
        db.execute(text(f'''
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_riesgos_proceso') THEN
                    ALTER TABLE "tenant_{tenant_slug}".riesgos_oportunidades 
                    ADD CONSTRAINT fk_riesgos_proceso 
                    FOREIGN KEY (proceso_id) REFERENCES "tenant_{tenant_slug}".procesos_bpm(id) ON DELETE SET NULL;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_riesgos_evidencia') THEN
                    ALTER TABLE "tenant_{tenant_slug}".riesgos_oportunidades 
                    ADD CONSTRAINT fk_riesgos_evidencia 
                    FOREIGN KEY (evidencia_documento_id) REFERENCES "tenant_{tenant_slug}".documents(id) ON DELETE SET NULL;
                END IF;
            END $$;
        '''))
        # 4. Provision MinIO Bucket
        try:
            from minio import Minio
            from minio.error import S3Error
            
            # Use settings or defaults
            minio_url = getattr(settings, "MINIO_URL", "localhost:9000")
            minio_access = getattr(settings, "MINIO_ACCESS_KEY", "minioadmin")
            minio_secret = getattr(settings, "MINIO_SECRET_KEY", "minioadmin")
            
            # Remove http/https for minio client
            endpoint = minio_url.replace("http://", "").replace("https://", "")
            secure = minio_url.startswith("https")
            
            client = Minio(
                endpoint,
                access_key=minio_access,
                secret_key=minio_secret,
                secure=secure
            )
            
            bucket_name = f"tenant-{tenant_slug}"
            if not client.bucket_exists(bucket_name):
                client.make_bucket(bucket_name)
                print(f"Bucket {bucket_name} created successfully.")
        except Exception as e:
            print(f"Warning: MinIO bucket provisioning failed for {tenant_slug}: {e}")
            
    finally:
        db.execute(text('SET search_path TO public'))
        db.close()

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
