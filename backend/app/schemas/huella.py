from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import date, datetime
from typing import Optional, List, Dict

class EmisionCarbonoBase(BaseModel):
    periodo: date
    alcance: int
    categoria: str
    subcategoria: Optional[str] = None
    fuente: str
    cantidad: float
    unidad: str
    factor_emision: float
    notas: Optional[str] = None
    evidencia_documento_id: Optional[UUID] = None

class EmisionCarbonoCreate(EmisionCarbonoBase):
    pass

class EmisionCarbonoUpdate(BaseModel):
    periodo: Optional[date] = None
    alcance: Optional[int] = None
    categoria: Optional[str] = None
    subcategoria: Optional[str] = None
    fuente: Optional[str] = None
    cantidad: Optional[float] = None
    unidad: Optional[str] = None
    factor_emision: Optional[float] = None
    notas: Optional[str] = None
    evidencia_documento_id: Optional[UUID] = None

class EmisionCarbonoResponse(EmisionCarbonoBase):
    id: UUID
    co2_equivalente: float
    created_by_id: Optional[UUID] = None
    tenant_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class HuellaResumenResponse(BaseModel):
    total_co2e: float  # tCO2e totales
    desglose_alcances: Dict[str, float]  # tCO2e por Alcance 1, 2, 3
    porcentajes_alcances: Dict[str, float]  # % de participación por Alcance
    emisiones_por_categoria: Dict[str, float]  # tCO2e por Categoría
    historico_mensual: List[Dict[str, float]]  # [{'periodo': '2026-01', 'co2e': 120.50}, ...]
