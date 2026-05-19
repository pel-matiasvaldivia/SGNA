import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base_class import Base

class NonConformity(Base):
    __tablename__ = "non_conformities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False, index=True)
    description = Column(String, nullable=False)
    origin = Column(String, nullable=False)  # auditoria, interno, externo
    estado = Column(String, default="abierta", nullable=False)  # abierta, analizada, resuelta, cerrada
    fecha_deteccion = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    
    creado_por_id = Column(UUID(as_uuid=True), ForeignKey("public.users.id", ondelete="SET NULL"), nullable=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("public.tenants.id", ondelete="CASCADE"), nullable=False, index=True)

    # Relationships
    creado_por = relationship("User", foreign_keys=[creado_por_id])
    corrective_actions = relationship("CorrectiveAction", back_populates="non_conformity", cascade="all, delete-orphan")


class CorrectiveAction(Base):
    __tablename__ = "corrective_actions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    non_conformity_id = Column(UUID(as_uuid=True), ForeignKey("non_conformities.id", ondelete="CASCADE"), nullable=False, index=True)
    descripcion = Column(String, nullable=False)
    analisis_causa_raiz = Column(String, nullable=True)  # Metodologia 5 Porques, Ishikawa, etc.
    fecha_planificada = Column(DateTime, nullable=False)
    fecha_implementacion = Column(DateTime, nullable=True)
    
    responsable_id = Column(UUID(as_uuid=True), ForeignKey("public.users.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    non_conformity = relationship("NonConformity", back_populates="corrective_actions")
    responsable = relationship("User")
