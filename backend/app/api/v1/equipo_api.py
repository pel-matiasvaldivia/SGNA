import uuid
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_tenant_db_from_token, get_current_active_user
from app.models.user import User
from app.models.equipo import EquipoMedicion, RegistroCalibracion
from app.schemas.equipo import (
    EquipoMedicionCreate,
    EquipoMedicionUpdate,
    EquipoMedicionResponse,
    RegistroCalibracionCreate,
    RegistroCalibracionResponse
)

router = APIRouter()

def add_months(sourcedate: datetime, months: int) -> datetime:
    """Adds months to a datetime object safely, keeping the timezone."""
    month = sourcedate.month - 1 + months
    year = sourcedate.year + month // 12
    month = month % 12 + 1
    # Handle end-of-month day limits
    days_in_month = [
        31,
        29 if (year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)) else 28,
        31, 30, 31, 30, 31, 31, 30, 31, 30, 31
    ]
    day = min(sourcedate.day, days_in_month[month - 1])
    return datetime(
        year, month, day,
        sourcedate.hour, sourcedate.minute, sourcedate.second,
        tzinfo=sourcedate.tzinfo or timezone.utc
    )

def refresh_equipment_status(equipo: EquipoMedicion, db: Session):
    """Checks if the equipment calibration is expired and updates status in DB."""
    if equipo.estado == "fuera_servicio":
        return
        
    if equipo.fecha_proxima_calibracion:
        now_utc = datetime.now(timezone.utc)
        # Ensure timezone comparison compatibility
        prox_cal = equipo.fecha_proxima_calibracion
        if prox_cal.tzinfo is None:
            prox_cal = prox_cal.replace(tzinfo=timezone.utc)
            
        if now_utc > prox_cal:
            equipo.estado = "vencido"
        else:
            equipo.estado = "operativo"
            
        db.add(equipo)
        db.commit()
        db.refresh(equipo)


@router.post("/", response_model=EquipoMedicionResponse, status_code=status.HTTP_201_CREATED)
def create_equipo(
    data: EquipoMedicionCreate,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    equipo = EquipoMedicion(
        codigo=data.codigo,
        nombre=data.nombre,
        marca=data.marca,
        modelo=data.modelo,
        numero_serie=data.numero_serie,
        ubicacion=data.ubicacion,
        frecuencia_calibracion_meses=data.frecuencia_calibracion_meses,
        estado=data.estado,
        responsable_id=data.responsable_id or current_user.id,
        tenant_id=current_user.tenant_id
    )
    db.add(equipo)
    db.commit()
    db.refresh(equipo)
    return equipo


@router.get("/", response_model=List[EquipoMedicionResponse])
def list_equipos(
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    equipos = db.query(EquipoMedicion).filter(EquipoMedicion.tenant_id == current_user.tenant_id).all()
    for e in equipos:
        refresh_equipment_status(e, db)
    return equipos


@router.get("/{id}", response_model=EquipoMedicionResponse)
def get_equipo(
    id: uuid.UUID,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    equipo = db.query(EquipoMedicion).filter(
        EquipoMedicion.id == id,
        EquipoMedicion.tenant_id == current_user.tenant_id
    ).first()
    if not equipo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró el equipo de medición."
        )
    refresh_equipment_status(equipo, db)
    return equipo


@router.put("/{id}", response_model=EquipoMedicionResponse)
def update_equipo(
    id: uuid.UUID,
    data: EquipoMedicionUpdate,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    equipo = db.query(EquipoMedicion).filter(
        EquipoMedicion.id == id,
        EquipoMedicion.tenant_id == current_user.tenant_id
    ).first()
    if not equipo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró el equipo de medición."
        )

    for field, value in data.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(equipo, field, value)

    db.commit()
    db.refresh(equipo)
    refresh_equipment_status(equipo, db)
    return equipo


@router.post("/{id}/calibrar", response_model=RegistroCalibracionResponse, status_code=status.HTTP_201_CREATED)
def calibrate_equipo(
    id: uuid.UUID,
    data: RegistroCalibracionCreate,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    equipo = db.query(EquipoMedicion).filter(
        EquipoMedicion.id == id,
        EquipoMedicion.tenant_id == current_user.tenant_id
    ).first()
    if not equipo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró el equipo de medición especificado."
        )

    # Log the calibration
    registro = RegistroCalibracion(
        equipo_id=id,
        fecha_calibracion=data.fecha_calibracion,
        resultado=data.resultado,
        patron_utilizado=data.patron_utilizado,
        certificado_documento_id=data.certificado_documento_id,
        realizado_por=data.realizado_por,
        comentarios=data.comentarios,
        tenant_id=current_user.tenant_id
    )
    db.add(registro)

    # Automatically compute new calibration dates if this calibration is approved
    if data.resultado == "aprobado":
        equipo.fecha_ultima_calibracion = data.fecha_calibracion
        equipo.fecha_proxima_calibracion = add_months(data.fecha_calibracion, equipo.frecuencia_calibracion_meses)
        equipo.estado = "operativo"
    else:
        equipo.estado = "fuera_servicio"

    db.add(equipo)
    db.commit()
    db.refresh(registro)
    return registro


@router.get("/{id}/calibraciones", response_model=List[RegistroCalibracionResponse])
def list_calibraciones(
    id: uuid.UUID,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    # Verify equipment ownership
    equipo = db.query(EquipoMedicion).filter(
        EquipoMedicion.id == id,
        EquipoMedicion.tenant_id == current_user.tenant_id
    ).first()
    if not equipo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró el equipo de medición."
        )

    return db.query(RegistroCalibracion).filter(
        RegistroCalibracion.equipo_id == id,
        RegistroCalibracion.tenant_id == current_user.tenant_id
    ).order_by(RegistroCalibracion.fecha_calibracion.desc()).all()
