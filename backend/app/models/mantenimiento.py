import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, ForeignKey, DateTime, Text, Integer, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base_class import Base

class ActivoInfraestructura(Base):
    __tablename__ = "cmms_activos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    codigo = Column(String(50), nullable=False)
    nombre = Column(String(255), nullable=False)
    tipo = Column(String(100), nullable=False) # maquinaria, hvac, vehiculo, instalacion_electrica
    ubicacion = Column(String(255), nullable=True)
    criticidad = Column(String(20), default="media", nullable=False) # alta, media, baja
    estado = Column(String(30), default="operativo", nullable=False) # operativo, mantenimiento, fuera_servicio
    fabricante = Column(String(100), nullable=True)
    fecha_adquisicion = Column(DateTime, nullable=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("public.tenants.id", ondelete="CASCADE"), nullable=False, index=True)

class OrdenTrabajoMantenimiento(Base):
    __tablename__ = "cmms_ordenes_trabajo"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    activo_id = Column(UUID(as_uuid=True), ForeignKey("cmms_activos.id", ondelete="CASCADE"), nullable=False)
    tipo_mantenimiento = Column(String(50), nullable=False) # preventivo, correctivo, predictivo
    descripcion_falla = Column(Text, nullable=False)
    fecha_solicitud = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    fecha_programada = Column(DateTime, nullable=True)
    fecha_completada = Column(DateTime, nullable=True)
    estado = Column(String(50), default="pendiente", nullable=False) # pendiente, en_progreso, completado, cancelado
    costo_estimado = Column(Float, nullable=True)
    responsable_id = Column(UUID(as_uuid=True), ForeignKey("public.users.id", ondelete="SET NULL"), nullable=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("public.tenants.id", ondelete="CASCADE"), nullable=False, index=True)
