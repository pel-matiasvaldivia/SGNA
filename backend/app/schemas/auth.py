from pydantic import BaseModel, EmailStr
from uuid import UUID
from typing import Optional

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    message: str
    requires_2fa: bool = True
    email: str

class Verify2FARequest(BaseModel):
    email: EmailStr
    code: str

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

