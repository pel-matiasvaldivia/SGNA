import uuid
from sqlalchemy import Column, String, ForeignKey, Date, Text, Float, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base_class import Base

class ObjetivoSGI(Base):
    __tablename__ = "objetivos_sgi"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre = Column(String(255), nullable=False)
    descripcion = Column(Text, nullable=False)
    meta = Column(Float, nullable=False)
    unidad = Column(String(20), default="%", nullable=False)
    indicador = Column(String(255), nullable=False)
    frecuencia = Column(String(50), default="mensual", nullable=False)
    responsable_id = Column(UUID(as_uuid=True), ForeignKey("public.users.id", ondelete="SET NULL"), nullable=True)
    fecha_limite = Column(Date, nullable=False)
    progreso = Column(Float, default=0.0, nullable=False)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("public.tenants.id", ondelete="CASCADE"), nullable=False, index=True)


class RiesgoOportunidad(Base):
    __tablename__ = "riesgos_oportunidades"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    descripcion = Column(Text, nullable=False)
    tipo = Column(String(20), nullable=False)  # riesgo, oportunidad
    origen = Column(String(255), nullable=True)
    probabilidad = Column(Integer, default=3, nullable=False)  # 1-5
    impacto = Column(Integer, default=3, nullable=False)  # 1-5
    probabilidad_residual = Column(Integer, default=3, nullable=False)  # 1-5
    impacto_residual = Column(Integer, default=3, nullable=False)  # 1-5
    acciones = Column(Text, nullable=True)
    responsable_id = Column(UUID(as_uuid=True), ForeignKey("public.users.id", ondelete="SET NULL"), nullable=True)
    estado = Column(String(30), default="identificado", nullable=False)  # identificado, mitigado, materializado
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("public.tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Enlaces de negocio
    proceso_id = Column(UUID(as_uuid=True), ForeignKey("procesos_bpm.id", ondelete="SET NULL"), nullable=True)
    evidencia_documento_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)

    # Relaciones de navegación
    proceso = relationship("ProcesoBPM")
    evidencia = relationship("Document")
