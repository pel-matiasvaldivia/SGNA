from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from uuid import UUID

# Competencias
class CompetenciaColaboradorBase(BaseModel):
    colaborador_id: UUID
    competencia_nombre: str
    nivel_requerido: int = Field(3, ge=1, le=5)
    nivel_actual: int = Field(3, ge=1, le=5)
    comentarios: Optional[str] = None

class CompetenciaColaboradorCreate(CompetenciaColaboradorBase):
    pass

class CompetenciaColaboradorUpdate(BaseModel):
    competencia_nombre: Optional[str] = None
    nivel_requerido: Optional[int] = Field(None, ge=1, le=5)
    nivel_actual: Optional[int] = Field(None, ge=1, le=5)
    comentarios: Optional[str] = None

class CompetenciaColaboradorResponse(CompetenciaColaboradorBase):
    id: UUID
    tenant_id: UUID

    class Config:
        from_attributes = True


# Asistentes de Capacitación
class AsistenteCapacitacionBase(BaseModel):
    colaborador_id: UUID
    asistio: bool = False
    evaluacion_puntaje: Optional[int] = Field(None, ge=0, le=100)
    comentarios: Optional[str] = None
    certificado_documento_id: Optional[UUID] = None

class AsistenteCapacitacionCreate(BaseModel):
    colaborador_id: UUID

class AsistenteCapacitacionEvaluate(BaseModel):
    asistio: bool
    evaluacion_puntaje: Optional[int] = Field(None, ge=0, le=100)
    comentarios: Optional[str] = None
    certificado_documento_id: Optional[UUID] = None

class AsistenteCapacitacionResponse(AsistenteCapacitacionBase):
    id: UUID
    capacitacion_id: UUID
    tenant_id: UUID

    class Config:
        from_attributes = True


# Planes de Capacitación
class PlanCapacitacionBase(BaseModel):
    codigo: str
    tema: str
    descripcion: Optional[str] = None
    fecha_planificada: datetime
    duracion_horas: int = Field(1, ge=1)
    facilitador: Optional[str] = None

class PlanCapacitacionCreate(PlanCapacitacionBase):
    pass

class PlanCapacitacionUpdate(BaseModel):
    codigo: Optional[str] = None
    tema: Optional[str] = None
    descripcion: Optional[str] = None
    fecha_planificada: Optional[datetime] = None
    duracion_horas: Optional[int] = Field(None, ge=1)
    facilitador: Optional[str] = None
    estado: Optional[str] = None  # planificado, en_curso, completado, cancelado

class PlanCapacitacionResponse(PlanCapacitacionBase):
    id: UUID
    estado: str
    tenant_id: UUID
    asistentes: List[AsistenteCapacitacionResponse] = []

    class Config:
        from_attributes = True
