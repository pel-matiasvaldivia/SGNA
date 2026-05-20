import hashlib
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from datetime import datetime

from app.api.deps import get_tenant_db_from_token, get_current_active_user
from app.models.user import User
from app.models.revision import RevisionDireccion
from app.schemas.kpi_direccion import (
    RevisionDireccionCreate,
    RevisionDireccionResponse,
    RevisionDireccionUpdate,
    RevisionDireccionClose
)

router = APIRouter()

@router.post("", response_model=RevisionDireccionResponse, status_code=status.HTTP_201_CREATED)
def create_revision(
    data: RevisionDireccionCreate,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    rev = RevisionDireccion(
        titulo=data.titulo,
        fecha_reunion=data.fecha_reunion,
        asistentes=data.asistentes,
        entradas_revision=data.entradas_revision,
        decisiones_acuerdos=data.decisiones_acuerdos,
        estado="planificada",
        tenant_id=current_user.tenant_id
    )
    db.add(rev)
    db.commit()
    db.refresh(rev)
    return rev

@router.get("", response_model=List[RevisionDireccionResponse])
def list_revisiones(
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    return db.query(RevisionDireccion).filter(
        RevisionDireccion.tenant_id == current_user.tenant_id
    ).all()

@router.put("/{id}", response_model=RevisionDireccionResponse)
def update_revision(
    id: UUID,
    data: RevisionDireccionUpdate,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    rev = db.query(RevisionDireccion).filter(
        RevisionDireccion.id == id,
        RevisionDireccion.tenant_id == current_user.tenant_id
    ).first()
    if not rev:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Acta de revisión no encontrada."
        )

    if rev.estado == "cerrada":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede modificar un acta que ya ha sido cerrada formalmente."
        )

    update_data = data.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(rev, field, val)

    db.commit()
    db.refresh(rev)
    return rev

@router.post("/{id}/close", response_model=RevisionDireccionResponse)
def close_revision(
    id: UUID,
    data: RevisionDireccionClose,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    rev = db.query(RevisionDireccion).filter(
        RevisionDireccion.id == id,
        RevisionDireccion.tenant_id == current_user.tenant_id
    ).first()
    if not rev:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Acta de revisión no encontrada."
        )

    if rev.estado == "cerrada":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El acta ya se encuentra cerrada."
        )

    # Cryptographic signature validation seal
    hash_payload = f"acta-{rev.id}-{data.firma_email}-{datetime.now().isoformat()}"
    signature = hashlib.sha256(hash_payload.encode()).hexdigest()

    rev.estado = "cerrada"
    rev.firma_responsable_hash = f"SHA256-{signature[:32].upper()}"
    db.commit()
    db.refresh(rev)
    return rev

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_revision(
    id: UUID,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    rev = db.query(RevisionDireccion).filter(
        RevisionDireccion.id == id,
        RevisionDireccion.tenant_id == current_user.tenant_id
    ).first()
    if not rev:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Acta de revisión no encontrada."
        )

    if rev.estado == "cerrada":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede eliminar un acta cerrada formalmente."
        )

    db.delete(rev)
    db.commit()
