from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime
from uuid import UUID

# Programa de Auditoría
class ProgramaAuditoriaCreate(BaseModel):
    titulo: str = Field(..., max_length=255)
    objetivos: str
    alcance: str
    fecha_inicio: date
    fecha_fin: date
    estado: str = "planificado"

class ProgramaAuditoriaResponse(BaseModel):
    id: UUID
    titulo: str
    objetivos: str
    alcance: str
    fecha_inicio: date
    fecha_fin: date
    estado: str
    tenant_id: UUID

    class Config:
        from_attributes = True

# Asignaciones de Auditoría (auditor líder -> auditor de campo)
class AuditoriaAsignacionCreate(BaseModel):
    programa_id: UUID
    auditor_id: UUID
    area: str = Field(..., max_length=255)
    fecha_programada: date
    notas: Optional[str] = None

class AuditoriaAsignacionUpdate(BaseModel):
    estado: Optional[str] = Field(None, description="asignada, en_progreso, completada")
    area: Optional[str] = Field(None, max_length=255)
    fecha_programada: Optional[date] = None
    notas: Optional[str] = None

class AuditoriaAsignacionResponse(BaseModel):
    id: UUID
    programa_id: UUID
    programa_titulo: Optional[str] = None
    auditor_id: UUID
    auditor_nombre: str
    auditor_email: str
    area: str
    fecha_programada: date
    estado: str
    notas: Optional[str] = None
    tenant_id: UUID

    class Config:
        from_attributes = True

# Hallazgos de Auditoría
class AuditoriaHallazgoCreate(BaseModel):
    descripcion: str
    clasificacion: str = Field(..., description="no_conformidad_mayor, no_conformidad_menor, observacion, oportunidad")
    clausula_referencia: str = Field(..., max_length=100)
    estado: str = "abierto"
    programa_id: UUID

class AuditoriaHallazgoResponse(BaseModel):
    id: UUID
    descripcion: str
    clasificacion: str
    clausula_referencia: str
    estado: str
    programa_id: UUID
    tenant_id: UUID

    class Config:
        from_attributes = True
