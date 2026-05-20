import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, ForeignKey, DateTime, Text, Integer, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base_class import Base

class IncidenteSST(Base):
    __tablename__ = "sst_incidentes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tipo = Column(String(50), nullable=False) # accidente_fatal, accidente_con_tiempo_perdido, casi_accidente, acto_inseguro, condicion_insegura
    gravedad = Column(String(20), default="baja", nullable=False) # critica, alta, media, baja
    descripcion = Column(Text, nullable=False)
    fecha_incidente = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    ubicacion = Column(String(255), nullable=True)
    personas_involucradas = Column(Text, nullable=True)
    estado_investigacion = Column(String(50), default="reportado", nullable=False) # reportado, en_investigacion, plan_accion, cerrado
    reportado_por_id = Column(UUID(as_uuid=True), ForeignKey("public.users.id", ondelete="SET NULL"), nullable=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("public.tenants.id", ondelete="CASCADE"), nullable=False, index=True)

class InspeccionSST(Base):
    __tablename__ = "sst_inspecciones"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    titulo = Column(String(255), nullable=False)
    tipo_inspeccion = Column(String(100), nullable=False) # epp, extintores, maquinaria, ergonomia
    fecha_inspeccion = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    porcentaje_cumplimiento = Column(Float, default=0.0)
    hallazgos_criticos = Column(Text, nullable=True)
    auditor_id = Column(UUID(as_uuid=True), ForeignKey("public.users.id", ondelete="SET NULL"), nullable=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("public.tenants.id", ondelete="CASCADE"), nullable=False, index=True)
