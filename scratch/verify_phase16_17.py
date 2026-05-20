import sys
import os

# Set the path to the backend directory
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

def verify_models():
    print("Verifying Models Phase 16 (SST) & Phase 17 (CMMS)...")
    try:
        from app.models.sst import IncidenteSST, InspeccionSST
        from app.models.mantenimiento import ActivoInfraestructura, OrdenTrabajoMantenimiento
        print("✅ SQLAlchemy Models imported successfully.")
    except ImportError as e:
        print(f"❌ Failed to import Models: {e}")
        return False
    return True

def verify_schemas():
    print("Verifying Schemas...")
    try:
        from app.schemas.sst import IncidenteCreate, InspeccionCreate
        from app.schemas.mantenimiento import ActivoCreate, OrdenTrabajoCreate
        print("✅ Pydantic Schemas imported successfully.")
    except ImportError as e:
        print(f"❌ Failed to import Schemas: {e}")
        return False
    return True

def verify_routers():
    print("Verifying Routers...")
    try:
        from app.api.v1.sst_api import router as sst_router
        from app.api.v1.mantenimiento_api import router as cmms_router
        print("✅ Routers imported successfully.")
    except ImportError as e:
        print(f"❌ Failed to import Routers: {e}")
        return False
    return True

def main():
    if verify_models() and verify_schemas() and verify_routers():
        print("\n🚀 Phase 16 and 17 Backend Verification Passed!")
        sys.exit(0)
    else:
        print("\n❌ Phase 16 and 17 Backend Verification Failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()
