from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime
from uuid import UUID


# Plantillas de checklist reutilizables
class PlantillaChecklistItem(BaseModel):
    clausula: str = Field("", max_length=100)
    pregunta: str
    orden: Optional[int] = 0

class PlantillaChecklistCreate(BaseModel):
    nombre: str = Field(..., max_length=255)
    descripcion: Optional[str] = None
    categoria: Optional[str] = Field(None, max_length=100)
    items: List[PlantillaChecklistItem] = []

class PlantillaChecklistResponse(BaseModel):
    id: UUID
    nombre: str
    descripcion: Optional[str] = None
    categoria: Optional[str] = None
    items: List[PlantillaChecklistItem] = []
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class GuardarComoPlantillaRequest(BaseModel):
    nombre: str = Field(..., max_length=255)
    descripcion: Optional[str] = None
    categoria: Optional[str] = Field(None, max_length=100)


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
    norma: Optional[str] = Field(None, max_length=50, description="Aplica plantilla de checklist si coincide (ISO 9001, 14001, 45001, 27001)")
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
    norma: Optional[str] = None
    fecha_programada: date
    estado: str
    notas: Optional[str] = None
    firma_url: Optional[str] = None
    firmado_por: Optional[str] = None
    firmado_at: Optional[datetime] = None
    tenant_id: UUID
    total_puntos: Optional[int] = None
    puntos_respondidos: Optional[int] = None

    class Config:
        from_attributes = True


# Puntos de control (checklist) y respuestas
class RespuestaControlUpsert(BaseModel):
    resultado: str = Field(..., description="conforme, no_conforme, na")
    nota: Optional[str] = None
    foto_url: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    client_uuid: Optional[UUID] = None  # idempotencia offline (Fase 3)

class RespuestaControlResponse(BaseModel):
    id: UUID
    punto_id: UUID
    resultado: str
    nota: Optional[str] = None
    foto_url: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    respondido_at: Optional[datetime] = None
    nc_id: Optional[UUID] = None

    class Config:
        from_attributes = True

class PuntoControlCreate(BaseModel):
    clausula: str = Field(..., max_length=100)
    pregunta: str
    orden: Optional[int] = 0

class PuntoControlResponse(BaseModel):
    id: UUID
    asignacion_id: UUID
    clausula: str
    pregunta: str
    tipo_resp: str
    orden: int
    respuesta: Optional[RespuestaControlResponse] = None

    class Config:
        from_attributes = True

class AplicarPlantillaRequest(BaseModel):
    norma: str = Field(..., description="ISO 9001, ISO 14001, ISO 45001, ISO 27001")
    reemplazar: bool = Field(False, description="Si true, elimina los puntos existentes antes de aplicar")


# Reporte consolidado de la auditoría (para la vista imprimible / PDF)
class ReporteHallazgoNC(BaseModel):
    nc_id: UUID
    clausula: str
    titulo: str
    estado: str

class ReporteResumen(BaseModel):
    total: int
    conforme: int
    no_conforme: int
    na: int
    sin_responder: int

class ReporteAuditoria(BaseModel):
    asignacion: AuditoriaAsignacionResponse
    firma_download_url: Optional[str] = None
    resumen: ReporteResumen
    puntos: List[PuntoControlResponse]
    no_conformidades: List[ReporteHallazgoNC] = []

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
