import sys
import os

# Go up three directories from file path to include the root directory containing 'app' package
db_dir = os.path.dirname(os.path.abspath(__file__))
app_dir = os.path.dirname(db_dir)
root_dir = os.path.dirname(app_dir)
sys.path.insert(0, root_dir)

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

from sqlalchemy import text

def seed_superadmin():
    db = SessionLocal()
    try:
        # Ensure column exists in public.tenants
        db.execute(text("ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT TRUE NOT NULL;"))
        db.commit()
        email = "gerencia@auditoriasenlinea.com.ar"
        password = "G2r2nc31_2025"
        
        # Check if user exists
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            print(f"User {email} already exists. Updating credentials.")
            existing_user.password_hash = get_password_hash(password)
            existing_user.role = "superadmin"
            existing_user.active = True
            db.commit()
            print("Superadmin successfully updated!")
            return

        # Create new superadmin
        superadmin = User(
            email=email,
            password_hash=get_password_hash(password),
            full_name="Gerencia Superadmin",
            role="superadmin",
            two_fa_enabled=True,
            active=True
        )
        db.add(superadmin)
        db.commit()
        print(f"Superadmin {email} successfully seeded!")
    except Exception as e:
        print(f"Error seeding superadmin: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_superadmin()
