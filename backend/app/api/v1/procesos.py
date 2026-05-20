from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.api.deps import get_tenant_db_from_token, get_current_active_user
from app.models.user import User
from app.models.procesos import ProcesoBPM
from app.schemas.procesos import ProcesoBPMCreate, ProcesoBPMResponse

router = APIRouter()

@router.post("/", response_model=ProcesoBPMResponse, status_code=status.HTTP_201_CREATED)
def create_proceso(
    data: ProcesoBPMCreate,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    # Verify unique process code per tenant
    existing = db.query(ProcesoBPM).filter(
        ProcesoBPM.codigo == data.codigo,
        ProcesoBPM.tenant_id == current_user.tenant_id
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El código de proceso '{data.codigo}' ya se encuentra registrado."
        )

    proceso = ProcesoBPM(
        nombre=data.nombre,
        codigo=data.codigo,
        tipo=data.tipo,
        entradas=data.entradas,
        proveedores=data.proveedores,
        salidas=data.salidas,
        clientes=data.clientes,
        recursos=data.recursos,
        controles=data.controles,
        responsable_id=current_user.id,
        tenant_id=current_user.tenant_id
    )
    db.add(proceso)
    db.commit()
    db.refresh(proceso)
    return proceso


@router.get("/", response_model=List[ProcesoBPMResponse])
def list_procesos(
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    return db.query(ProcesoBPM).filter(ProcesoBPM.tenant_id == current_user.tenant_id).all()


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_proceso(
    id: UUID,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    proceso = db.query(ProcesoBPM).filter(
        ProcesoBPM.id == id,
        ProcesoBPM.tenant_id == current_user.tenant_id
    ).first()

    if not proceso:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró el proceso especificado."
        )

    db.delete(proceso)
    db.commit()
