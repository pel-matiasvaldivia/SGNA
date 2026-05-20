import uuid
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_tenant_db_from_token, get_current_active_user
from app.models.user import User
from app.models.cambio import ControlCambio, ItemAccionCambio
from app.schemas.cambio import (
    ControlCambioCreate,
    ControlCambioUpdate,
    ControlCambioResponse,
    ItemAccionCambioCreate,
    ItemAccionCambioResponse
)

router = APIRouter()

@router.post("/", response_model=ControlCambioResponse, status_code=status.HTTP_201_CREATED)
def create_control_cambio(
    data: ControlCambioCreate,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    cambio = ControlCambio(
        codigo=data.codigo,
        titulo=data.titulo,
        descripcion=data.descripcion,
        motivo=data.motivo,
        impacto_sgi=data.impacto_sgi,
        recursos_requeridos=data.recursos_requeridos,
        estado="propuesto",
        fecha_propuesta=datetime.now(timezone.utc),
        fecha_limite=data.fecha_limite,
        solicitante_id=current_user.id,
        tenant_id=current_user.tenant_id
    )
    db.add(cambio)
    db.commit()
    db.refresh(cambio)
    return cambio


@router.get("/", response_model=List[ControlCambioResponse])
def list_control_cambios(
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    return db.query(ControlCambio).filter(ControlCambio.tenant_id == current_user.tenant_id).all()


@router.get("/{id}", response_model=ControlCambioResponse)
def get_control_cambio(
    id: uuid.UUID,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    cambio = db.query(ControlCambio).filter(
        ControlCambio.id == id,
        ControlCambio.tenant_id == current_user.tenant_id
    ).first()
    if not cambio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró la solicitud de cambio."
        )
    return cambio


@router.put("/{id}", response_model=ControlCambioResponse)
def update_control_cambio(
    id: uuid.UUID,
    data: ControlCambioUpdate,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    cambio = db.query(ControlCambio).filter(
        ControlCambio.id == id,
        ControlCambio.tenant_id == current_user.tenant_id
    ).first()
    if not cambio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró la solicitud de cambio."
        )

    for field, value in data.model_dump(exclude_unset=True).items():
        if field == "estado" and value is not None:
            # Check for role permission to transition status
            cambio.estado = value
            if value == "aprobado":
                cambio.aprobador_id = current_user.id
        elif value is not None:
            setattr(cambio, field, value)

    db.commit()
    db.refresh(cambio)
    return cambio


@router.put("/{id}/estado", response_model=ControlCambioResponse)
def transition_control_cambio_estado(
    id: uuid.UUID,
    estado: str,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    cambio = db.query(ControlCambio).filter(
        ControlCambio.id == id,
        ControlCambio.tenant_id == current_user.tenant_id
    ).first()
    if not cambio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró la solicitud de cambio."
        )

    if estado not in ["propuesto", "en_analisis", "aprobado", "ejecutado", "cancelado"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Estado de cambio no válido."
        )

    cambio.estado = estado
    if estado == "aprobado":
        cambio.aprobador_id = current_user.id

    db.commit()
    db.refresh(cambio)
    return cambio


@router.post("/{id}/acciones", response_model=ItemAccionCambioResponse, status_code=status.HTTP_201_CREATED)
def create_item_accion_cambio(
    id: uuid.UUID,
    data: ItemAccionCambioCreate,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    cambio = db.query(ControlCambio).filter(
        ControlCambio.id == id,
        ControlCambio.tenant_id == current_user.tenant_id
    ).first()
    if not cambio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró la solicitud de cambio especificada."
        )

    accion = ItemAccionCambio(
        cambio_id=id,
        descripcion=data.descripcion,
        responsable_id=data.responsable_id or current_user.id,
        fecha_limite=data.fecha_limite,
        estado="pendiente",
        tenant_id=current_user.tenant_id
    )
    db.add(accion)
    db.commit()
    db.refresh(accion)
    return accion


@router.put("/{id}/acciones/{accion_id}/completar", response_model=ItemAccionCambioResponse)
def complete_item_accion_cambio(
    id: uuid.UUID,
    accion_id: uuid.UUID,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    accion = db.query(ItemAccionCambio).filter(
        ItemAccionCambio.id == accion_id,
        ItemAccionCambio.cambio_id == id,
        ItemAccionCambio.tenant_id == current_user.tenant_id
    ).first()

    if not accion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró la tarea de acción para esta solicitud."
        )

    accion.estado = "completado"
    accion.fecha_ejecucion = datetime.now(timezone.utc)
    db.commit()
    db.refresh(accion)
    return accion
