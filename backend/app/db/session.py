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
