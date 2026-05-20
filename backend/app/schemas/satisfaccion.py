from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from uuid import UUID

# Preguntas de Encuesta
class PreguntaEncuestaBase(BaseModel):
    pregunta_texto: str
    calificacion: Optional[int] = Field(None, ge=1, le=10)
    comentarios: Optional[str] = None

class PreguntaEncuestaCreate(PreguntaEncuestaBase):
    pass

class PreguntaEncuestaResponse(PreguntaEncuestaBase):
    id: UUID
    encuesta_id: UUID
    tenant_id: UUID

    class Config:
        from_attributes = True


# Encuestas de Satisfacción
class EncuestaSatisfaccionBase(BaseModel):
    codigo: str
    cliente_nombre: str
    comentarios_generales: Optional[str] = None

class EncuestaSatisfaccionCreate(EncuestaSatisfaccionBase):
    preguntas: List[str] = Field(..., description="Lista de textos para inicializar las preguntas de la encuesta")

class EncuestaSatisfaccionResponse(EncuestaSatisfaccionBase):
    id: UUID
    fecha_envio: datetime
    fecha_respuesta: Optional[datetime] = None
    estado: str  # enviada, respondida, archivada
    tenant_id: UUID
    preguntas: List[PreguntaEncuestaResponse] = []

    class Config:
        from_attributes = True


# Registrar Respuestas de una Encuesta
class PreguntaRespuesta(BaseModel):
    pregunta_id: UUID
    calificacion: int = Field(..., ge=1, le=10)
    comentarios: Optional[str] = None

class EncuestaResponder(BaseModel):
    comentarios_generales: Optional[str] = None
    respuestas: List[PreguntaRespuesta]
