from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.api.deps import get_tenant_db_from_token, get_current_active_user
from app.models.user import User
from app.models.sst import IncidenteSST, InspeccionSST
from app.schemas.sst import IncidenteCreate, IncidenteUpdate, IncidenteResponse, InspeccionCreate, InspeccionResponse

router = APIRouter()

@router.post("/incidentes", response_model=IncidenteResponse, status_code=status.HTTP_201_CREATED)
def create_incidente(
    incidente_in: IncidenteCreate,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    db_incidente = IncidenteSST(
        **incidente_in.model_dump(),
        reportado_por_id=current_user.id,
        tenant_id=current_user.tenant_id
    )
    db.add(db_incidente)
    db.commit()
    db.refresh(db_incidente)
    return db_incidente

@router.get("/incidentes", response_model=List[IncidenteResponse])
def get_incidentes(
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    return db.query(IncidenteSST).filter(IncidenteSST.tenant_id == current_user.tenant_id).all()

@router.put("/incidentes/{incidente_id}", response_model=IncidenteResponse)
def update_incidente(
    incidente_id: UUID,
    incidente_in: IncidenteUpdate,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    db_incidente = db.query(IncidenteSST).filter(
        IncidenteSST.id == incidente_id,
        IncidenteSST.tenant_id == current_user.tenant_id
    ).first()
    if not db_incidente:
        raise HTTPException(status_code=404, detail="Incidente no encontrado")
    
    update_data = incidente_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_incidente, key, value)
        
    db.commit()
    db.refresh(db_incidente)
    return db_incidente

@router.post("/inspecciones", response_model=InspeccionResponse, status_code=status.HTTP_201_CREATED)
def create_inspeccion(
    inspeccion_in: InspeccionCreate,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    db_inspeccion = InspeccionSST(
        **inspeccion_in.model_dump(),
        auditor_id=current_user.id,
        tenant_id=current_user.tenant_id
    )
    db.add(db_inspeccion)
    db.commit()
    db.refresh(db_inspeccion)
    return db_inspeccion

@router.get("/inspecciones", response_model=List[InspeccionResponse])
def get_inspecciones(
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    return db.query(InspeccionSST).filter(InspeccionSST.tenant_id == current_user.tenant_id).all()
