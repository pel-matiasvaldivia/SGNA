from fastapi import APIRouter, Depends
from app.api.v1 import auth, documents, iso9001, admin, diagnosticos, contexto, planificacion, procesos, auditorias, huella, kpi_api, revision_api, reportes, cambio_api, equipo_api, capacitacion_api, satisfaccion_api, ia_api, proveedor_api, sst_api, mantenimiento_api, onboarding, tenant_settings, users, demos, cron
from app.api.deps import require_modules


def _mod(*keys: str):
    """Azúcar: dependencia de router que exige acceso al módulo (perfil)."""
    return [Depends(require_modules(*keys))]


api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(onboarding.router, prefix="/onboarding", tags=["onboarding"])
api_router.include_router(tenant_settings.router, prefix="/tenant", tags=["tenant_settings"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(iso9001.router, prefix="/iso9001", tags=["iso9001"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
# Módulos con enforcement por perfil (standalone). Los transversales
# (documents, iso9001, auditorias, ia) quedan con gating solo de UI porque otros
# flujos los consumen de forma cruzada.
api_router.include_router(diagnosticos.router, prefix="/diagnosticos", tags=["diagnosticos"], dependencies=_mod("diagnosticos"))
api_router.include_router(contexto.router, prefix="/contexto", tags=["contexto"], dependencies=_mod("contexto"))
api_router.include_router(planificacion.router, prefix="/planificacion", tags=["planificacion"], dependencies=_mod("planificacion"))
api_router.include_router(procesos.router, prefix="/procesos", tags=["procesos"], dependencies=_mod("procesos"))
api_router.include_router(auditorias.router, prefix="/auditorias", tags=["auditorias"])
api_router.include_router(huella.router, prefix="/huella", tags=["huella"], dependencies=_mod("huella"))
api_router.include_router(kpi_api.router, prefix="/kpis", tags=["kpis"], dependencies=_mod("kpis"))
api_router.include_router(revision_api.router, prefix="/revisiones", tags=["revisiones"], dependencies=_mod("direccion"))
api_router.include_router(reportes.router, prefix="/reportes", tags=["reportes"], dependencies=_mod("reportes"))
api_router.include_router(cambio_api.router, prefix="/cambios", tags=["cambios"], dependencies=_mod("cambios"))
api_router.include_router(equipo_api.router, prefix="/equipos", tags=["equipos"], dependencies=_mod("equipos"))
api_router.include_router(capacitacion_api.router, prefix="/capacitaciones", tags=["capacitaciones"], dependencies=_mod("capacitacion"))
api_router.include_router(satisfaccion_api.router, prefix="/satisfaccion", tags=["satisfaccion"], dependencies=_mod("satisfaccion"))
api_router.include_router(ia_api.router, prefix="/ia", tags=["ia"])
api_router.include_router(proveedor_api.router, prefix="/proveedores", tags=["proveedores"], dependencies=_mod("proveedores"))
api_router.include_router(sst_api.router, prefix="/sst", tags=["sst"], dependencies=_mod("sst"))
api_router.include_router(mantenimiento_api.router, prefix="/mantenimiento", tags=["mantenimiento"], dependencies=_mod("mantenimiento"))
api_router.include_router(demos.router, prefix="/demos", tags=["demos"])
api_router.include_router(cron.router, prefix="/cron", tags=["cron"])
