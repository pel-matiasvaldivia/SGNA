import uuid
from sqlalchemy import Column, String, Boolean, JSON, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.models.base_class import Base

class Tenant(Base):
    __tablename__ = "tenants"
    __table_args__ = {"schema": "public"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug = Column(String(63), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    plan = Column(String(50), default='free')
    domain = Column(String(255), nullable=True)
    settings = Column(JSON, default={})
    active = Column(Boolean, default=True)
    two_factor_enabled = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # SMTP Settings for Tenant
    smtp_host = Column(String(255), nullable=True)
    smtp_port = Column(String(10), nullable=True)
    smtp_user = Column(String(255), nullable=True)
    smtp_password = Column(String(255), nullable=True)
    smtp_encryption = Column(String(20), default="tls", nullable=True) # tls, ssl, none

    # Limits and Usage
    max_users = Column(String(20), default="10", nullable=True) # string to allow "unlimited"
    storage_limit_mb = Column(String(20), default="1024", nullable=True)

    # --- Datos de la organización para el trabajo en campo -------------------
    # El auditor que recibe una asignación tiene que saber a dónde ir y con
    # quién hablar. Estos campos son el valor por defecto de la organización:
    # cada asignación puede pisarlos cuando la auditoría se hace en otra sede
    # (ver AuditoriaAsignacion.lugar_*), pero en el caso común —auditar en el
    # domicilio de la empresa— se cargan una vez y no se vuelven a escribir.
    #
    # El domicilio va en un solo campo de texto libre y no partido en
    # calle/localidad/provincia: así se escribe como se dicta ("Ruta 40 Sur
    # 1234, Luján de Cuyo, Mendoza") y es exactamente lo que necesita la
    # consulta del mapa.
    domicilio = Column(String(500), nullable=True)
    telefono = Column(String(60), nullable=True)
    contacto_nombre = Column(String(255), nullable=True)
    contacto_email = Column(String(255), nullable=True)

