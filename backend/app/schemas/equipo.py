from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from uuid import UUID

class RegistroCalibracionBase(BaseModel):
    fecha_calibracion: datetime
    resultado: str = Field("aprobado", description="aprobado, rechazado")
    patron_utilizado: Optional[str] = None
    certificado_documento_id: Optional[UUID] = None
    realizado_por: str
    comentarios: Optional[str] = None

class RegistroCalibracionCreate(RegistroCalibracionBase):
    pass

class RegistroCalibracionResponse(RegistroCalibracionBase):
    id: UUID
    equipo_id: UUID
    tenant_id: UUID

    class Config:
        from_attributes = True


class EquipoMedicionBase(BaseModel):
    codigo: str
    nombre: str
    marca: Optional[str] = None
    modelo: Optional[str] = None
    numero_serie: Optional[str] = None
    ubicacion: Optional[str] = None
    frecuencia_calibracion_meses: int = Field(12, description="Frecuencia en meses")
    estado: str = Field("operativo", description="operativo, vencido, fuera_servicio")
    responsable_id: Optional[UUID] = None

class EquipoMedicionCreate(EquipoMedicionBase):
    pass

class EquipoMedicionUpdate(BaseModel):
    codigo: Optional[str] = None
    nombre: Optional[str] = None
    marca: Optional[str] = None
    modelo: Optional[str] = None
    numero_serie: Optional[str] = None
    ubicacion: Optional[str] = None
    frecuencia_calibracion_meses: Optional[int] = None
    estado: Optional[str] = None
    responsable_id: Optional[UUID] = None

class EquipoMedicionResponse(EquipoMedicionBase):
    id: UUID
    fecha_ultima_calibracion: Optional[datetime] = None
    fecha_proxima_calibracion: Optional[datetime] = None
    tenant_id: UUID
    calibraciones: List[RegistroCalibracionResponse] = []

    class Config:
        from_attributes = True
