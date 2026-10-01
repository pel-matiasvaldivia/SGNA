from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from uuid import UUID

from app.db.session import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.core.security import get_password_hash, verify_password
from app.core.membership import users_of_tenant, role_in_tenant

router = APIRouter()

class ProfileUpdate(BaseModel):
    full_name: str

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

@router.get("/")
def list_tenant_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """
    Lista los usuarios activos de la organización del usuario autenticado.
    Se usa, por ejemplo, para elegir a qué auditor asignar una auditoría.
    """
    users = users_of_tenant(db, current_user.tenant_id).order_by(User.full_name).all()
    return [
        {
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name or u.email,
            # El rol es el que tiene en ESTA organización, no el de su cuenta.
            "role": role_in_tenant(db, u, current_user.tenant_id) or u.role,
        }
        for u in users
    ]

@router.get("/me")
def get_my_profile(current_user: User = Depends(get_current_active_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "two_fa_enabled": current_user.two_fa_enabled
    }

def _fila_editable(db: Session, current_user: User) -> User:
    """
    Vuelve a cargar al usuario dentro de esta sesión.

    `get_current_active_user` devuelve una instancia desprendida (le sobrescribe
    el tenant activo en memoria), así que escribirle encima no persistiría nada.
    Para modificar el perfil hay que trabajar sobre la fila gestionada.
    """
    fila = db.query(User).filter(User.id == current_user.id).first()
    if not fila:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")
    return fila


@router.put("/me")
def update_profile(data: ProfileUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    fila = _fila_editable(db, current_user)
    fila.full_name = data.full_name
    db.commit()
    db.refresh(fila)
    return {"full_name": fila.full_name}

@router.put("/password")
def change_password(data: PasswordChange, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    fila = _fila_editable(db, current_user)
    if not verify_password(data.current_password, fila.password_hash):
        raise HTTPException(status_code=400, detail="Contraseña actual incorrecta.")

    fila.password_hash = get_password_hash(data.new_password)
    db.commit()
    return {"message": "Contraseña actualizada exitosamente."}

@router.get("/sessions")
def get_active_sessions(current_user: User = Depends(get_current_active_user)):
    # Mock for Redis sessions
    return [
        {"id": "session_1", "device": "Windows 11 / Chrome", "ip": "192.168.1.44", "current": True},
        {"id": "session_2", "device": "iPhone 14 / Safari", "ip": "181.44.55.22", "current": False}
    ]

@router.delete("/sessions/{session_id}")
def revoke_session(session_id: str, current_user: User = Depends(get_current_active_user)):
    # Mock logic to delete session from Redis
    return {"message": f"Sesión {session_id} revocada"}
