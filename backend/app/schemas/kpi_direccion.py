from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date
from uuid import UUID

# --- INDICADOR MEASUREMENTS ---
class IndicadorMedicionCreate(BaseModel):
    periodo: str = Field(..., description="Período de medición, ej: '2026-05'")
    valor_real: float
    comentarios: Optional[str] = None

class IndicadorMedicionResponse(BaseModel):
    id: UUID
    indicador_id: UUID
    periodo: str
    valor_real: float
    comentarios: Optional[str] = None
    registrado_por_id: Optional[UUID] = None
    tenant_id: UUID

    class Config:
        from_attributes = True

# --- KPI / INDICADORES ---
class IndicadorKPICreate(BaseModel):
    codigo: str = Field(..., max_length=50)
    nombre: str = Field(..., max_length=255)
    formula: str = Field(..., max_length=255, description="Fórmula explicativa, ej: '(A/B)*100'")
    meta: float
    unidad: str = "%"
    frecuencia: str = "mensual" # mensual, trimestral, semestral, anual

class IndicadorKPIUpdate(BaseModel):
    codigo: Optional[str] = None
    nombre: Optional[str] = None
    formula: Optional[str] = None
    meta: Optional[float] = None
    unidad: Optional[str] = None
    frecuencia: Optional[str] = None

class IndicadorKPIResponse(BaseModel):
    id: UUID
    codigo: str
    nombre: str
    formula: str
    meta: float
    unidad: str
    frecuencia: str
    responsable_id: Optional[UUID] = None
    tenant_id: UUID
    mediciones: List[IndicadorMedicionResponse] = []

    class Config:
        from_attributes = True

# --- MANAGEMENT REVIEWS / REVISIÓN DIRECCIÓN ---
class RevisionDireccionCreate(BaseModel):
    titulo: str = Field(..., max_length=255)
    fecha_reunion: date
    asistentes: str = Field(..., description="Nombres o correos de asistentes separados por comas")
    entradas_revision: str = Field(..., description="JSON estructurado o texto de los puntos tratados")
    decisiones_acuerdos: str

class RevisionDireccionUpdate(BaseModel):
    titulo: Optional[str] = None
    fecha_reunion: Optional[date] = None
    asistentes: Optional[str] = None
    entradas_revision: Optional[str] = None
    decisiones_acuerdos: Optional[str] = None
    estado: Optional[str] = None

class RevisionDireccionResponse(BaseModel):
    id: UUID
    titulo: str
    fecha_reunion: date
    asistentes: str
    entradas_revision: str
    decisiones_acuerdos: str
    estado: str
    firma_responsable_hash: Optional[str] = None
    tenant_id: UUID

    class Config:
        from_attributes = True

class RevisionDireccionClose(BaseModel):
    firma_email: str
