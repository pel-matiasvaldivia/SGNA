from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.api.deps import get_tenant_db_from_token, get_current_active_user
from app.models.user import User
from app.models.mantenimiento import ActivoInfraestructura, OrdenTrabajoMantenimiento
from app.schemas.mantenimiento import ActivoCreate, ActivoUpdate, ActivoResponse, OrdenTrabajoCreate, OrdenTrabajoUpdate, OrdenTrabajoResponse

router = APIRouter()

@router.post("/activos", response_model=ActivoResponse, status_code=status.HTTP_201_CREATED)
def create_activo(
    activo_in: ActivoCreate,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    db_activo = ActivoInfraestructura(
        **activo_in.model_dump(),
        tenant_id=current_user.tenant_id
    )
    db.add(db_activo)
    db.commit()
    db.refresh(db_activo)
    return db_activo

@router.get("/activos", response_model=List[ActivoResponse])
def get_activos(
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    return db.query(ActivoInfraestructura).filter(ActivoInfraestructura.tenant_id == current_user.tenant_id).all()

@router.post("/ordenes", response_model=OrdenTrabajoResponse, status_code=status.HTTP_201_CREATED)
def create_orden_trabajo(
    orden_in: OrdenTrabajoCreate,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    # Verify activo exists
    activo = db.query(ActivoInfraestructura).filter(
        ActivoInfraestructura.id == orden_in.activo_id,
        ActivoInfraestructura.tenant_id == current_user.tenant_id
    ).first()
    if not activo:
        raise HTTPException(status_code=404, detail="Activo no encontrado")

    db_orden = OrdenTrabajoMantenimiento(
        **orden_in.model_dump(),
        responsable_id=current_user.id,
        tenant_id=current_user.tenant_id
    )
    db.add(db_orden)
    db.commit()
    db.refresh(db_orden)
    return db_orden

@router.get("/ordenes", response_model=List[OrdenTrabajoResponse])
def get_ordenes(
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    return db.query(OrdenTrabajoMantenimiento).filter(OrdenTrabajoMantenimiento.tenant_id == current_user.tenant_id).all()

@router.put("/ordenes/{orden_id}", response_model=OrdenTrabajoResponse)
def update_orden(
    orden_id: UUID,
    orden_in: OrdenTrabajoUpdate,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    db_orden = db.query(OrdenTrabajoMantenimiento).filter(
        OrdenTrabajoMantenimiento.id == orden_id,
        OrdenTrabajoMantenimiento.tenant_id == current_user.tenant_id
    ).first()
    if not db_orden:
        raise HTTPException(status_code=404, detail="Orden de trabajo no encontrada")
    
    update_data = orden_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_orden, key, value)
        
    db.commit()
    db.refresh(db_orden)
    return db_orden
