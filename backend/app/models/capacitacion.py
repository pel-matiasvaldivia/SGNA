import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, ForeignKey, DateTime, Integer, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base_class import Base

class PlanCapacitacion(Base):
    __tablename__ = "planes_capacitacion"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    codigo = Column(String(50), nullable=False)
    tema = Column(String(255), nullable=False)
    descripcion = Column(Text, nullable=True)
    fecha_planificada = Column(DateTime, nullable=False)
    duracion_horas = Column(Integer, default=1, nullable=False)
    facilitador = Column(String(255), nullable=True)
    estado = Column(String(30), default="planificado", nullable=False)  # planificado, en_curso, completado, cancelado
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("public.tenants.id", ondelete="CASCADE"), nullable=False, index=True)

    # Relationships
    asistentes = relationship("AsistenteCapacitacion", back_populates="capacitacion", cascade="all, delete-orphan")


class AsistenteCapacitacion(Base):
    __tablename__ = "asistentes_capacitacion"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    capacitacion_id = Column(UUID(as_uuid=True), ForeignKey("planes_capacitacion.id", ondelete="CASCADE"), nullable=False)
    colaborador_id = Column(UUID(as_uuid=True), ForeignKey("public.users.id", ondelete="SET NULL"), nullable=True)
    asistio = Column(Boolean, default=False, nullable=False)
    evaluacion_puntaje = Column(Integer, nullable=True)  # 0-100
    comentarios = Column(Text, nullable=True)
    certificado_documento_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("public.tenants.id", ondelete="CASCADE"), nullable=False, index=True)

    # Relationships
    capacitacion = relationship("PlanCapacitacion", back_populates="asistentes")
    colaborador = relationship("User")
    certificado = relationship("Document")


class CompetenciaColaborador(Base):
    __tablename__ = "competencias_colaboradores"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    colaborador_id = Column(UUID(as_uuid=True), ForeignKey("public.users.id", ondelete="CASCADE"), nullable=False)
    competencia_nombre = Column(String(100), nullable=False)  # ej: ISO 9001:2015, Auditor, Seguridad
    nivel_requerido = Column(Integer, default=3, nullable=False)  # 1-5
    nivel_actual = Column(Integer, default=3, nullable=False)  # 1-5
    comentarios = Column(Text, nullable=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("public.tenants.id", ondelete="CASCADE"), nullable=False, index=True)

    # Relationships
    colaborador = relationship("User")
