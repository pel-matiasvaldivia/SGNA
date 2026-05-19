from pydantic import BaseModel, EmailStr, Field
from uuid import UUID
from datetime import datetime

class TenantProvisionRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=255, description="Nombre de la empresa / organización")
    slug: str = Field(..., min_length=2, max_length=63, description="Identificador URL único (minúsculas y guiones)")
    admin_email: EmailStr = Field(..., description="Correo del administrador principal")
    admin_password: str = Field(..., min_length=6, description="Contraseña temporal del administrador principal")

class TenantResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    active: bool
    two_factor_enabled: bool
    created_at: datetime

    class Config:
        from_attributes = True
