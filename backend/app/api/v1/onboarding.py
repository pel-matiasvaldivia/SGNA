import re
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List

from app.db.session import get_db, provision_tenant_schema
from app.models.tenant import Tenant
from app.models.user import User
from app.core.security import get_password_hash
from app.services.email_service import send_2fa_email # We'll mock a welcome email using the same service for now or print

router = APIRouter()

class OnboardingRequest(BaseModel):
    empresa_nombre: str
    cuit_rut: str
    sector: str
    normas: List[str]
    admin_email: str
    admin_password: str

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_new_tenant(data: OnboardingRequest, db: Session = Depends(get_db)):
    # 1. Generate slug
    slug_clean = re.sub(r'[^a-z0-9-]', '', data.empresa_nombre.lower().replace(' ', '-'))
    
    # 2. Check if slug exists
    if db.query(Tenant).filter(Tenant.slug == slug_clean).first():
        slug_clean = f"{slug_clean}-1"
        
    # 3. Check if email exists globally
    if db.query(User).filter(User.email == data.admin_email).first():
        raise HTTPException(status_code=400, detail="El correo ya está registrado en el sistema.")

    # 4. Create Tenant
    new_tenant = Tenant(
        name=data.empresa_nombre,
        slug=slug_clean,
        plan="starter",
        active=True,
        settings={"cuit": data.cuit_rut, "sector": data.sector, "normas": data.normas}
    )
    db.add(new_tenant)
    db.commit()
    db.refresh(new_tenant)

    # 5. Provision Schema and MinIO Bucket
    try:
        provision_tenant_schema(slug_clean)
    except Exception as e:
        db.delete(new_tenant)
        db.commit()
        raise HTTPException(status_code=500, detail=f"Fallo aprovisionamiento: {str(e)}")

    # 6. Create Admin User
    new_admin = User(
        tenant_id=new_tenant.id,
        email=data.admin_email,
        password_hash=get_password_hash(data.admin_password),
        full_name=f"Admin de {data.empresa_nombre}",
        role="admin",
        two_fa_enabled=True,
        active=True
    )
    db.add(new_admin)
    db.commit()

    # 7. Send Welcome Email
    print(f"📧 EMAIL ENVIADO a {data.admin_email}: Bienvenido a AuditoríasEnLínea. URL: https://sgna.auditoriasenlinea.com.ar/login?tenant={slug_clean}")

    return {
        "message": "Registro completado exitosamente",
        "tenant_slug": slug_clean,
        "login_url": f"/login?tenant={slug_clean}"
    }
