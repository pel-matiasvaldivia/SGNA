import uuid
from datetime import datetime, date, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.api.deps import get_tenant_db_from_token, get_current_active_user
from app.models.user import User
from app.models.proveedor import Proveedor, EvaluacionProveedor, ReclamoProveedor
from app.models.iso9001 import NonConformity
from app.schemas.proveedor import (
    ProveedorCreate, ProveedorUpdate, ProveedorResponse,
    EvaluacionProveedorCreate, EvaluacionProveedorResponse,
    ReclamoProveedorCreate, ReclamoProveedorResponse, ReclamoProveedorClose
)

router = APIRouter()

# ----------------- PROVEEDORES CRUD -----------------

@router.get("", response_model=List[ProveedorResponse])
def list_proveedores(
    categoria: Optional[str] = None,
    estado: Optional[str] = None,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Proveedor).filter(Proveedor.tenant_id == current_user.tenant_id)
    if categoria:
        query = query.filter(Proveedor.categoria == categoria)
    if estado:
        query = query.filter(Proveedor.estado == estado)
    return query.all()

@router.post("", response_model=ProveedorResponse, status_code=status.HTTP_201_CREATED)
def create_proveedor(
    data: ProveedorCreate,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    proveedor = Proveedor(
        razon_social=data.razon_social,
        rut_tax_id=data.rut_tax_id,
        contacto_nombre=data.contacto_nombre,
        contacto_email=data.contacto_email,
        contacto_telefono=data.contacto_telefono,
        categoria=data.categoria,
        estado=data.estado,
        calificacion_promedio=0.00,
        tenant_id=current_user.tenant_id
    )
    db.add(proveedor)
    db.commit()
    db.refresh(proveedor)
    return proveedor

@router.get("/{id}", response_model=ProveedorResponse)
def get_proveedor(
    id: uuid.UUID,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    proveedor = db.query(Proveedor).filter(
        Proveedor.id == id,
        Proveedor.tenant_id == current_user.tenant_id
    ).first()
    if not proveedor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró el proveedor especificado."
        )
    return proveedor

@router.put("/{id}", response_model=ProveedorResponse)
def update_proveedor(
    id: uuid.UUID,
    data: ProveedorUpdate,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    proveedor = db.query(Proveedor).filter(
        Proveedor.id == id,
        Proveedor.tenant_id == current_user.tenant_id
    ).first()
    if not proveedor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró el proveedor especificado."
        )
    
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(proveedor, key, value)
        
    db.commit()
    db.refresh(proveedor)
    return proveedor

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_proveedor(
    id: uuid.UUID,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    proveedor = db.query(Proveedor).filter(
        Proveedor.id == id,
        Proveedor.tenant_id == current_user.tenant_id
    ).first()
    if not proveedor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró el proveedor especificado."
        )
    db.delete(proveedor)
    db.commit()
    return None

# ----------------- EVALUACIONES DE DESEMPEÑO (ISO 8.4) -----------------

@router.post("/{id}/evaluaciones", response_model=EvaluacionProveedorResponse, status_code=status.HTTP_201_CREATED)
def create_evaluacion(
    id: uuid.UUID,
    data: EvaluacionProveedorCreate,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    proveedor = db.query(Proveedor).filter(
        Proveedor.id == id,
        Proveedor.tenant_id == current_user.tenant_id
    ).first()
    if not proveedor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró el proveedor especificado."
        )
    
    # Calculate weighted global score: Quality 40%, Delivery 30%, Service 20%, Compliance 10%
    score = (
        (data.criterio_calidad * 0.40) +
        (data.criterio_entrega * 0.30) +
        (data.criterio_servicio * 0.20) +
        (data.criterio_cumplimiento * 0.10)
    )
    
    # Determine result
    if score >= 80.0:
        resultado = "aprobado"
        nuevo_estado = "homologado"
    elif score >= 60.0:
        resultado = "condicional"
        nuevo_estado = "evaluado"
    else:
        resultado = "rechazado"
        nuevo_estado = "suspendido"
        
    evaluacion = EvaluacionProveedor(
        proveedor_id=id,
        fecha_evaluacion=data.fecha_evaluacion,
        criterio_calidad=data.criterio_calidad,
        criterio_entrega=data.criterio_entrega,
        criterio_servicio=data.criterio_servicio,
        criterio_cumplimiento=data.criterio_cumplimiento,
        puntaje_global=score,
        resultado=resultado,
        comentarios=data.comentarios,
        evaluador_id=current_user.id,
        evidencia_documento_id=data.evidencia_documento_id,
        tenant_id=current_user.tenant_id
    )
    
    db.add(evaluacion)
    
    # Update supplier status
    proveedor.estado = nuevo_estado
    
    db.commit()
    db.refresh(evaluacion)
    
    # Re-calculate average score for Proveedor
    avg_score = db.query(func.avg(EvaluacionProveedor.puntaje_global)).filter(
        EvaluacionProveedor.proveedor_id == id
    ).scalar()
    
    proveedor.calificacion_promedio = float(avg_score) if avg_score is not None else 0.00
    db.commit()
    db.refresh(proveedor)
    
    return evaluacion

@router.get("/{id}/evaluaciones", response_model=List[EvaluacionProveedorResponse])
def list_evaluaciones(
    id: uuid.UUID,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    proveedor = db.query(Proveedor).filter(
        Proveedor.id == id,
        Proveedor.tenant_id == current_user.tenant_id
    ).first()
    if not proveedor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró el proveedor especificado."
        )
    return db.query(EvaluacionProveedor).filter(
        EvaluacionProveedor.proveedor_id == id,
        EvaluacionProveedor.tenant_id == current_user.tenant_id
    ).order_by(EvaluacionProveedor.fecha_evaluacion.desc()).all()

# ----------------- ACCIONES CORRECTIVAS DE PROVEEDORES (SCAR) -----------------

@router.post("/{id}/reclamos", response_model=ReclamoProveedorResponse, status_code=status.HTTP_201_CREATED)
def create_reclamo(
    id: uuid.UUID,
    data: ReclamoProveedorCreate,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    proveedor = db.query(Proveedor).filter(
        Proveedor.id == id,
        Proveedor.tenant_id == current_user.tenant_id
    ).first()
    if not proveedor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró el proveedor especificado."
        )
        
    scar_code = f"SCAR-PRV-{uuid.uuid4().hex[:6].upper()}"
    
    nc_id = None
    if data.vincular_nc:
        # Create a linked NonConformity in the general CAPA module (M06)
        nc = NonConformity(
            title=f"Reclamo a Proveedor: {proveedor.razon_social} ({scar_code})",
            description=data.descripcion_desvio,
            origin=f"Proveedor ({proveedor.razon_social})",
            estado="abierta",
            creado_por_id=current_user.id,
            tenant_id=current_user.tenant_id
        )
        db.add(nc)
        db.commit()
        db.refresh(nc)
        nc_id = nc.id
        
    reclamo = ReclamoProveedor(
        proveedor_id=id,
        codigo=scar_code,
        descripcion_desvio=data.descripcion_desvio,
        fecha_reclamo=data.fecha_reclamo,
        estado="abierto",
        non_conformity_id=nc_id,
        tenant_id=current_user.tenant_id
    )
    
    db.add(reclamo)
    db.commit()
    db.refresh(reclamo)
    return reclamo

@router.get("/{id}/reclamos", response_model=List[ReclamoProveedorResponse])
def list_reclamos(
    id: uuid.UUID,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    proveedor = db.query(Proveedor).filter(
        Proveedor.id == id,
        Proveedor.tenant_id == current_user.tenant_id
    ).first()
    if not proveedor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró el proveedor especificado."
        )
    return db.query(ReclamoProveedor).filter(
        ReclamoProveedor.proveedor_id == id,
        ReclamoProveedor.tenant_id == current_user.tenant_id
    ).order_by(ReclamoProveedor.fecha_reclamo.desc()).all()

@router.put("/reclamos/{reclamo_id}/close", response_model=ReclamoProveedorResponse)
def close_reclamo(
    reclamo_id: uuid.UUID,
    data: ReclamoProveedorClose,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    reclamo = db.query(ReclamoProveedor).filter(
        ReclamoProveedor.id == reclamo_id,
        ReclamoProveedor.tenant_id == current_user.tenant_id
    ).first()
    if not reclamo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró el reclamo de proveedor especificado."
        )
        
    reclamo.estado = "cerrado"
    reclamo.solucion_propuesta = data.solucion_propuesta
    reclamo.comentarios_cierre = data.comentarios_cierre
    reclamo.fecha_cierre = data.fecha_cierre
    
    # If there is a linked NonConformity, also close it
    if reclamo.non_conformity_id:
        nc = db.query(NonConformity).filter(
            NonConformity.id == reclamo.non_conformity_id,
            NonConformity.tenant_id == current_user.tenant_id
        ).first()
        if nc and nc.estado != "cerrada":
            nc.estado = "cerrada"
            nc.fecha_cierre = datetime.now(timezone.utc)
            nc.cierre_comentarios = f"Cerrado formalmente mediante resolución de SCAR ({reclamo.codigo}). Comentarios de cierre: {data.comentarios_cierre}"
            
    db.commit()
    db.refresh(reclamo)
    return reclamo
