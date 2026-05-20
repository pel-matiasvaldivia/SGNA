from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from uuid import UUID

from app.db.session import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.core.security import get_password_hash, verify_password

router = APIRouter()

class ProfileUpdate(BaseModel):
    full_name: str

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

@router.get("/me")
def get_my_profile(current_user: User = Depends(get_current_active_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "two_fa_enabled": current_user.two_fa_enabled
    }

@router.put("/me")
def update_profile(data: ProfileUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    current_user.full_name = data.full_name
    db.commit()
    db.refresh(current_user)
    return {"full_name": current_user.full_name}

@router.put("/password")
def change_password(data: PasswordChange, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Contraseña actual incorrecta.")
    
    current_user.password_hash = get_password_hash(data.new_password)
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
