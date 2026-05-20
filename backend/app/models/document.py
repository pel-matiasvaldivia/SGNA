import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base_class import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False, index=True)
    description = Column(String, nullable=True)
    type = Column(String, nullable=False)  # manual, procedimiento, evidencia, etc.
    status = Column(String, default="borrador", nullable=False)  # borrador, pendiente, aprobado, rechazado
    version_actual = Column(Integer, default=1, nullable=False)
    
    creator_id = Column(UUID(as_uuid=True), ForeignKey("public.users.id", ondelete="SET NULL"), nullable=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("public.tenants.id", ondelete="CASCADE"), nullable=False, index=True)

    # Relationships
    creator = relationship("User", foreign_keys=[creator_id])
    versions = relationship("DocumentVersion", back_populates="document", cascade="all, delete-orphan")
    approvals = relationship("DocumentApproval", back_populates="document", cascade="all, delete-orphan")


class DocumentVersion(Base):
    __tablename__ = "document_versions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    version_number = Column(Integer, nullable=False)
    s3_file_key = Column(String, nullable=False)
    
    cargado_por_id = Column(UUID(as_uuid=True), ForeignKey("public.users.id", ondelete="SET NULL"), nullable=True)
    fecha_creacion = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    document = relationship("Document", back_populates="versions")
    cargado_por = relationship("User")


class DocumentApproval(Base):
    __tablename__ = "document_approvals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    aprobador_id = Column(UUID(as_uuid=True), ForeignKey("public.users.id", ondelete="SET NULL"), nullable=True)
    
    estado = Column(String, default="pendiente", nullable=False)  # pendiente, aprobado, rechazado
    comentarios = Column(String, nullable=True)
    fecha_resolucion = Column(DateTime, nullable=True)

    # Cryptographic digital signature trace fields
    signature_hash = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)

    # Relationships
    document = relationship("Document", back_populates="approvals")
    aprobador = relationship("User")
