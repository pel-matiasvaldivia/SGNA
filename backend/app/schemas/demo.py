from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class DemoRequest(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    empresa: Optional[str] = Field(None, max_length=160)
    telefono: Optional[str] = Field(None, max_length=40)
    when: Optional[datetime] = None  # fecha/hora preferida (ISO 8601)
    mensaje: Optional[str] = Field(None, max_length=1000)


class DemoResponse(BaseModel):
    ok: bool
    meet_link: Optional[str] = None
    event_link: Optional[str] = None
    calendar_created: bool = False
    email_sent: bool = False
    whatsapp_sent: bool = False
    message: str
