import uuid
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, UniqueConstraint, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.models.base_class import Base


class UserTenant(Base):
    """
    Pertenencia de un usuario a una organización.

    Separa "quién sos" (public.users, una fila por persona, email único) de
    "dónde trabajás" (esta tabla, una fila por organización). Es lo que permite
    que un auditor externo —un partner, o alguien del equipo propio— opere en
    varias cuentas de cliente sin necesitar un correo distinto por cada una.

    El rol vive acá y no en users: la misma persona puede ser admin en su propia
    organización y auditor de campo en la de un cliente.

    `users.tenant_id` se conserva como organización de origen (la que creó la
    cuenta) y es la que se usa por defecto cuando alguien tiene una sola
    pertenencia. La fuente de verdad del acceso es esta tabla.
    """

    __tablename__ = "user_tenants"
    __table_args__ = (
        UniqueConstraint("user_id", "tenant_id", name="uq_user_tenants_user_tenant"),
        Index("ix_user_tenants_tenant_role", "tenant_id", "role"),
        {"schema": "public"},
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("public.users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    tenant_id = Column(
        UUID(as_uuid=True),
        ForeignKey("public.tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    role = Column(String(50), nullable=False, default="collaborator")
    active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
