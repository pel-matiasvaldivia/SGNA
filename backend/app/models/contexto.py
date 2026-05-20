import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, ForeignKey, Date, Text, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from app.models.base_class import Base

class FodaPestelItem(Base):
    __tablename__ = "foda_pestel"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tipo = Column(String(30), nullable=False)  # fortaleza, debilidad, oportunidad, amenaza, politico, economico, social, tecnologico, ecologico, legal
    descripcion = Column(Text, nullable=False)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("public.tenants.id", ondelete="CASCADE"), nullable=False, index=True)


class ParteInteresada(Base):
    __tablename__ = "partes_interesadas"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre = Column(String(255), nullable=False)
    tipo = Column(String(100), nullable=False)  # cliente, proveedor, regulador, comunidad, etc.
    necesidades = Column(Text, nullable=False)
    expectativas = Column(Text, nullable=False)
    pertinente = Column(Boolean, default=True, nullable=False)
    influencia = Column(String(20), default="media", nullable=False)  # alta, media, baja
    interes = Column(String(20), default="medio", nullable=False)  # alto, medio, bajo
    requisitos_legales = Column(Text, nullable=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("public.tenants.id", ondelete="CASCADE"), nullable=False, index=True)


class AlcanceSGI(Base):
    __tablename__ = "alcance_sgi"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    declaracion = Column(Text, nullable=False)
    exclusiones_justificacion = Column(Text, nullable=True)
    version = Column(String(20), default="1.0", nullable=False)
    estado = Column(String(30), default="borrador", nullable=False)  # borrador, aprobado, obsoleto
    aprobado_por_id = Column(UUID(as_uuid=True), ForeignKey("public.users.id", ondelete="SET NULL"), nullable=True)
    fecha_aprobacion = Column(DateTime, nullable=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("public.tenants.id", ondelete="CASCADE"), nullable=False, index=True)


class RequisitoLegal(Base):
    __tablename__ = "requisitos_legales"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre = Column(String(255), nullable=False)
    numero = Column(String(100), nullable=False)
    organismo_emisor = Column(String(255), nullable=False)
    fecha_publicacion = Column(Date, nullable=True)
    proceso_aplicable = Column(String(255), nullable=True)
    estado_cumplimiento = Column(String(50), default="cumple", nullable=False)  # cumple, en_proceso, no_cumple
    evidencia_s3_key = Column(String(500), nullable=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("public.tenants.id", ondelete="CASCADE"), nullable=False, index=True)
