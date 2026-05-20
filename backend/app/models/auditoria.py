import uuid
from sqlalchemy import Column, String, ForeignKey, Date, Text
from sqlalchemy.dialects.postgresql import UUID
from app.models.base_class import Base

class ProgramaAuditoria(Base):
    __tablename__ = "programas_auditoria"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    titulo = Column(String(255), nullable=False)
    objetivos = Column(Text, nullable=False)
    alcance = Column(Text, nullable=False)
    fecha_inicio = Column(Date, nullable=False)
    fecha_fin = Column(Date, nullable=False)
    estado = Column(String(30), default="planificado", nullable=False)  # planificado, en_progreso, cerrado
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("public.tenants.id", ondelete="CASCADE"), nullable=False, index=True)


class AuditoriaHallazgo(Base):
    __tablename__ = "auditorias_hallazgos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    descripcion = Column(Text, nullable=False)
    clasificacion = Column(String(50), nullable=False)  # no_conformidad_mayor, no_conformidad_menor, observacion, oportunidad
    clausula_referencia = Column(String(100), nullable=False)  # Ej: ISO 9001 Cláusula 9.2
    estado = Column(String(30), default="abierto", nullable=False)  # abierto, en_tratamiento, cerrado
    programa_id = Column(UUID(as_uuid=True), ForeignKey("programas_auditoria.id", ondelete="CASCADE"), nullable=False, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("public.tenants.id", ondelete="CASCADE"), nullable=False, index=True)
