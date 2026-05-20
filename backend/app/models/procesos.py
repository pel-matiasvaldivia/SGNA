import uuid
from sqlalchemy import Column, String, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from app.models.base_class import Base

class ProcesoBPM(Base):
    __tablename__ = "procesos_bpm"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre = Column(String(255), nullable=False)
    codigo = Column(String(50), nullable=False)
    tipo = Column(String(30), nullable=False)  # estrategico, operativo, soporte
    responsable_id = Column(UUID(as_uuid=True), ForeignKey("public.users.id", ondelete="SET NULL"), nullable=True)
    entradas = Column(Text, nullable=True)
    proveedores = Column(Text, nullable=True)
    salidas = Column(Text, nullable=True)
    clientes = Column(Text, nullable=True)
    recursos = Column(Text, nullable=True)
    controles = Column(Text, nullable=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("public.tenants.id", ondelete="CASCADE"), nullable=False, index=True)
