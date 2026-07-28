from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.api.deps import get_tenant_db_from_token, get_current_active_user
from app.models.user import User
from app.models.auditoria import ProgramaAuditoria, AuditoriaHallazgo, AuditoriaAsignacion
from app.schemas.auditoria import (
    ProgramaAuditoriaCreate,
    ProgramaAuditoriaResponse,
    AuditoriaHallazgoCreate,
    AuditoriaHallazgoResponse,
    AuditoriaAsignacionCreate,
    AuditoriaAsignacionUpdate,
    AuditoriaAsignacionResponse
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


# ----------------- ASIGNACIONES DE AUDITORIA (líder -> campo) -----------------

def _with_programa_titulo(asignaciones, db):
    """Enriquece las asignaciones con el título de su programa para el listado."""
    prog_ids = {a.programa_id for a in asignaciones}
    titulos = {}
    if prog_ids:
        for p in db.query(ProgramaAuditoria.id, ProgramaAuditoria.titulo).filter(
            ProgramaAuditoria.id.in_(prog_ids)
        ).all():
            titulos[p.id] = p.titulo
    for a in asignaciones:
        a.programa_titulo = titulos.get(a.programa_id)
    return asignaciones


@router.post("/asignaciones", response_model=AuditoriaAsignacionResponse, status_code=status.HTTP_201_CREATED)
def create_asignacion(
    data: AuditoriaAsignacionCreate,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    # El programa debe existir y pertenecer al tenant.
    prog = db.query(ProgramaAuditoria).filter(
        ProgramaAuditoria.id == data.programa_id,
        ProgramaAuditoria.tenant_id == current_user.tenant_id
    ).first()
    if not prog:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El programa de auditoría seleccionado no existe."
        )

    # El auditor debe ser un usuario activo del mismo tenant.
    auditor = db.query(User).filter(
        User.id == data.auditor_id,
        User.tenant_id == current_user.tenant_id,
        User.active == True
    ).first()
    if not auditor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El auditor seleccionado no pertenece a esta organización."
        )

    asignacion = AuditoriaAsignacion(
        programa_id=data.programa_id,
        auditor_id=auditor.id,
        auditor_nombre=auditor.full_name or auditor.email,
        auditor_email=auditor.email,
        area=data.area,
        fecha_programada=data.fecha_programada,
        estado="asignada",
        notas=data.notas,
        tenant_id=current_user.tenant_id
    )
    db.add(asignacion)
    db.commit()
    db.refresh(asignacion)
    asignacion.programa_titulo = prog.titulo
    return asignacion


@router.get("/asignaciones", response_model=List[AuditoriaAsignacionResponse])
def list_asignaciones(
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    """Todas las asignaciones del tenant (vista del auditor líder)."""
    asignaciones = db.query(AuditoriaAsignacion).filter(
        AuditoriaAsignacion.tenant_id == current_user.tenant_id
    ).order_by(AuditoriaAsignacion.fecha_programada).all()
    return _with_programa_titulo(asignaciones, db)


@router.get("/asignaciones/mias", response_model=List[AuditoriaAsignacionResponse])
def list_mis_asignaciones(
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    """Asignaciones del auditor autenticado (vista 'Mis auditorías')."""
    asignaciones = db.query(AuditoriaAsignacion).filter(
        AuditoriaAsignacion.tenant_id == current_user.tenant_id,
        AuditoriaAsignacion.auditor_id == current_user.id
    ).order_by(AuditoriaAsignacion.fecha_programada).all()
    return _with_programa_titulo(asignaciones, db)


@router.patch("/asignaciones/{id}", response_model=AuditoriaAsignacionResponse)
def update_asignacion(
    id: UUID,
    data: AuditoriaAsignacionUpdate,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    asignacion = db.query(AuditoriaAsignacion).filter(
        AuditoriaAsignacion.id == id,
        AuditoriaAsignacion.tenant_id == current_user.tenant_id
    ).first()
    if not asignacion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró la asignación de auditoría especificada."
        )

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(asignacion, field, value)

    db.commit()
    db.refresh(asignacion)
    return _with_programa_titulo([asignacion], db)[0]


@router.delete("/asignaciones/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_asignacion(
    id: UUID,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    asignacion = db.query(AuditoriaAsignacion).filter(
        AuditoriaAsignacion.id == id,
        AuditoriaAsignacion.tenant_id == current_user.tenant_id
    ).first()
    if not asignacion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró la asignación de auditoría especificada."
        )

    db.delete(asignacion)
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
