from pydantic import BaseModel, EmailStr
from uuid import UUID
from typing import Optional

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

class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    full_name: Optional[str] = None
    role: str
    active: bool

    class Config:
        from_attributes = True

