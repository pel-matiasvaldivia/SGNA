import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, ForeignKey, Date, Numeric, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base_class import Base

class EmisionCarbono(Base):
    __tablename__ = "emisiones_carbono"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    periodo = Column(Date, nullable=False)  # Fecha base del mes/año
    alcance = Column(Integer, nullable=False)  # 1, 2, 3
    categoria = Column(String(100), nullable=False)  # Combustión Fija, Combustión Móvil, Electricidad, etc.
    subcategoria = Column(String(100), nullable=True)  # Combustible, Red Eléctrica, etc.
    fuente = Column(String(255), nullable=False)  # Planta A, Generador 2, etc.
    
    cantidad = Column(Numeric(15, 4), nullable=False)
    unidad = Column(String(20), nullable=False)  # Litros, kWh, kg, etc.
    factor_emision = Column(Numeric(12, 6), nullable=False)  # kg CO2e o tCO2e por unidad
    co2_equivalente = Column(Numeric(15, 4), nullable=False)  # Guardado en Toneladas de CO2e (tCO2e)
    
    evidencia_documento_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    notas = Column(Text, nullable=True)
    
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("public.users.id", ondelete="SET NULL"), nullable=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("public.tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    evidencia = relationship("Document")
    created_by = relationship("User")
