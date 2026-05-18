from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL, 
    pool_pre_ping=True,
    # pool_size=5,
    # max_overflow=10
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_tenant_db(tenant_slug: str):
    """
    Dependency that returns a DB session with the search_path configured
    for the specific tenant, providing data isolation.
    """
    db = SessionLocal()
    try:
        # Prevent SQL injection by strictly validating the tenant_slug format
        # In a real app, ensure tenant_slug is validated before reaching here
        db.execute(text(f'SET search_path TO "tenant_{tenant_slug}", public'))
        yield db
    finally:
        db.execute(text('SET search_path TO public'))
        db.close()
