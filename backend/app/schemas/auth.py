from pydantic import BaseModel, EmailStr, Field
from uuid import UUID
from typing import Optional

# Mínimo de la contraseña elegida en la recuperación. Se define acá para que el
# backend, el mensaje de error y el texto de ayuda del formulario no se
# desincronicen.
PASSWORD_MIN_LEN = 8

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TenantOption(BaseModel):
    """Una organización a la que el usuario puede entrar."""
    slug: str
    name: str

class LoginResponse(BaseModel):
    message: str
    requires_2fa: bool = True
    email: str
    # Las organizaciones de la persona. Con más de una, el front pide cuál antes
    # de canjear el código. Se devuelve recién con la contraseña ya verificada.
    tenants: list[TenantOption] = []

class Verify2FARequest(BaseModel):
    email: EmailStr
    code: str
    # Obligatorio solo si la persona pertenece a más de una organización.
    tenant_slug: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    tenant_slug: str
    role: str

class TokenData(BaseModel):
    email: str | None = None
    tenant_slug: str | None = None
    role: str | None = None

class RecuperacionRequest(BaseModel):
    """Pedido de enlace de recuperación. Sólo el correo."""
    email: EmailStr


class RecuperacionResponse(BaseModel):
    """
    Respuesta del pedido. Es siempre la misma, exista o no la cuenta: si
    cambiara, el formulario serviría para averiguar qué correos están
    registrados en la plataforma.
    """
    message: str


class TokenRecuperacionEstado(BaseModel):
    """Estado de un enlace, para que la pantalla no pida una contraseña nueva si
    el enlace ya venció o se usó."""
    valido: bool
    motivo: Optional[str] = None
    # Correo parcialmente tapado ("au***or@empresa.com"): confirma de qué cuenta
    # es el enlace sin exponer la dirección completa.
    email_parcial: Optional[str] = None


class RestablecerPasswordRequest(BaseModel):
    token: str = Field(..., min_length=16, max_length=256)
    password: str = Field(..., min_length=PASSWORD_MIN_LEN, max_length=128)


class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    full_name: Optional[str] = None
    role: str
    active: bool

    class Config:
        from_attributes = True

