import sys
import os

# Set the path to the backend directory
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

def verify_m17():
    print("Verifying M17 Modules...")
    try:
        from app.models.tenant import Tenant
        from app.api.v1.onboarding import router as onboarding_router
        from app.api.v1.tenant_settings import router as settings_router
        from app.api.v1.users import router as users_router
        from app.api.v1.admin import router as admin_router
        print("✅ Models and API Routers imported successfully.")
        
        # Verify MinIO logic inside session
        import app.db.session
        print("✅ DB Session logic imported successfully.")

        return True
    except ImportError as e:
        print(f"❌ Failed to import: {e}")
        return False
    except Exception as e:
        print(f"❌ Other error: {e}")
        return False

if __name__ == "__main__":
    if verify_m17():
        sys.exit(0)
    sys.exit(1)
