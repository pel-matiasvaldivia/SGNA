import uuid
from sqlalchemy import Column, String, ForeignKey, Date, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
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


class AuditoriaAsignacion(Base):
    """
    Asignación de una auditoría (o sector auditable) del programa a un auditor de
    campo. La crea el auditor líder desde la consola web; el auditor asignado la ve
    en "Mis auditorías" y la ejecutará —en fases posteriores— desde la app móvil.

    El auditor referenciado vive en public.users; guardamos también un snapshot de
    su nombre/correo para poder listar la asignación sin resolver un join
    cross-schema en cada respuesta.
    """
    __tablename__ = "auditorias_asignaciones"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    programa_id = Column(UUID(as_uuid=True), ForeignKey("programas_auditoria.id", ondelete="CASCADE"), nullable=False, index=True)
    auditor_id = Column(UUID(as_uuid=True), ForeignKey("public.users.id", ondelete="CASCADE"), nullable=False, index=True)
    auditor_nombre = Column(String(255), nullable=False)  # snapshot para listado
    auditor_email = Column(String(255), nullable=False)   # snapshot para listado
    area = Column(String(255), nullable=False)            # sector / proceso auditado
    fecha_programada = Column(Date, nullable=False)
    estado = Column(String(30), default="asignada", nullable=False)  # asignada, en_progreso, completada
    notas = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
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
