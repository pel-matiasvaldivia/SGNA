from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone

from app.api.deps import get_tenant_db_from_token, get_current_active_user
from app.models.user import User
from app.models.contexto import FodaPestelItem, ParteInteresada, AlcanceSGI, RequisitoLegal
from app.schemas.contexto import (
    FodaPestelItemCreate,
    FodaPestelItemResponse,
    ParteInteresadaCreate,
    ParteInteresadaResponse,
    AlcanceSGICreate,
    AlcanceSGIResponse,
    RequisitoLegalCreate,
    RequisitoLegalResponse
)

router = APIRouter()

# ----------------- FODA / PESTEL -----------------

@router.post("/foda-pestel", response_model=FodaPestelItemResponse, status_code=status.HTTP_201_CREATED)
def create_foda_pestel_item(
    data: FodaPestelItemCreate,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    item = FodaPestelItem(
        tipo=data.tipo,
        descripcion=data.descripcion,
        tenant_id=current_user.tenant_id
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.get("/foda-pestel", response_model=List[FodaPestelItemResponse])
def list_foda_pestel_items(
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    return db.query(FodaPestelItem).filter(FodaPestelItem.tenant_id == current_user.tenant_id).all()

@router.delete("/foda-pestel/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_foda_pestel_item(
    id: UUID,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    item = db.query(FodaPestelItem).filter(
        FodaPestelItem.id == id,
        FodaPestelItem.tenant_id == current_user.tenant_id
    ).first()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró el elemento FODA/PESTEL."
        )

    db.delete(item)
    db.commit()


# ----------------- PARTES INTERESADAS -----------------

@router.post("/partes-interesadas", response_model=ParteInteresadaResponse, status_code=status.HTTP_201_CREATED)
def create_parte_interesada(
    data: ParteInteresadaCreate,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    parte = ParteInteresada(
        nombre=data.nombre,
        tipo=data.tipo,
        necesidades=data.necesidades,
        expectativas=data.expectativas,
        pertinente=data.pertinente,
        influencia=data.influencia,
        interes=data.interes,
        requisitos_legales=data.requisitos_legales,
        tenant_id=current_user.tenant_id
    )
    db.add(parte)
    db.commit()
    db.refresh(parte)
    return parte

@router.get("/partes-interesadas", response_model=List[ParteInteresadaResponse])
def list_partes_interesadas(
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    return db.query(ParteInteresada).filter(ParteInteresada.tenant_id == current_user.tenant_id).all()

@router.delete("/partes-interesadas/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_parte_interesada(
    id: UUID,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    parte = db.query(ParteInteresada).filter(
        ParteInteresada.id == id,
        ParteInteresada.tenant_id == current_user.tenant_id
    ).first()

    if not parte:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró la parte interesada."
        )

    db.delete(parte)
    db.commit()


# ----------------- ALCANCE SGI -----------------

@router.post("/alcance", response_model=AlcanceSGIResponse, status_code=status.HTTP_201_CREATED)
def create_or_update_alcance(
    data: AlcanceSGICreate,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    # Set existing active alcances to obsoleto if approving a new one
    if data.estado == "aprobado":
        db.query(AlcanceSGI).filter(
            AlcanceSGI.tenant_id == current_user.tenant_id,
            AlcanceSGI.estado == "aprobado"
        ).update({"estado": "obsoleto"})

    alcance = AlcanceSGI(
        declaracion=data.declaracion,
        exclusiones_justificacion=data.exclusiones_justificacion,
        version=data.version,
        estado=data.estado,
        aprobado_por_id=current_user.id if data.estado == "aprobado" else None,
        fecha_aprobacion=datetime.now(timezone.utc) if data.estado == "aprobado" else None,
        tenant_id=current_user.tenant_id
    )
    db.add(alcance)
    db.commit()
    db.refresh(alcance)
    return alcance

@router.get("/alcance", response_model=Optional[AlcanceSGIResponse])
def get_latest_alcance(
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    # Try finding approved scope first, then fallback to most recent draft
    scope = db.query(AlcanceSGI).filter(
        AlcanceSGI.tenant_id == current_user.tenant_id,
        AlcanceSGI.estado == "aprobado"
    ).order_by(AlcanceSGI.fecha_aprobacion.desc()).first()

    if not scope:
        scope = db.query(AlcanceSGI).filter(
            AlcanceSGI.tenant_id == current_user.tenant_id
        ).order_by(AlcanceSGI.version.desc()).first()

    # An empty scope is a valid state for a new tenant: return 200 with null
    # instead of 404 so the frontend can render an empty state without errors.
    return scope


# ----------------- REQUISITOS LEGALES -----------------

@router.post("/requisitos-legales", response_model=RequisitoLegalResponse, status_code=status.HTTP_201_CREATED)
def create_requisito_legal(
    data: RequisitoLegalCreate,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    req = RequisitoLegal(
        nombre=data.nombre,
        numero=data.numero,
        organismo_emisor=data.organismo_emisor,
        fecha_publicacion=data.fecha_publicacion,
        proceso_aplicable=data.proceso_aplicable,
        estado_cumplimiento=data.estado_cumplimiento,
        evidencia_s3_key=data.evidencia_s3_key,
        tenant_id=current_user.tenant_id
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return req

@router.get("/requisitos-legales", response_model=List[RequisitoLegalResponse])
def list_requisitos_legales(
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    return db.query(RequisitoLegal).filter(RequisitoLegal.tenant_id == current_user.tenant_id).all()

@router.delete("/requisitos-legales/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_requisito_legal(
    id: UUID,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    req = db.query(RequisitoLegal).filter(
        RequisitoLegal.id == id,
        RequisitoLegal.tenant_id == current_user.tenant_id
    ).first()

    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró el requisito legal."
        )

    db.delete(req)
    db.commit()
