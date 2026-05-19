import sys
import os

# Adjust python path to allow importing app module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

def seed_superadmin():
    db = SessionLocal()
    try:
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
