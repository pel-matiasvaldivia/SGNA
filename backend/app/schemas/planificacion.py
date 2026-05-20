from pydantic import BaseModel, Field
from typing import Optional
from datetime import date
from uuid import UUID

# Objetivo SGI
class ObjetivoSGICreate(BaseModel):
    nombre: str = Field(..., max_length=255)
    descripcion: str
    meta: float
    unidad: str = "%"
    indicador: str = Field(..., max_length=255)
    frecuencia: str = "mensual"
    fecha_limite: date
    progreso: float = 0.0

class ObjetivoSGIResponse(BaseModel):
    id: UUID
    nombre: str
    descripcion: str
    meta: float
    unidad: str
    indicador: str
    frecuencia: str
    responsable_id: Optional[UUID] = None
    fecha_limite: date
    progreso: float
    tenant_id: UUID

    class Config:
        from_attributes = True

# Riesgos y Oportunidades
class RiesgoOportunidadCreate(BaseModel):
    descripcion: str
    tipo: str = Field(..., description="riesgo, oportunidad")
    origen: Optional[str] = None
    probabilidad: int = Field(3, ge=1, le=5)
    impacto: int = Field(3, ge=1, le=5)
    probabilidad_residual: Optional[int] = Field(3, ge=1, le=5)
    impacto_residual: Optional[int] = Field(3, ge=1, le=5)
    acciones: Optional[str] = None
    estado: str = "identificado"
    proceso_id: Optional[UUID] = None
    evidencia_documento_id: Optional[UUID] = None

class RiesgoOportunidadUpdate(BaseModel):
    descripcion: Optional[str] = None
    tipo: Optional[str] = None
    origen: Optional[str] = None
    probabilidad: Optional[int] = Field(None, ge=1, le=5)
    impacto: Optional[int] = Field(None, ge=1, le=5)
    probabilidad_residual: Optional[int] = Field(None, ge=1, le=5)
    impacto_residual: Optional[int] = Field(None, ge=1, le=5)
    acciones: Optional[str] = None
    estado: Optional[str] = None
    proceso_id: Optional[UUID] = None
    evidencia_documento_id: Optional[UUID] = None

class RiesgoOportunidadResponse(BaseModel):
    id: UUID
    descripcion: str
    tipo: str
    origen: Optional[str] = None
    probabilidad: int
    impacto: int
    probabilidad_residual: int
    impacto_residual: int
    acciones: Optional[str] = None
    responsable_id: Optional[UUID] = None
    estado: str
    proceso_id: Optional[UUID] = None
    evidencia_documento_id: Optional[UUID] = None
    tenant_id: UUID

    class Config:
        from_attributes = True

