from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.api.deps import get_tenant_db_from_token, get_current_active_user
from app.models.user import User
from app.models.gap_analysis import Diagnostico, DiagnosticoItem
from app.schemas.gap_analysis import (
    DiagnosticoCreate,
    DiagnosticoResponse,
    DiagnosticoDetailResponse,
    DiagnosticoItemUpdate,
    DiagnosticoItemResponse,
    GapAnalysisSummary
)
from app.services.iso_checklists import ISO_CHECKLISTS

router = APIRouter()

@router.post("/", response_model=DiagnosticoDetailResponse, status_code=status.HTTP_201_CREATED)
def create_diagnostico(
    data: DiagnosticoCreate,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    # 1. Create main Diagnostico record
    diagnostico = Diagnostico(
        nombre=data.nombre,
        normas_incluidas=data.normas_incluidas,
        estado="en_progreso",
        auditor_responsable_id=current_user.id,
        tenant_id=current_user.tenant_id
    )
    db.add(diagnostico)
    db.commit()
    db.refresh(diagnostico)

    # 2. Seed appropriate clauses/questions automatically
    items_to_add = []
    for norma in data.normas_incluidas:
        checklist = ISO_CHECKLISTS.get(norma, [])
        for check in checklist:
            item = DiagnosticoItem(
                diagnostico_id=diagnostico.id,
                norma=norma,
                clausula=check["clausula"],
                clausula_descripcion=check["clausula_descripcion"],
                pregunta=check["pregunta"],
                estado=None,
                prioridad="media"
            )
            items_to_add.append(item)
    
    if items_to_add:
        db.add_all(items_to_add)
        db.commit()
        db.refresh(diagnostico)

    return diagnostico


@router.get("/", response_model=List[DiagnosticoResponse])
def list_diagnosticos(
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    return db.query(Diagnostico).filter(Diagnostico.tenant_id == current_user.tenant_id).all()


@router.get("/{id}", response_model=DiagnosticoDetailResponse)
def get_diagnostico(
    id: UUID,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    diagnostico = db.query(Diagnostico).filter(
        Diagnostico.id == id,
        Diagnostico.tenant_id == current_user.tenant_id
    ).first()

    if not diagnostico:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró el diagnóstico de brechas especificado."
        )

    # Fetch items and attach to returned schema
    items = db.query(DiagnosticoItem).filter(DiagnosticoItem.diagnostico_id == id).all()
    diagnostico.items = items
    return diagnostico


@router.put("/{id}/items/{item_id}", response_model=DiagnosticoItemResponse)
def update_diagnostico_item(
    id: UUID,
    item_id: UUID,
    data: DiagnosticoItemUpdate,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    # Verify diagnosis belongs to tenant
    diagnostico = db.query(Diagnostico).filter(
        Diagnostico.id == id,
        Diagnostico.tenant_id == current_user.tenant_id
    ).first()

    if not diagnostico:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Diagnóstico no encontrado."
        )

    item = db.query(DiagnosticoItem).filter(
        DiagnosticoItem.id == item_id,
        DiagnosticoItem.diagnostico_id == id
    ).first()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró la pregunta del diagnóstico."
        )

    # Apply changes
    if data.estado is not None:
        item.estado = data.estado
    if data.observacion is not None:
        item.observacion = data.observacion
    if data.evidencia_documento_id is not None:
        item.evidencia_documento_id = data.evidencia_documento_id
    if data.responsable_id is not None:
        item.responsable_id = data.responsable_id
    if data.prioridad is not None:
        item.prioridad = data.prioridad

    db.commit()
    db.refresh(item)
    return item


@router.get("/{id}/resumen", response_model=GapAnalysisSummary)
def get_diagnostico_summary(
    id: UUID,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    diagnostico = db.query(Diagnostico).filter(
        Diagnostico.id == id,
        Diagnostico.tenant_id == current_user.tenant_id
    ).first()

    if not diagnostico:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Diagnóstico no encontrado."
        )

    items = db.query(DiagnosticoItem).filter(DiagnosticoItem.diagnostico_id == id).all()
    
    total_items = len(items)
    cumple = sum(1 for i in items if i.estado == "cumple")
    cumple_parcialmente = sum(1 for i in items if i.estado == "cumple_parcialmente")
    no_cumple = sum(1 for i in items if i.estado == "no_cumple")
    no_aplica = sum(1 for i in items if i.estado == "no_aplica")
    
    evaluados = cumple + cumple_parcialmente + no_cumple
    
    # Calculate percentage based on evaluated compliance (cumple = 100%, cumple_parcialmente = 50%)
    if evaluados > 0:
        cumple_score = cumple + (cumple_parcialmente * 0.5)
        porcentaje_cumplimiento = (cumple_score / evaluados) * 100
    else:
        porcentaje_cumplimiento = 0.0

    # Calculate classification
    if porcentaje_cumplimiento < 50:
        clasificacion = "Crítico"
        color = "rojo"
    elif porcentaje_cumplimiento < 80:
        clasificacion = "En desarrollo"
        color = "amarillo"
    else:
        clasificacion = "Conforme"
        color = "verde"

    return GapAnalysisSummary(
        total_items=total_items,
        cumple=cumple,
        cumple_parcialmente=cumple_parcialmente,
        no_cumple=no_cumple,
        no_aplica=no_aplica,
        evaluados=evaluados,
        porcentaje_cumplimiento=round(porcentaje_cumplimiento, 2),
        clasificacion=clasificacion,
        color=color
    )
