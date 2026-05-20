import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, ForeignKey, DateTime, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base_class import Base

class EquipoMedicion(Base):
    __tablename__ = "equipos_medicion"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    codigo = Column(String(50), nullable=False)
    nombre = Column(String(255), nullable=False)
    marca = Column(String(100), nullable=True)
    modelo = Column(String(100), nullable=True)
    numero_serie = Column(String(100), nullable=True)
    ubicacion = Column(String(100), nullable=True)
    frecuencia_calibracion_meses = Column(Integer, default=12, nullable=False)  # Intervalo de calibración
    fecha_ultima_calibracion = Column(DateTime, nullable=True)
    fecha_proxima_calibracion = Column(DateTime, nullable=True)
    estado = Column(String(30), default="operativo", nullable=False)  # operativo, vencido, fuera_servicio
    responsable_id = Column(UUID(as_uuid=True), ForeignKey("public.users.id", ondelete="SET NULL"), nullable=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("public.tenants.id", ondelete="CASCADE"), nullable=False, index=True)

    # Relationships
    responsable = relationship("User")
    calibraciones = relationship("RegistroCalibracion", back_populates="equipo", cascade="all, delete-orphan")


class RegistroCalibracion(Base):
    __tablename__ = "registros_calibracion"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    equipo_id = Column(UUID(as_uuid=True), ForeignKey("equipos_medicion.id", ondelete="CASCADE"), nullable=False)
    fecha_calibracion = Column(DateTime, nullable=False)
    resultado = Column(String(30), default="aprobado", nullable=False)  # aprobado, rechazado
    patron_utilizado = Column(String(255), nullable=True)
    certificado_documento_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    realizado_por = Column(String(255), nullable=False)  # Interno o Laboratorio Externo
    comentarios = Column(Text, nullable=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("public.tenants.id", ondelete="CASCADE"), nullable=False, index=True)

    # Relationships
    equipo = relationship("EquipoMedicion", back_populates="calibraciones")
    certificado = relationship("Document")
