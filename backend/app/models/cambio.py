import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, ForeignKey, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base_class import Base

class ControlCambio(Base):
    __tablename__ = "control_cambios"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    codigo = Column(String(50), nullable=False)
    titulo = Column(String(255), nullable=False)
    descripcion = Column(Text, nullable=False)
    motivo = Column(Text, nullable=False)  # Justificación del cambio
    impacto_sgi = Column(String(20), default="bajo", nullable=False)  # alto, medio, bajo
    recursos_requeridos = Column(Text, nullable=True)
    estado = Column(String(30), default="propuesto", nullable=False)  # propuesto, en_analisis, aprobado, ejecutado, cancelado
    fecha_propuesta = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    fecha_limite = Column(DateTime, nullable=True)
    solicitante_id = Column(UUID(as_uuid=True), ForeignKey("public.users.id", ondelete="SET NULL"), nullable=True)
    aprobador_id = Column(UUID(as_uuid=True), ForeignKey("public.users.id", ondelete="SET NULL"), nullable=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("public.tenants.id", ondelete="CASCADE"), nullable=False, index=True)

    # Relationships
    solicitante = relationship("User", foreign_keys=[solicitante_id])
    aprobador = relationship("User", foreign_keys=[aprobador_id])
    acciones = relationship("ItemAccionCambio", back_populates="cambio", cascade="all, delete-orphan")


class ItemAccionCambio(Base):
    __tablename__ = "items_accion_cambio"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cambio_id = Column(UUID(as_uuid=True), ForeignKey("control_cambios.id", ondelete="CASCADE"), nullable=False)
    descripcion = Column(String(255), nullable=False)
    responsable_id = Column(UUID(as_uuid=True), ForeignKey("public.users.id", ondelete="SET NULL"), nullable=True)
    fecha_limite = Column(DateTime, nullable=False)
    fecha_ejecucion = Column(DateTime, nullable=True)
    estado = Column(String(30), default="pendiente", nullable=False)  # pendiente, completado
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("public.tenants.id", ondelete="CASCADE"), nullable=False, index=True)

    # Relationships
    cambio = relationship("ControlCambio", back_populates="acciones")
    responsable = relationship("User")
