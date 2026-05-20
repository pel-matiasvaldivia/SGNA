from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.api.deps import get_tenant_db_from_token, get_current_active_user
from app.models.user import User
from app.models.indicador import IndicadorKPI, IndicadorMedicion
from app.schemas.kpi_direccion import (
    IndicadorKPICreate,
    IndicadorKPIResponse,
    IndicadorKPIUpdate,
    IndicadorMedicionCreate,
    IndicadorMedicionResponse
)

router = APIRouter()

# --- KPIs ENDPOINTS ---

@router.post("", response_model=IndicadorKPIResponse, status_code=status.HTTP_201_CREATED)
def create_kpi(
    data: IndicadorKPICreate,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    # Verify unique code
    exists = db.query(IndicadorKPI).filter(
        IndicadorKPI.codigo == data.codigo,
        IndicadorKPI.tenant_id == current_user.tenant_id
    ).first()
    if exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ya existe un indicador con el código '{data.codigo}'."
        )

    kpi = IndicadorKPI(
        codigo=data.codigo,
        nombre=data.nombre,
        formula=data.formula,
        meta=data.meta,
        unidad=data.unidad,
        frecuencia=data.frecuencia,
        responsable_id=current_user.id,
        tenant_id=current_user.tenant_id
    )
    db.add(kpi)
    db.commit()
    db.refresh(kpi)
    return kpi

@router.get("", response_model=List[IndicadorKPIResponse])
def list_kpis(
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    return db.query(IndicadorKPI).filter(IndicadorKPI.tenant_id == current_user.tenant_id).all()

@router.put("/{id}", response_model=IndicadorKPIResponse)
def update_kpi(
    id: UUID,
    data: IndicadorKPIUpdate,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    kpi = db.query(IndicadorKPI).filter(
        IndicadorKPI.id == id,
        IndicadorKPI.tenant_id == current_user.tenant_id
    ).first()
    if not kpi:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Indicador no encontrado."
        )

    update_data = data.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(kpi, field, val)

    db.commit()
    db.refresh(kpi)
    return kpi

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_kpi(
    id: UUID,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    kpi = db.query(IndicadorKPI).filter(
        IndicadorKPI.id == id,
        IndicadorKPI.tenant_id == current_user.tenant_id
    ).first()
    if not kpi:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Indicador no encontrado."
        )

    db.delete(kpi)
    db.commit()


# --- MEASUREMENTS ENDPOINTS ---

@router.post("/{id}/mediciones", response_model=IndicadorMedicionResponse, status_code=status.HTTP_201_CREATED)
def add_medicion(
    id: UUID,
    data: IndicadorMedicionCreate,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    kpi = db.query(IndicadorKPI).filter(
        IndicadorKPI.id == id,
        IndicadorKPI.tenant_id == current_user.tenant_id
    ).first()
    if not kpi:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Indicador no encontrado."
        )

    # Check if measurement already exists for this period
    exists = db.query(IndicadorMedicion).filter(
        IndicadorMedicion.indicador_id == id,
        IndicadorMedicion.periodo == data.periodo,
        IndicadorMedicion.tenant_id == current_user.tenant_id
    ).first()
    if exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ya se ha registrado una medición para el período '{data.periodo}'."
        )

    medicion = IndicadorMedicion(
        indicador_id=id,
        periodo=data.periodo,
        valor_real=data.valor_real,
        comentarios=data.comentarios,
        registrado_por_id=current_user.id,
        tenant_id=current_user.tenant_id
    )
    db.add(medicion)
    db.commit()
    db.refresh(medicion)
    return medicion

@router.delete("/{id}/mediciones/{medicion_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_medicion(
    id: UUID,
    medicion_id: UUID,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    med = db.query(IndicadorMedicion).filter(
        IndicadorMedicion.id == medicion_id,
        IndicadorMedicion.indicador_id == id,
        IndicadorMedicion.tenant_id == current_user.tenant_id
    ).first()
    if not med:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medición no encontrada."
        )

    db.delete(med)
    db.commit()
