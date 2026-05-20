import uuid
from datetime import datetime, date
from typing import List, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.api.deps import get_tenant_db_from_token, get_current_active_user
from app.models.user import User
from app.models.huella import EmisionCarbono
from app.models.document import Document
from app.schemas.huella import (
    EmisionCarbonoResponse,
    EmisionCarbonoCreate,
    EmisionCarbonoUpdate,
    HuellaResumenResponse
)

router = APIRouter()

def _calcular_co2e(cantidad: float, factor: float, unidad: str) -> float:
    """
    Calcula el CO2 equivalente en toneladas (tCO2e).
    Si la unidad es tCO2e o toneladas, se asume que el factor ya da toneladas directas.
    De lo contrario, se divide por 1000.0 asumiendo que el factor está en kg CO2e / unidad.
    """
    unidad_lower = unidad.lower()
    if any(u in unidad_lower for u in ["tco2e", "tonelada", "toneladas", "t"]):
        return cantidad * factor
    return (cantidad * factor) / 1000.0

@router.post("/emisiones", response_model=EmisionCarbonoResponse, status_code=status.HTTP_201_CREATED)
def create_emision(
    data: EmisionCarbonoCreate,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    # Verify document evidence exists if provided
    if data.evidencia_documento_id:
        doc = db.query(Document).filter(
            Document.id == data.evidencia_documento_id,
            Document.tenant_id == current_user.tenant_id
        ).first()
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="El documento de evidencia especificado no existe en este tenant."
            )

    co2_eq = _calcular_co2e(data.cantidad, data.factor_emision, data.unidad)

    emision = EmisionCarbono(
        periodo=data.periodo,
        alcance=data.alcance,
        categoria=data.categoria,
        subcategoria=data.subcategoria,
        fuente=data.fuente,
        cantidad=data.cantidad,
        unidad=data.unidad,
        factor_emision=data.factor_emision,
        co2_equivalente=co2_eq,
        evidencia_documento_id=data.evidencia_documento_id,
        notas=data.notas,
        created_by_id=current_user.id,
        tenant_id=current_user.tenant_id
    )
    db.add(emision)
    db.commit()
    db.refresh(emision)
    return emision

@router.get("/emisiones", response_model=List[EmisionCarbonoResponse])
def list_emisiones(
    alcance: Optional[int] = None,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(EmisionCarbono).filter(EmisionCarbono.tenant_id == current_user.tenant_id)
    if alcance is not None:
        query = query.filter(EmisionCarbono.alcance == alcance)
    return query.order_by(EmisionCarbono.periodo.desc()).all()

@router.put("/emisiones/{id}", response_model=EmisionCarbonoResponse)
def update_emision(
    id: uuid.UUID,
    data: EmisionCarbonoUpdate,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    emision = db.query(EmisionCarbono).filter(
        EmisionCarbono.id == id,
        EmisionCarbono.tenant_id == current_user.tenant_id
    ).first()

    if not emision:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró el registro de emisión especificado."
        )

    if data.evidencia_documento_id:
        doc = db.query(Document).filter(
            Document.id == data.evidencia_documento_id,
            Document.tenant_id == current_user.tenant_id
        ).first()
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="El documento de evidencia especificado no existe en este tenant."
            )

    # Update fields if provided
    if data.periodo is not None:
        emision.periodo = data.periodo
    if data.alcance is not None:
        emision.alcance = data.alcance
    if data.categoria is not None:
        emision.categoria = data.categoria
    if data.subcategoria is not None:
        emision.subcategoria = data.subcategoria
    if data.fuente is not None:
        emision.fuente = data.fuente
    if data.cantidad is not None:
        emision.cantidad = data.cantidad
    if data.unidad is not None:
        emision.unidad = data.unidad
    if data.factor_emision is not None:
        emision.factor_emision = data.factor_emision
    if data.notas is not None:
        emision.notas = data.notas
    if data.evidencia_documento_id is not None:
        emision.evidencia_documento_id = data.evidencia_documento_id

    # Recalculate CO2e
    emision.co2_equivalente = _calcular_co2e(
        float(emision.cantidad),
        float(emision.factor_emision),
        emision.unidad
    )

    db.commit()
    db.refresh(emision)
    return emision

@router.delete("/emisiones/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_emision(
    id: uuid.UUID,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    emision = db.query(EmisionCarbono).filter(
        EmisionCarbono.id == id,
        EmisionCarbono.tenant_id == current_user.tenant_id
    ).first()

    if not emision:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró el registro de emisión especificado."
        )

    db.delete(emision)
    db.commit()
    return

@router.get("/resumen", response_model=HuellaResumenResponse)
def get_huella_resumen(
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    emisiones = db.query(EmisionCarbono).filter(EmisionCarbono.tenant_id == current_user.tenant_id).all()

    total_co2e = 0.0
    desglose = {"Alcance 1": 0.0, "Alcance 2": 0.0, "Alcance 3": 0.0}
    porcentajes = {"Alcance 1": 0.0, "Alcance 2": 0.0, "Alcance 3": 0.0}
    categorias = {}
    mensual = {}

    for em in emisiones:
        co2 = float(em.co2_equivalente)
        total_co2e += co2
        
        # Desglose alcances
        alc_key = f"Alcance {em.alcance}"
        if alc_key in desglose:
            desglose[alc_key] += co2
            
        # Categorías
        categorias[em.categoria] = categorias.get(em.categoria, 0.0) + co2
        
        # Historial mensual
        periodo_str = em.periodo.strftime("%Y-%m")
        mensual[periodo_str] = mensual.get(periodo_str, 0.0) + co2

    # Porcentajes
    if total_co2e > 0.0:
        for k in porcentajes:
            porcentajes[k] = round((desglose[k] / total_co2e) * 100.0, 2)

    # Formatear el historial mensual en una lista ordenada cronológicamente
    historico_mensual = []
    for p in sorted(mensual.keys()):
        historico_mensual.append({
            "periodo": p,
            "co2e": round(mensual[p], 4)
        })

    # Redondeos para limpieza visual
    total_co2e = round(total_co2e, 4)
    for k in desglose:
        desglose[k] = round(desglose[k], 4)
    for cat in categorias:
        categorias[cat] = round(categorias[cat], 4)

    return HuellaResumenResponse(
        total_co2e=total_co2e,
        desglose_alcances=desglose,
        porcentajes_alcances=porcentajes,
        emisiones_por_categoria=categorias,
        historico_mensual=historico_mensual
    )
