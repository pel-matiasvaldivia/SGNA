from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class IncidenteBase(BaseModel):
    tipo: str
    gravedad: str
    descripcion: str
    fecha_incidente: datetime
    ubicacion: Optional[str] = None
    personas_involucradas: Optional[str] = None
    estado_investigacion: str = "reportado"

class IncidenteCreate(IncidenteBase):
    pass

class IncidenteUpdate(BaseModel):
    estado_investigacion: Optional[str] = None
    gravedad: Optional[str] = None

class IncidenteResponse(IncidenteBase):
    id: UUID
    reportado_por_id: Optional[UUID] = None
    tenant_id: UUID

    class Config:
        from_attributes = True

class InspeccionBase(BaseModel):
    titulo: str
    tipo_inspeccion: str
    fecha_inspeccion: datetime
    porcentaje_cumplimiento: float = 0.0
    hallazgos_criticos: Optional[str] = None

class InspeccionCreate(InspeccionBase):
    pass

class InspeccionResponse(InspeccionBase):
    id: UUID
    auditor_id: Optional[UUID] = None
    tenant_id: UUID

    class Config:
        from_attributes = True
