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
from app.services import notifications
from app.data.modules_catalog import MODULES, MODULE_KEYS, PROFILES, sanitize_permissions

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

def _current_tenant(db: Session, current_user: User) -> Optional[Tenant]:
    """Tenant del usuario, o None (p. ej. el Superadmin, cuyo tenant_id es NULL)."""
    if not current_user.tenant_id:
        return None
    return db.query(Tenant).filter(Tenant.id == current_user.tenant_id).first()


# Mensaje reutilizable cuando el usuario no pertenece a ninguna empresa.
_NO_TENANT_MSG = (
    "Tu usuario no está asociado a una empresa, por lo que no hay una "
    "configuración SMTP por-empresa para guardar. El correo global del sistema "
    "(2FA y notificaciones) se configura por variables de entorno "
    "(SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS). Para configurar el SMTP de "
    "una empresa puntual, ingresá a esa empresa."
)


@router.get("/smtp")
def get_smtp_settings(db: Session = Depends(get_db), current_user: User = Depends(validate_tenant_admin)):
    tenant = _current_tenant(db, current_user)
    if not tenant:
        # Sin tenant (Superadmin/public): devolvemos vacío para que el formulario
        # cargue sin error, en vez de un 500.
        return {"smtp_host": None, "smtp_port": None, "smtp_user": None,
                "smtp_encryption": None, "scope": "global"}
    return {
        "smtp_host": tenant.smtp_host,
        "smtp_port": tenant.smtp_port,
        "smtp_user": tenant.smtp_user,
        "smtp_encryption": tenant.smtp_encryption,
        "scope": "tenant",
    }

@router.put("/smtp")
def update_smtp_settings(data: SMTPSettingsUpdate, db: Session = Depends(get_db), current_user: User = Depends(validate_tenant_admin)):
    tenant = _current_tenant(db, current_user)
    if not tenant:
        raise HTTPException(status_code=400, detail=_NO_TENANT_MSG)
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(tenant, key, value)
    db.commit()
    return {"message": "Configuración SMTP actualizada exitosamente."}

@router.post("/smtp/test")
def test_smtp_settings(data: SMTPTestRequest, db: Session = Depends(get_db), current_user: User = Depends(validate_tenant_admin)):
    """
    Envía un correo de prueba con los datos del formulario, usando la config
    guardada del tenant como respaldo para los campos vacíos. Funciona aunque el
    usuario no tenga tenant (Superadmin): en ese caso usa solo los datos del
    formulario.
    """
    from app.services.email_service import test_smtp_connection

    tenant = _current_tenant(db, current_user)

    host = data.smtp_host or (tenant.smtp_host if tenant else None)
    port = data.smtp_port or (tenant.smtp_port if tenant else None)
    user = data.smtp_user or (tenant.smtp_user if tenant else None)
    password = data.smtp_password or (tenant.smtp_password if tenant else None)
    encryption = data.smtp_encryption or (tenant.smtp_encryption if tenant else None) or "tls"
    from_email = user or settings.FROM_EMAIL
    to_email = data.to_email or current_user.email

    if not host:
        return {"success": False,
                "message": "Faltan datos: indicá al menos el host SMTP en el formulario.",
                "detail": ""}

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


# ----------------------------- Permisos y Perfiles -----------------------------

class PermissionsUpdate(BaseModel):
    # perfil -> lista de keys de módulos permitidos
    permissions: dict


def _tenant_permissions(tenant: Optional[Tenant]) -> dict:
    saved = None
    if tenant and isinstance(tenant.settings, dict):
        saved = tenant.settings.get("role_permissions")
    return sanitize_permissions(saved)


@router.get("/permissions")
def get_permissions(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """
    Devuelve el catálogo de módulos, los perfiles configurables y el alcance
    efectivo por perfil del tenant. Lo puede leer cualquier usuario activo para
    que su propio menú se filtre; solo el admin puede modificarlo (PUT).
    """
    tenant = _current_tenant(db, current_user)
    return {
        "modules": MODULES,
        "profiles": PROFILES,
        "permissions": _tenant_permissions(tenant),
        "always_full": ["admin", "superadmin"],
    }


@router.put("/permissions")
def update_permissions(data: PermissionsUpdate, db: Session = Depends(get_db),
                       current_user: User = Depends(validate_tenant_admin)):
    """Guarda el alcance por perfil (solo módulos y perfiles conocidos)."""
    tenant = _current_tenant(db, current_user)
    if not tenant:
        raise HTTPException(status_code=400, detail=_NO_TENANT_MSG)

    clean = sanitize_permissions(data.permissions)
    # Reasignamos el dict completo para que SQLAlchemy detecte el cambio en la
    # columna JSON (mutar en el lugar no dispara el UPDATE).
    new_settings = dict(tenant.settings or {})
    new_settings["role_permissions"] = clean
    tenant.settings = new_settings
    db.commit()
    return {"message": "Permisos actualizados exitosamente.", "permissions": clean}


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

    # Aviso de invitación con la contraseña temporal (notificaciones@...).
    tenant = db.query(Tenant).filter(Tenant.id == current_user.tenant_id).first()
    notifications.notify_user_invited(
        email=data.email,
        full_name=data.full_name,
        empresa=tenant.name if tenant else "tu organización",
        temp_password=temp_password,
        role=data.role,
        slug=tenant.slug if tenant else None,
    )

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
