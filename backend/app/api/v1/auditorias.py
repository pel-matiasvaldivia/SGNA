from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.api.deps import get_tenant_db_from_token, get_current_active_user
from app.models.user import User
from app.models.auditoria import ProgramaAuditoria, AuditoriaHallazgo
from app.schemas.auditoria import (
    ProgramaAuditoriaCreate,
    ProgramaAuditoriaResponse,
    AuditoriaHallazgoCreate,
    AuditoriaHallazgoResponse
)

router = APIRouter()

# ----------------- PROGRAMAS DE AUDITORIA -----------------

@router.post("/programas", response_model=ProgramaAuditoriaResponse, status_code=status.HTTP_201_CREATED)
def create_programa(
    data: ProgramaAuditoriaCreate,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    programa = ProgramaAuditoria(
        titulo=data.titulo,
        objetivos=data.objetivos,
        alcance=data.alcance,
        fecha_inicio=data.fecha_inicio,
        fecha_fin=data.fecha_fin,
        estado=data.estado,
        tenant_id=current_user.tenant_id
    )
    db.add(programa)
    db.commit()
    db.refresh(programa)
    return programa

@router.get("/programas", response_model=List[ProgramaAuditoriaResponse])
def list_programas(
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    return db.query(ProgramaAuditoria).filter(ProgramaAuditoria.tenant_id == current_user.tenant_id).all()

@router.delete("/programas/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_programa(
    id: UUID,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    programa = db.query(ProgramaAuditoria).filter(
        ProgramaAuditoria.id == id,
        ProgramaAuditoria.tenant_id == current_user.tenant_id
    ).first()

    if not programa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró el programa de auditoría especificado."
        )

    db.delete(programa)
    db.commit()


# ----------------- HALLAZGOS DE AUDITORIA -----------------

@router.post("/hallazgos", response_model=AuditoriaHallazgoResponse, status_code=status.HTTP_201_CREATED)
def create_hallazgo(
    data: AuditoriaHallazgoCreate,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    # Verify program exists and belongs to this tenant
    prog = db.query(ProgramaAuditoria).filter(
        ProgramaAuditoria.id == data.programa_id,
        ProgramaAuditoria.tenant_id == current_user.tenant_id
    ).first()

    if not prog:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El programa de auditoría seleccionado no existe."
        )

    hallazgo = AuditoriaHallazgo(
        descripcion=data.descripcion,
        clasificacion=data.clasificacion,
        clausula_referencia=data.clausula_referencia,
        estado=data.estado,
        programa_id=data.programa_id,
        tenant_id=current_user.tenant_id
    )
    db.add(hallazgo)
    db.commit()
    db.refresh(hallazgo)
    return hallazgo

@router.get("/hallazgos", response_model=List[AuditoriaHallazgoResponse])
def list_hallazgos(
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    return db.query(AuditoriaHallazgo).filter(AuditoriaHallazgo.tenant_id == current_user.tenant_id).all()

@router.delete("/hallazgos/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_hallazgo(
    id: UUID,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    hallazgo = db.query(AuditoriaHallazgo).filter(
        AuditoriaHallazgo.id == id,
        AuditoriaHallazgo.tenant_id == current_user.tenant_id
    ).first()

    if not hallazgo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró el hallazgo de auditoría especificado."
        )

    db.delete(hallazgo)
    db.commit()
