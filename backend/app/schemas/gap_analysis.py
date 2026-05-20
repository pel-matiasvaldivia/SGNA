from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date
from uuid import UUID

class DiagnosticoCreate(BaseModel):
    nombre: str = Field(..., max_length=255)
    normas_incluidas: List[str]

class DiagnosticoItemResponse(BaseModel):
    id: UUID
    diagnostico_id: UUID
    norma: str
    clausula: str
    clausula_descripcion: Optional[str] = None
    pregunta: str
    estado: Optional[str] = None
    observacion: Optional[str] = None
    evidencia_documento_id: Optional[UUID] = None
    responsable_id: Optional[UUID] = None
    prioridad: str

    class Config:
        from_attributes = True

class DiagnosticoResponse(BaseModel):
    id: UUID
    nombre: str
    normas_incluidas: List[str]
    estado: str
    auditor_responsable_id: Optional[UUID] = None
    fecha_inicio: date
    fecha_cierre: Optional[date] = None
    observaciones_generales: Optional[str] = None
    tenant_id: UUID

    class Config:
        from_attributes = True

class DiagnosticoDetailResponse(DiagnosticoResponse):
    items: List[DiagnosticoItemResponse] = []

class DiagnosticoItemUpdate(BaseModel):
    estado: Optional[str] = None
    observacion: Optional[str] = None
    evidencia_documento_id: Optional[UUID] = None
    responsable_id: Optional[UUID] = None
    prioridad: Optional[str] = None

class GapAnalysisSummary(BaseModel):
    total_items: int
    cumple: int
    cumple_parcialmente: int
    no_cumple: int
    no_aplica: int
    evaluados: int
    porcentaje_cumplimiento: float
    clasificacion: str  # Critico, En desarrollo, Conforme
    color: str  # rojo, amarillo, verde
