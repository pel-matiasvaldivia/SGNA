from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import List, Optional

# Document Version Schemas
class DocumentVersionBase(BaseModel):
    version_number: int
    s3_file_key: str

class DocumentVersionResponse(DocumentVersionBase):
    id: UUID
    document_id: UUID
    cargado_por_id: Optional[UUID] = None
    fecha_creacion: datetime
    
    model_config = ConfigDict(from_attributes=True)


# Document Approval Schemas
class DocumentApprovalBase(BaseModel):
    aprobador_id: Optional[UUID] = None
    estado: str
    comentarios: Optional[str] = None

class DocumentApprovalResponse(DocumentApprovalBase):
    id: UUID
    document_id: UUID
    fecha_resolucion: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


class ApprovalDecisionRequest(BaseModel):
    approve: bool
    comments: Optional[str] = None


# Document Schemas
class DocumentBase(BaseModel):
    title: str
    description: Optional[str] = None
    type: str  # manual, procedimiento, evidencia, etc.

class DocumentCreate(DocumentBase):
    pass

class DocumentResponse(DocumentBase):
    id: UUID
    status: str
    version_actual: int
    creator_id: Optional[UUID] = None
    tenant_id: UUID
    versions: List[DocumentVersionResponse] = []
    approvals: List[DocumentApprovalResponse] = []

    model_config = ConfigDict(from_attributes=True)


class DownloadResponse(BaseModel):
    download_url: str
