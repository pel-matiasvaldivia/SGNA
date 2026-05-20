import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_tenant_db_from_token, get_current_active_user
from app.models.user import User
from app.models.capacitacion import PlanCapacitacion, AsistenteCapacitacion, CompetenciaColaborador
from app.schemas.capacitacion import (
    PlanCapacitacionCreate,
    PlanCapacitacionUpdate,
    PlanCapacitacionResponse,
    AsistenteCapacitacionCreate,
    AsistenteCapacitacionEvaluate,
    AsistenteCapacitacionResponse,
    CompetenciaColaboradorCreate,
    CompetenciaColaboradorUpdate,
    CompetenciaColaboradorResponse
)

router = APIRouter()

# --- PLANES DE CAPACITACIÓN ---

@router.post("/planes", response_model=PlanCapacitacionResponse, status_code=status.HTTP_201_CREATED)
def create_plan(
    data: PlanCapacitacionCreate,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    plan = PlanCapacitacion(
        codigo=data.codigo,
        tema=data.tema,
        descripcion=data.descripcion,
        fecha_planificada=data.fecha_planificada,
        duracion_horas=data.duracion_horas,
        facilitador=data.facilitador,
        estado="planificado",
        tenant_id=current_user.tenant_id
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@router.get("/planes", response_model=List[PlanCapacitacionResponse])
def list_planes(
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    return db.query(PlanCapacitacion).filter(
        PlanCapacitacion.tenant_id == current_user.tenant_id
    ).order_by(PlanCapacitacion.fecha_planificada.desc()).all()


@router.get("/planes/{id}", response_model=PlanCapacitacionResponse)
def get_plan(
    id: uuid.UUID,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    plan = db.query(PlanCapacitacion).filter(
        PlanCapacitacion.id == id,
        PlanCapacitacion.tenant_id == current_user.tenant_id
    ).first()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró el plan de capacitación."
        )
    return plan


@router.put("/planes/{id}", response_model=PlanCapacitacionResponse)
def update_plan(
    id: uuid.UUID,
    data: PlanCapacitacionUpdate,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    plan = db.query(PlanCapacitacion).filter(
        PlanCapacitacion.id == id,
        PlanCapacitacion.tenant_id == current_user.tenant_id
    ).first()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró el plan de capacitación."
        )

    for field, value in data.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(plan, field, value)

    db.commit()
    db.refresh(plan)
    return plan


@router.delete("/planes/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_plan(
    id: uuid.UUID,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    plan = db.query(PlanCapacitacion).filter(
        PlanCapacitacion.id == id,
        PlanCapacitacion.tenant_id == current_user.tenant_id
    ).first()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró el plan de capacitación."
        )
    db.delete(plan)
    db.commit()
    return None


# --- ASISTENCIA Y EVALUACIONES ---

@router.post("/planes/{id}/asistentes", response_model=AsistenteCapacitacionResponse, status_code=status.HTTP_201_CREATED)
def add_asistente(
    id: uuid.UUID,
    data: AsistenteCapacitacionCreate,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    plan = db.query(PlanCapacitacion).filter(
        PlanCapacitacion.id == id,
        PlanCapacitacion.tenant_id == current_user.tenant_id
    ).first()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró el plan de capacitación."
        )

    # Check if already registered
    existing = db.query(AsistenteCapacitacion).filter(
        AsistenteCapacitacion.capacitacion_id == id,
        AsistenteCapacitacion.colaborador_id == data.colaborador_id,
        AsistenteCapacitacion.tenant_id == current_user.tenant_id
    ).first()
    if existing:
        return existing

    asistente = AsistenteCapacitacion(
        capacitacion_id=id,
        colaborador_id=data.colaborador_id,
        asistio=False,
        evaluacion_puntaje=None,
        tenant_id=current_user.tenant_id
    )
    db.add(asistente)
    db.commit()
    db.refresh(asistente)
    return asistente


@router.put("/planes/{id}/asistentes/{colaborador_id}/evaluar", response_model=AsistenteCapacitacionResponse)
def evaluate_asistente(
    id: uuid.UUID,
    colaborador_id: uuid.UUID,
    data: AsistenteCapacitacionEvaluate,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    asistente = db.query(AsistenteCapacitacion).filter(
        AsistenteCapacitacion.capacitacion_id == id,
        AsistenteCapacitacion.colaborador_id == colaborador_id,
        AsistenteCapacitacion.tenant_id == current_user.tenant_id
    ).first()
    if not asistente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró el asistente de capacitación."
        )

    asistente.asistio = data.asistio
    asistente.evaluacion_puntaje = data.evaluacion_puntaje
    asistente.comentarios = data.comentarios
    asistente.certificado_documento_id = data.certificado_documento_id

    db.commit()
    db.refresh(asistente)
    return asistente


# --- COMPETENCIAS Y HABILIDADES ---

@router.post("/competencias", response_model=CompetenciaColaboradorResponse, status_code=status.HTTP_201_CREATED)
def create_competencia(
    data: CompetenciaColaboradorCreate,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    # Check if this competence for this collaborator already exists
    existing = db.query(CompetenciaColaborador).filter(
        CompetenciaColaborador.colaborador_id == data.colaborador_id,
        CompetenciaColaborador.competencia_nombre == data.competencia_nombre,
        CompetenciaColaborador.tenant_id == current_user.tenant_id
    ).first()
    if existing:
        existing.nivel_requerido = data.nivel_requerido
        existing.nivel_actual = data.nivel_actual
        existing.comentarios = data.comentarios
        db.commit()
        db.refresh(existing)
        return existing

    competencia = CompetenciaColaborador(
        colaborador_id=data.colaborador_id,
        competencia_nombre=data.competencia_nombre,
        nivel_requerido=data.nivel_requerido,
        nivel_actual=data.nivel_actual,
        comentarios=data.comentarios,
        tenant_id=current_user.tenant_id
    )
    db.add(competencia)
    db.commit()
    db.refresh(competencia)
    return competencia


@router.get("/competencias", response_model=List[CompetenciaColaboradorResponse])
def list_competencias(
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    return db.query(CompetenciaColaborador).filter(
        CompetenciaColaborador.tenant_id == current_user.tenant_id
    ).all()


@router.put("/competencias/{id}", response_model=CompetenciaColaboradorResponse)
def update_competencia(
    id: uuid.UUID,
    data: CompetenciaColaboradorUpdate,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    competencia = db.query(CompetenciaColaborador).filter(
        CompetenciaColaborador.id == id,
        CompetenciaColaborador.tenant_id == current_user.tenant_id
    ).first()
    if not competencia:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró el registro de competencia."
        )

    for field, value in data.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(competencia, field, value)

    db.commit()
    db.refresh(competencia)
    return competencia


@router.delete("/competencias/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_competencia(
    id: uuid.UUID,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    competencia = db.query(CompetenciaColaborador).filter(
        CompetenciaColaborador.id == id,
        CompetenciaColaborador.tenant_id == current_user.tenant_id
    ).first()
    if not competencia:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró el registro de competencia."
        )
    db.delete(competencia)
    db.commit()
    return None
