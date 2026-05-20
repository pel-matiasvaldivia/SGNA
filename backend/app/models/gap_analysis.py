import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, ForeignKey, Date, Text, ARRAY
from sqlalchemy.dialects.postgresql import UUID
from app.models.base_class import Base

class Diagnostico(Base):
    __tablename__ = "diagnosticos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre = Column(String(255), nullable=False)
    normas_incluidas = Column(ARRAY(String), nullable=False)
    estado = Column(String(30), default="en_progreso", nullable=False)  # en_progreso, cerrado
    auditor_responsable_id = Column(UUID(as_uuid=True), ForeignKey("public.users.id", ondelete="SET NULL"), nullable=True)
    fecha_inicio = Column(Date, default=lambda: datetime.now(timezone.utc).date(), nullable=False)
    fecha_cierre = Column(Date, nullable=True)
    observaciones_generales = Column(Text, nullable=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("public.tenants.id", ondelete="CASCADE"), nullable=False, index=True)


class DiagnosticoItem(Base):
    __tablename__ = "diagnostico_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    diagnostico_id = Column(UUID(as_uuid=True), ForeignKey("diagnosticos.id", ondelete="CASCADE"), nullable=False, index=True)
    norma = Column(String(20), nullable=False)
    clausula = Column(String(20), nullable=False)
    clausula_descripcion = Column(String(500), nullable=True)
    pregunta = Column(Text, nullable=False)
    estado = Column(String(30), nullable=True)  # cumple, cumple_parcialmente, no_cumple, no_aplica
    observacion = Column(Text, nullable=True)
    evidencia_documento_id = Column(UUID(as_uuid=True), ForeignKey("documentos.id", ondelete="SET NULL"), nullable=True)
    responsable_id = Column(UUID(as_uuid=True), ForeignKey("public.users.id", ondelete="SET NULL"), nullable=True)
    prioridad = Column(String(10), default="media", nullable=False)  # alta, media, baja
