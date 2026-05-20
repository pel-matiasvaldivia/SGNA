from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, Any

from app.api.deps import get_tenant_db_from_token, get_current_active_user
from app.models.user import User
from app.models.gap_analysis import DiagnosticoItem
from app.models.iso9001 import NonConformity
from app.models.planificacion import RiesgoOportunidad
from app.models.huella import EmisionCarbono
from app.models.indicador import IndicadorKPI, IndicadorMedicion

router = APIRouter()

@router.get("/sgi-consolidado", response_model=Dict[str, Any])
def get_sgi_consolidado(
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    tenant_id = current_user.tenant_id

    # 1. GAP ANALYSIS SUMMARY
    gap_summary = db.query(
        DiagnosticoItem.estado,
        func.count(DiagnosticoItem.id)
    ).filter(
        DiagnosticoItem.estado.isnot(None)
    ).group_by(
        DiagnosticoItem.estado
    ).all()
    gap_stats = {row[0]: row[1] for row in gap_summary}
    # Ensure default fields
    for k in ["cumple", "cumple_parcialmente", "no_cumple", "no_aplica"]:
        if k not in gap_stats:
            gap_stats[k] = 0

    # 2. CAPA SUMMARY
    capa_summary = db.query(
        NonConformity.estado,
        func.count(NonConformity.id)
    ).filter(
        NonConformity.tenant_id == tenant_id
    ).group_by(
        NonConformity.estado
    ).all()
    capa_stats = {row[0]: row[1] for row in capa_summary}
    for k in ["abierta", "analizada", "resuelta", "cerrada"]:
        if k not in capa_stats:
            capa_stats[k] = 0

    # 3. RISKS SEVERITY (Inherente vs Residual)
    risks = db.query(RiesgoOportunidad).filter(
        RiesgoOportunidad.tenant_id == tenant_id
    ).all()
    
    total_risks = len(risks)
    avg_inherent = 0.0
    avg_residual = 0.0
    
    if total_risks > 0:
        sum_inherent = sum(r.probabilidad * r.impacto for r in risks)
        sum_residual = sum(r.probabilidad_residual * r.impacto_residual for r in risks)
        avg_inherent = round(sum_inherent / total_risks, 2)
        avg_residual = round(sum_residual / total_risks, 2)

    # 4. HUELLA DE CARBONO (CO2e by Scope)
    emisiones = db.query(
        EmisionCarbono.alcance,
        func.sum(EmisionCarbono.co2_equivalente)
    ).filter(
        EmisionCarbono.tenant_id == tenant_id
    ).group_by(
        EmisionCarbono.alcance
    ).all()
    
    huella_stats = {"1": 0.0, "2": 0.0, "3": 0.0}
    for row in emisiones:
        scope = str(row[0])
        if scope in huella_stats:
            huella_stats[scope] = round(float(row[1] or 0.0), 2)

    # 5. KPIs PERFORMANCE
    kpis = db.query(IndicadorKPI).filter(IndicadorKPI.tenant_id == tenant_id).all()
    total_kpis = len(kpis)
    kpis_cumplidos = 0
    kpis_en_alerta = 0

    for kpi in kpis:
        # Get the latest measurement by period
        latest_medicion = db.query(IndicadorMedicion).filter(
            IndicadorMedicion.indicador_id == kpi.id,
            IndicadorMedicion.tenant_id == tenant_id
        ).order_by(
            IndicadorMedicion.periodo.desc()
        ).first()

        if latest_medicion:
            # Assumes higher is better for quality indicators, or custom rules.
            # Highlight if actual value meets the target.
            if latest_medicion.valor_real >= kpi.meta:
                kpis_cumplidos += 1
            elif latest_medicion.valor_real < (kpi.meta * 0.9):  # more than 10% below meta
                kpis_en_alerta += 1

    return {
        "gap_analysis": gap_stats,
        "capa": capa_stats,
        "risks": {
            "total": total_risks,
            "avg_inherent": avg_inherent,
            "avg_residual": avg_residual,
            "mitigation_percentage": round(((avg_inherent - avg_residual) / (avg_inherent or 1.0)) * 100, 1) if avg_inherent > 0 else 0.0
        },
        "carbon_footprint": huella_stats,
        "kpis": {
            "total": total_kpis,
            "cumplidos": kpis_cumplidos,
            "en_alerta": kpis_en_alerta,
            "porcentaje_cumplimiento": round((kpis_cumplidos / (total_kpis or 1)) * 100, 1)
        }
    }
