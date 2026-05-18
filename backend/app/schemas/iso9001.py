from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import List, Optional

# Corrective Action Schemas
class CorrectiveActionBase(BaseModel):
    descripcion: str
    analisis_causa_raiz: Optional[str] = None  # Technique analysis (e.g. 5 Whys)
    fecha_planificada: datetime

class CorrectiveActionCreate(CorrectiveActionBase):
    non_conformity_id: UUID
    responsable_id: Optional[UUID] = None

class CorrectiveActionResponse(CorrectiveActionBase):
    id: UUID
    non_conformity_id: UUID
    fecha_implementacion: Optional[datetime] = None
    responsable_id: Optional[UUID] = None

    model_config = ConfigDict(from_attributes=True)


# Non-Conformity Schemas
class NonConformityBase(BaseModel):
    title: str
    description: str
    origin: str  # auditoria, interno, externo

class NonConformityCreate(NonConformityBase):
    pass

class NonConformityResponse(NonConformityBase):
    id: UUID
    estado: str
    fecha_deteccion: datetime
    creado_por_id: Optional[UUID] = None
    tenant_id: UUID
    corrective_actions: List[CorrectiveActionResponse] = []

    model_config = ConfigDict(from_attributes=True)
