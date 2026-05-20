import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, ForeignKey, Date, Numeric, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base_class import Base

class Proveedor(Base):
    __tablename__ = "proveedores"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    razon_social = Column(String(255), nullable=False)
    rut_tax_id = Column(String(50), nullable=False)
    contacto_nombre = Column(String(255), nullable=True)
    contacto_email = Column(String(255), nullable=True)
    contacto_telefono = Column(String(50), nullable=True)
    categoria = Column(String(50), default="critico")  # critico, estrategico, soporte
    estado = Column(String(50), default="prospecto")  # prospecto, evaluado, homologado, suspendido
    calificacion_promedio = Column(Numeric(5, 2), default=0.00)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("public.tenants.id", ondelete="CASCADE"), nullable=False, index=True)

    evaluaciones = relationship("EvaluacionProveedor", back_populates="proveedor", cascade="all, delete-orphan")
    reclamos = relationship("ReclamoProveedor", back_populates="proveedor", cascade="all, delete-orphan")

class EvaluacionProveedor(Base):
    __tablename__ = "proveedor_evaluaciones"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    proveedor_id = Column(UUID(as_uuid=True), ForeignKey("proveedores.id", ondelete="CASCADE"), nullable=False)
    fecha_evaluacion = Column(Date, nullable=False)
    criterio_calidad = Column(Integer, nullable=False)  # 1-100
    criterio_entrega = Column(Integer, nullable=False)  # 1-100
    criterio_servicio = Column(Integer, nullable=False)  # 1-100
    criterio_cumplimiento = Column(Integer, nullable=False)  # 1-100
    puntaje_global = Column(Numeric(5, 2), nullable=False)  # weighted global score
    resultado = Column(String(50), nullable=False)  # aprobado, condicional, rechazado
    comentarios = Column(Text, nullable=True)
    evaluador_id = Column(UUID(as_uuid=True), ForeignKey("public.users.id", ondelete="SET NULL"), nullable=True)
    evidencia_documento_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("public.tenants.id", ondelete="CASCADE"), nullable=False, index=True)

    proveedor = relationship("Proveedor", back_populates="evaluaciones")
    evaluador = relationship("User")
    evidencia = relationship("Document")

class ReclamoProveedor(Base):
    __tablename__ = "proveedor_reclamos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    proveedor_id = Column(UUID(as_uuid=True), ForeignKey("proveedores.id", ondelete="CASCADE"), nullable=False)
    codigo = Column(String(50), nullable=False)
    descripcion_desvio = Column(Text, nullable=False)
    fecha_reclamo = Column(Date, nullable=False)
    estado = Column(String(30), default="abierto")  # abierto, respondido, cerrado
    solucion_propuesta = Column(Text, nullable=True)
    comentarios_cierre = Column(Text, nullable=True)
    fecha_cierre = Column(Date, nullable=True)
    non_conformity_id = Column(UUID(as_uuid=True), ForeignKey("non_conformities.id", ondelete="SET NULL"), nullable=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("public.tenants.id", ondelete="CASCADE"), nullable=False, index=True)

    proveedor = relationship("Proveedor", back_populates="reclamos")
    non_conformity = relationship("NonConformity")
