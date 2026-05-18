import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_tenant_db_from_token, get_current_active_user
from app.models.user import User
from app.models.iso9001 import NonConformity, CorrectiveAction
from app.schemas.iso9001 import NonConformityResponse, NonConformityCreate, CorrectiveActionResponse, CorrectiveActionCreate

router = APIRouter()

@router.post("/non-conformities", response_model=NonConformityResponse, status_code=status.HTTP_201_CREATED)
def create_non_conformity(
    data: NonConformityCreate,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    nc = NonConformity(
        title=data.title,
        description=data.description,
        origin=data.origin,
        estado="abierta",
        creado_por_id=current_user.id,
        tenant_id=current_user.tenant_id
    )
    db.add(nc)
    db.commit()
    db.refresh(nc)
    return nc


@router.get("/non-conformities", response_model=List[NonConformityResponse])
def list_non_conformities(
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    return db.query(NonConformity).filter(NonConformity.tenant_id == current_user.tenant_id).all()


@router.post("/corrective-actions", response_model=CorrectiveActionResponse, status_code=status.HTTP_201_CREATED)
def create_corrective_action(
    data: CorrectiveActionCreate,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    # Verify non conformity exists
    nc = db.query(NonConformity).filter(
        NonConformity.id == data.non_conformity_id, 
        NonConformity.tenant_id == current_user.tenant_id
    ).first()
    
    if not nc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró la No Conformidad especificada."
        )

    action = CorrectiveAction(
        non_conformity_id=data.non_conformity_id,
        descripcion=data.descripcion,
        analisis_causa_raiz=data.analisis_causa_raiz,
        fecha_planificada=data.fecha_planificada,
        responsable_id=data.responsable_id or current_user.id
    )
    db.add(action)
    
    # Transition non conformity state to "analizada"
    if nc.estado == "abierta":
        nc.estado = "analizada"

    db.commit()
    db.refresh(action)
    return action
