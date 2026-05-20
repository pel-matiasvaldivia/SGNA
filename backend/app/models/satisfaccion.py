import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, ForeignKey, DateTime, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base_class import Base

class EncuestaSatisfaccion(Base):
    __tablename__ = "encuestas_satisfaccion"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    codigo = Column(String(50), nullable=False)
    cliente_nombre = Column(String(255), nullable=False)
    fecha_envio = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    fecha_respuesta = Column(DateTime, nullable=True)
    estado = Column(String(30), default="enviada", nullable=False)  # enviada, respondida, archivada
    comentarios_generales = Column(Text, nullable=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("public.tenants.id", ondelete="CASCADE"), nullable=False, index=True)

    # Relationships
    preguntas = relationship("PreguntaEncuesta", back_populates="encuesta", cascade="all, delete-orphan")


class PreguntaEncuesta(Base):
    __tablename__ = "preguntas_encuesta"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    encuesta_id = Column(UUID(as_uuid=True), ForeignKey("encuestas_satisfaccion.id", ondelete="CASCADE"), nullable=False)
    pregunta_texto = Column(String(255), nullable=False)
    calificacion = Column(Integer, nullable=True)  # 1-10 for NPS / CSAT scaling
    comentarios = Column(Text, nullable=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("public.tenants.id", ondelete="CASCADE"), nullable=False, index=True)

    # Relationships
    encuesta = relationship("EncuestaSatisfaccion", back_populates="preguntas")
