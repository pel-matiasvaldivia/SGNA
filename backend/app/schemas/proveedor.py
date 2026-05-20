from pydantic import BaseModel, Field
from uuid import UUID
from datetime import date
from typing import Optional

class ProveedorBase(BaseModel):
    razon_social: str
    rut_tax_id: str
    contacto_nombre: Optional[str] = None
    contacto_email: Optional[str] = None
    contacto_telefono: Optional[str] = None
    categoria: str = "critico"  # critico, estrategico, soporte
    estado: str = "prospecto"  # prospecto, evaluado, homologado, suspendido

class ProveedorCreate(ProveedorBase):
    pass

class ProveedorUpdate(BaseModel):
    razon_social: Optional[str] = None
    rut_tax_id: Optional[str] = None
    contacto_nombre: Optional[str] = None
    contacto_email: Optional[str] = None
    contacto_telefono: Optional[str] = None
    categoria: Optional[str] = None
    estado: Optional[str] = None

class ProveedorResponse(ProveedorBase):
    id: UUID
    calificacion_promedio: float
    tenant_id: UUID

    class Config:
        from_attributes = True

class EvaluacionProveedorCreate(BaseModel):
    fecha_evaluacion: date
    criterio_calidad: int = Field(..., ge=1, le=100)
    criterio_entrega: int = Field(..., ge=1, le=100)
    criterio_servicio: int = Field(..., ge=1, le=100)
    criterio_cumplimiento: int = Field(..., ge=1, le=100)
    comentarios: Optional[str] = None
    evidencia_documento_id: Optional[UUID] = None

class EvaluacionProveedorResponse(BaseModel):
    id: UUID
    proveedor_id: UUID
    fecha_evaluacion: date
    criterio_calidad: int
    criterio_entrega: int
    criterio_servicio: int
    criterio_cumplimiento: int
    puntaje_global: float
    resultado: str
    comentarios: Optional[str] = None
    evaluador_id: Optional[UUID] = None
    evidencia_documento_id: Optional[UUID] = None
    tenant_id: UUID

    class Config:
        from_attributes = True

class ReclamoProveedorCreate(BaseModel):
    descripcion_desvio: str
    fecha_reclamo: date
    vincular_nc: Optional[bool] = False

class ReclamoProveedorResponse(BaseModel):
    id: UUID
    proveedor_id: UUID
    codigo: str
    descripcion_desvio: str
    fecha_reclamo: date
    estado: str
    solucion_propuesta: Optional[str] = None
    comentarios_cierre: Optional[str] = None
    fecha_cierre: Optional[date] = None
    non_conformity_id: Optional[UUID] = None
    tenant_id: UUID

    class Config:
        from_attributes = True

class ReclamoProveedorClose(BaseModel):
    solucion_propuesta: str
    comentarios_cierre: str
    fecha_cierre: date
