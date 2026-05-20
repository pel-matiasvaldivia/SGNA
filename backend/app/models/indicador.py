import uuid
from sqlalchemy import Column, String, ForeignKey, Text, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base_class import Base

class IndicadorKPI(Base):
    __tablename__ = "indicadores_kpi"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    codigo = Column(String(50), nullable=False)
    nombre = Column(String(255), nullable=False)
    formula = Column(String(255), nullable=False)
    meta = Column(Float, nullable=False)
    unidad = Column(String(20), default="%", nullable=False)
    frecuencia = Column(String(50), default="mensual", nullable=False)
    responsable_id = Column(UUID(as_uuid=True), ForeignKey("public.users.id", ondelete="SET NULL"), nullable=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("public.tenants.id", ondelete="CASCADE"), nullable=False, index=True)

    mediciones = relationship("IndicadorMedicion", back_populates="indicador", cascade="all, delete-orphan")

class IndicadorMedicion(Base):
    __tablename__ = "indicadores_mediciones"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    indicador_id = Column(UUID(as_uuid=True), ForeignKey("indicadores_kpi.id", ondelete="CASCADE"), nullable=False)
    periodo = Column(String(20), nullable=False)  # Ej: "2026-05"
    valor_real = Column(Float, nullable=False)
    comentarios = Column(Text, nullable=True)
    registrado_por_id = Column(UUID(as_uuid=True), ForeignKey("public.users.id", ondelete="SET NULL"), nullable=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("public.tenants.id", ondelete="CASCADE"), nullable=False, index=True)

    indicador = relationship("IndicadorKPI", back_populates="mediciones")
