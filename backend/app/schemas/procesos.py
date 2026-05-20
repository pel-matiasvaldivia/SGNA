from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID

class ProcesoBPMCreate(BaseModel):
    nombre: str = Field(..., max_length=255)
    codigo: str = Field(..., max_length=50)
    tipo: str = Field(..., description="estrategico, operativo, soporte")
    entradas: Optional[str] = None
    proveedores: Optional[str] = None
    salidas: Optional[str] = None
    clientes: Optional[str] = None
    recursos: Optional[str] = None
    controles: Optional[str] = None

class ProcesoBPMResponse(BaseModel):
    id: UUID
    nombre: str
    codigo: str
    tipo: str
    responsable_id: Optional[UUID] = None
    entradas: Optional[str] = None
    proveedores: Optional[str] = None
    salidas: Optional[str] = None
    clientes: Optional[str] = None
    recursos: Optional[str] = None
    controles: Optional[str] = None
    tenant_id: UUID

    class Config:
        from_attributes = True
