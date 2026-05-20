from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from uuid import UUID

class ItemAccionCambioBase(BaseModel):
    descripcion: str
    responsable_id: Optional[UUID] = None
    fecha_limite: datetime

class ItemAccionCambioCreate(ItemAccionCambioBase):
    pass

class ItemAccionCambioResponse(ItemAccionCambioBase):
    id: UUID
    cambio_id: UUID
    fecha_ejecucion: Optional[datetime] = None
    estado: str  # pendiente, completado
    tenant_id: UUID

    class Config:
        from_attributes = True


class ControlCambioBase(BaseModel):
    codigo: str
    titulo: str
    descripcion: str
    motivo: str
    impacto_sgi: str = Field("bajo", description="alto, medio, bajo")
    recursos_requeridos: Optional[str] = None
    fecha_limite: Optional[datetime] = None

class ControlCambioCreate(ControlCambioBase):
    pass

class ControlCambioUpdate(BaseModel):
    titulo: Optional[str] = None
    descripcion: Optional[str] = None
    motivo: Optional[str] = None
    impacto_sgi: Optional[str] = None
    recursos_requeridos: Optional[str] = None
    fecha_limite: Optional[datetime] = None
    estado: Optional[str] = None  # propuesto, en_analisis, aprobado, ejecutado, cancelado

class ControlCambioResponse(ControlCambioBase):
    id: UUID
    estado: str
    fecha_propuesta: datetime
    solicitante_id: Optional[UUID] = None
    aprobador_id: Optional[UUID] = None
    tenant_id: UUID
    acciones: List[ItemAccionCambioResponse] = []

    class Config:
        from_attributes = True
