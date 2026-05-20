from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.api.deps import get_tenant_db_from_token, get_current_active_user
from app.models.user import User
from app.models.planificacion import ObjetivoSGI, RiesgoOportunidad
from app.schemas.planificacion import (
    ObjetivoSGICreate,
    ObjetivoSGIResponse,
    RiesgoOportunidadCreate,
    RiesgoOportunidadResponse,
    RiesgoOportunidadUpdate
)

router = APIRouter()

# ----------------- OBJETIVOS SGI -----------------

@router.post("/objetivos", response_model=ObjetivoSGIResponse, status_code=status.HTTP_201_CREATED)
def create_objetivo(
    data: ObjetivoSGICreate,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    obj = ObjetivoSGI(
        nombre=data.nombre,
        descripcion=data.descripcion,
        meta=data.meta,
        unidad=data.unidad,
        indicador=data.indicador,
        frecuencia=data.frecuencia,
        fecha_limite=data.fecha_limite,
        progreso=data.progreso,
        responsable_id=current_user.id,
        tenant_id=current_user.tenant_id
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@router.get("/objetivos", response_model=List[ObjetivoSGIResponse])
def list_objetivos(
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    return db.query(ObjetivoSGI).filter(ObjetivoSGI.tenant_id == current_user.tenant_id).all()

@router.delete("/objetivos/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_objetivo(
    id: UUID,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    obj = db.query(ObjetivoSGI).filter(
        ObjetivoSGI.id == id,
        ObjetivoSGI.tenant_id == current_user.tenant_id
    ).first()

    if not obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró el objetivo de calidad especificado."
        )

    db.delete(obj)
    db.commit()


# ----------------- RIESGOS Y OPORTUNIDADES -----------------

@router.post("/riesgos", response_model=RiesgoOportunidadResponse, status_code=status.HTTP_201_CREATED)
def create_riesgo_oportunidad(
    data: RiesgoOportunidadCreate,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    prob_res = data.probabilidad_residual if data.probabilidad_residual is not None else data.probabilidad
    imp_res = data.impacto_residual if data.impacto_residual is not None else data.impacto

    item = RiesgoOportunidad(
        descripcion=data.descripcion,
        tipo=data.tipo,
        origen=data.origen,
        probabilidad=data.probabilidad,
        impacto=data.impacto,
        probabilidad_residual=prob_res,
        impacto_residual=imp_res,
        acciones=data.acciones,
        estado=data.estado,
        proceso_id=data.proceso_id,
        evidencia_documento_id=data.evidencia_documento_id,
        responsable_id=current_user.id,
        tenant_id=current_user.tenant_id
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.get("/riesgos", response_model=List[RiesgoOportunidadResponse])
def list_riesgos_oportunidades(
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    return db.query(RiesgoOportunidad).filter(RiesgoOportunidad.tenant_id == current_user.tenant_id).all()

@router.put("/riesgos/{id}", response_model=RiesgoOportunidadResponse)
def update_riesgo_oportunidad(
    id: UUID,
    data: RiesgoOportunidadUpdate,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    item = db.query(RiesgoOportunidad).filter(
        RiesgoOportunidad.id == id,
        RiesgoOportunidad.tenant_id == current_user.tenant_id
    ).first()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró el riesgo u oportunidad."
        )

    # Update fields if provided
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)

    db.commit()
    db.refresh(item)
    return item

@router.delete("/riesgos/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_riesgo_oportunidad(
    id: UUID,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    item = db.query(RiesgoOportunidad).filter(
        RiesgoOportunidad.id == id,
        RiesgoOportunidad.tenant_id == current_user.tenant_id
    ).first()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró el riesgo u oportunidad."
        )

    db.delete(item)
    db.commit()

