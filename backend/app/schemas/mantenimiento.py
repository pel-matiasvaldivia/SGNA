from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class ActivoBase(BaseModel):
    codigo: str
    nombre: str
    tipo: str
    ubicacion: Optional[str] = None
    criticidad: str = "media"
    estado: str = "operativo"
    fabricante: Optional[str] = None
    fecha_adquisicion: Optional[datetime] = None

class ActivoCreate(ActivoBase):
    pass

class ActivoUpdate(BaseModel):
    estado: Optional[str] = None

class ActivoResponse(ActivoBase):
    id: UUID
    tenant_id: UUID

    class Config:
        from_attributes = True

class OrdenTrabajoBase(BaseModel):
    activo_id: UUID
    tipo_mantenimiento: str
    descripcion_falla: str
    fecha_solicitud: datetime
    fecha_programada: Optional[datetime] = None
    fecha_completada: Optional[datetime] = None
    estado: str = "pendiente"
    costo_estimado: Optional[float] = None

class OrdenTrabajoCreate(OrdenTrabajoBase):
    pass

class OrdenTrabajoUpdate(BaseModel):
    estado: Optional[str] = None
    fecha_programada: Optional[datetime] = None
    fecha_completada: Optional[datetime] = None
    costo_estimado: Optional[float] = None

class OrdenTrabajoResponse(OrdenTrabajoBase):
    id: UUID
    responsable_id: Optional[UUID] = None
    tenant_id: UUID

    class Config:
        from_attributes = True
