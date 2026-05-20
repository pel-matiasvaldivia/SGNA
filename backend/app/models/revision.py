import uuid
from sqlalchemy import Column, String, ForeignKey, Date, Text
from sqlalchemy.dialects.postgresql import UUID
from app.models.base_class import Base

class RevisionDireccion(Base):
    __tablename__ = "revisiones_direccion"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    titulo = Column(String(255), nullable=False)
    fecha_reunion = Column(Date, nullable=False)
    asistentes = Column(Text, nullable=False)  # Nombres/Emails separados por comas
    entradas_revision = Column(Text, nullable=False)  # JSON o Texto estructurado
    decisiones_acuerdos = Column(Text, nullable=False)
    estado = Column(String(30), default="planificada", nullable=False)  # planificada, cerrada
    firma_responsable_hash = Column(String(255), nullable=True)  # SHA-256 digital validation seal
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("public.tenants.id", ondelete="CASCADE"), nullable=False, index=True)
