import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.models.base_class import Base


class PasswordResetToken(Base):
    """
    Pedido de recuperación de contraseña: un vale de un solo uso que habilita a
    cambiar la clave de una cuenta sin conocer la anterior.

    Vive en ``public`` porque las cuentas viven en ``public.users``: la misma
    persona puede pertenecer a varias organizaciones y su contraseña es una
    sola. Va en la base y no en Redis por dos razones: tiene que sobrevivir a un
    reinicio del contenedor (si no, todos los enlaces enviados se caen con él) y
    el consumo tiene que quedar registrado —quién pidió el cambio, desde qué IP
    y cuándo se usó— para poder auditarlo después.

    Lo que se guarda es el SHA-256 del token, nunca el token. El enlace que
    recibe la persona es el único lugar donde existe el valor en claro: con un
    volcado de esta tabla no se puede cambiar la contraseña de nadie.
    """
    __tablename__ = "password_reset_tokens"
    __table_args__ = {"schema": "public"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("public.users.id", ondelete="CASCADE"),
                     nullable=False, index=True)
    # SHA-256 en hexadecimal (64 caracteres) del token que viajó en el enlace.
    token_hash = Column(String(64), nullable=False, unique=True, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    # Sellado al usarse. Mientras sea NULL el vale sigue vigente; una vez
    # marcado no vuelve a servir, aunque alguien reenvíe el mismo enlace.
    used_at = Column(DateTime(timezone=True), nullable=True)
    # IP del pedido (la real, sanitizada por nginx — ver nginx/nginx.conf).
    # Sirve para distinguir un olvido genuino de un barrido contra la plataforma.
    ip_solicitud = Column(String(64), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
