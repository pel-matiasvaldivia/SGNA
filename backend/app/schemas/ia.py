from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from uuid import UUID

class IAChatRequest(BaseModel):
    prompt: str

class IAChatResponse(BaseModel):
    response: str
    suggestions: List[str] = []
    metadata: Dict[str, Any] = {}

class IAGapAnalysisRequest(BaseModel):
    clausula_filtro: Optional[str] = None

class GapAnalysisItem(BaseModel):
    clausula: str
    requisito: str
    estado: str  # conforme, no_conforme, parcial, no_aplica
    hallazgo: str
    recomendacion: str

class IAGapAnalysisResponse(BaseModel):
    score: int  # 0-100
    conformity_percentage: float
    items: List[GapAnalysisItem]
    recommendations: List[str]

class IARootCauseRequest(BaseModel):
    non_conformity_id: Optional[UUID] = None
    descripcion_libre: Optional[str] = None

class IARootCauseResponse(BaseModel):
    codigo: str
    descripcion: str
    ishikawa: Dict[str, List[str]]  # Metodo, ManoObra, Material, Maquina, Medida, MedioAmbiente
    five_whys: List[str]
    acciones_sugeridas: List[Dict[str, Any]]

class IARiskAdviceRequest(BaseModel):
    riesgo_id: Optional[UUID] = None

class RiskMitigationItem(BaseModel):
    riesgo_nombre: str
    nivel_riesgo: str  # Critico, Alto, Medio, Bajo
    analisis: str
    control_propuesto: str
    probabilidad_residual: int
    impacto_residual: int

class IARiskAdviceResponse(BaseModel):
    riesgos_analizados: int
    riesgos_criticos: int
    mitigaciones: List[RiskMitigationItem]

class IAKPISummaryRequest(BaseModel):
    periodo: Optional[str] = None

class IAKPISummaryResponse(BaseModel):
    kpis_analizados: int
    kpis_en_meta: int
    kpis_criticos: int
    resumen_ejecutivo: str
    alertas_detectadas: List[str]
    acciones_recomendadas: List[str]
