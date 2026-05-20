from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime
from uuid import UUID

# FODA / PESTEL
class FodaPestelItemCreate(BaseModel):
    tipo: str = Field(..., description="fortaleza, debilidad, oportunidad, amenaza, politico, economico, social, tecnologico, ecologico, legal")
    descripcion: str

class FodaPestelItemResponse(BaseModel):
    id: UUID
    tipo: str
    descripcion: str
    tenant_id: UUID

    class Config:
        from_attributes = True

# Partes Interesadas
class ParteInteresadaCreate(BaseModel):
    nombre: str = Field(..., max_length=255)
    tipo: str = Field(..., max_length=100)
    necesidades: str
    expectativas: str
    pertinente: bool = True
    influencia: str = "media"
    interes: str = "medio"
    requisitos_legales: Optional[str] = None

class ParteInteresadaResponse(BaseModel):
    id: UUID
    nombre: str
    tipo: str
    necesidades: str
    expectativas: str
    pertinente: bool
    influencia: str
    interes: str
    requisitos_legales: Optional[str] = None
    tenant_id: UUID

    class Config:
        from_attributes = True

# Alcance SGI
class AlcanceSGICreate(BaseModel):
    declaracion: str
    exclusiones_justificacion: Optional[str] = None
    version: str = "1.0"
    estado: str = "borrador"

class AlcanceSGIResponse(BaseModel):
    id: UUID
    declaracion: str
    exclusiones_justificacion: Optional[str] = None
    version: str
    estado: str
    aprobado_por_id: Optional[UUID] = None
    fecha_aprobacion: Optional[datetime] = None
    tenant_id: UUID

    class Config:
        from_attributes = True

# Requisitos Legales
class RequisitoLegalCreate(BaseModel):
    nombre: str = Field(..., max_length=255)
    numero: str = Field(..., max_length=100)
    organismo_emisor: str = Field(..., max_length=255)
    fecha_publicacion: Optional[date] = None
    proceso_aplicable: Optional[str] = None
    estado_cumplimiento: str = "cumple"
    evidencia_s3_key: Optional[str] = None

class RequisitoLegalResponse(BaseModel):
    id: UUID
    nombre: str
    numero: str
    organismo_emisor: str
    fecha_publicacion: Optional[date] = None
    proceso_aplicable: Optional[str] = None
    estado_cumplimiento: str
    evidencia_s3_key: Optional[str] = None
    tenant_id: UUID

    class Config:
        from_attributes = True
