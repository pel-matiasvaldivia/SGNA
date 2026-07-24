from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID

from app.db.session import get_db
from app.api.deps import get_current_active_user
from app.models.tenant import Tenant
from app.models.user import User
from app.core.security import get_password_hash
from app.core.config import settings

router = APIRouter()

class SMTPSettingsUpdate(BaseModel):
    smtp_host: Optional[str] = None
    smtp_port: Optional[str] = None
    smtp_user: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_encryption: Optional[str] = None


class SMTPTestRequest(BaseModel):
    # All optional: any field left empty falls back to the saved tenant config
    # (useful because the GET endpoint never returns the stored password).
    smtp_host: Optional[str] = None
    smtp_port: Optional[str] = None
    smtp_user: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_encryption: Optional[str] = None
    to_email: Optional[str] = None

class GeneralSettingsUpdate(BaseModel):
    name: Optional[str] = None
    two_factor_enabled: Optional[bool] = None

class UserInvite(BaseModel):
    email: str
    full_name: str
    role: str

class UserResponse(BaseModel):
    id: UUID
    email: str
    full_name: str
    role: str
    active: bool

    class Config:
        from_attributes = True

def validate_tenant_admin(current_user: User = Depends(get_current_active_user)):
    if current_user.role not in ["admin", "superadmin"]:
        raise HTTPException(status_code=403, detail="Permisos insuficientes. Se requiere rol de Admin.")
    return current_user

@router.get("/smtp")
def get_smtp_settings(db: Session = Depends(get_db), current_user: User = Depends(validate_tenant_admin)):
    tenant = db.query(Tenant).filter(Tenant.id == current_user.tenant_id).first()
    return {
        "smtp_host": tenant.smtp_host,
        "smtp_port": tenant.smtp_port,
        "smtp_user": tenant.smtp_user,
        "smtp_encryption": tenant.smtp_encryption
    }

@router.put("/smtp")
def update_smtp_settings(data: SMTPSettingsUpdate, db: Session = Depends(get_db), current_user: User = Depends(validate_tenant_admin)):
    tenant = db.query(Tenant).filter(Tenant.id == current_user.tenant_id).first()
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(tenant, key, value)
    db.commit()
    return {"message": "Configuración SMTP actualizada exitosamente."}

@router.post("/smtp/test")
def test_smtp_settings(data: SMTPTestRequest, db: Session = Depends(get_db), current_user: User = Depends(validate_tenant_admin)):
    """
    Sends a test email using the provided SMTP settings (falling back to the saved
    tenant config for any empty field) and returns a structured diagnostic result.
    """
    from app.services.email_service import test_smtp_connection

    tenant = db.query(Tenant).filter(Tenant.id == current_user.tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant no encontrado.")

    host = data.smtp_host or tenant.smtp_host
    port = data.smtp_port or tenant.smtp_port
    user = data.smtp_user or tenant.smtp_user
    password = data.smtp_password or tenant.smtp_password
    encryption = data.smtp_encryption or tenant.smtp_encryption or "tls"
    from_email = user or settings.FROM_EMAIL
    to_email = data.to_email or current_user.email

    result = test_smtp_connection(
        host=host,
        port=port,
        user=user,
        password=password,
        encryption=encryption,
        from_email=from_email,
        to_email=to_email,
    )
    return result


@router.get("/users", response_model=List[UserResponse])
def get_tenant_users(db: Session = Depends(get_db), current_user: User = Depends(validate_tenant_admin)):
    return db.query(User).filter(User.tenant_id == current_user.tenant_id).all()

import random
import string

@router.post("/users/invite", response_model=UserResponse)
def invite_user(data: UserInvite, db: Session = Depends(get_db), current_user: User = Depends(validate_tenant_admin)):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="El correo ya pertenece a un usuario en el sistema.")
    
    temp_password = ''.join(random.choices(string.ascii_letters + string.digits, k=10))
    new_user = User(
        tenant_id=current_user.tenant_id,
        email=data.email,
        full_name=data.full_name,
        role=data.role,
        password_hash=get_password_hash(temp_password),
        active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # In a real scenario, use SMTP settings of the tenant to send the email
    print(f"📧 INVITACIÓN ENVIADA a {data.email} - Password temporal: {temp_password}")
    
    return new_user

@router.put("/users/{user_id}/toggle")
def toggle_user_active(user_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(validate_tenant_admin)):
    target_user = db.query(User).filter(User.id == user_id, User.tenant_id == current_user.tenant_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")
    if target_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="No puedes desactivar tu propia cuenta activa.")
    
    target_user.active = not target_user.active
    db.commit()
    return {"active": target_user.active}
