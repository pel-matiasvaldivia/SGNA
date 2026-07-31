# -*- coding: utf-8 -*-
"""
Catálogo canónico de módulos del dashboard y permisos por defecto por perfil.

Es la ÚNICA fuente de verdad de qué secciones existen y qué ve cada perfil.
El gestor de "Permisos y Perfiles" (Configuración del Tenant) lo usa para
construir la matriz, y el frontend lo consume para filtrar el menú y bloquear
rutas. Los perfiles `admin` y `superadmin` siempre ven todo (no se configuran).
"""

# key: identificador estable (se guarda en tenant.settings).
# path: ruta del dashboard usada para el gating en el frontend.
MODULES = [
    {"key": "inicio",         "label": "Inicio",                     "path": "/dashboard"},
    {"key": "diagnosticos",   "label": "Diagnóstico y Brechas",      "path": "/dashboard/diagnosticos"},
    {"key": "contexto",       "label": "Contexto Organizacional",    "path": "/dashboard/contexto"},
    {"key": "planificacion",  "label": "Planificación SGI",          "path": "/dashboard/planificacion"},
    {"key": "procesos",       "label": "Gestión de Procesos",        "path": "/dashboard/procesos"},
    {"key": "documents",      "label": "Gestión Documental (DMS)",   "path": "/dashboard/documents"},
    {"key": "approvals",      "label": "Aprobaciones de Calidad",    "path": "/dashboard/approvals"},
    {"key": "auditorias",     "label": "Auditorías Internas",        "path": "/dashboard/auditorias"},
    {"key": "mis-auditorias", "label": "Mis Auditorías (Campo)",     "path": "/dashboard/mis-auditorias"},
    {"key": "iso9001",        "label": "No Conformidades (ISO 9001)", "path": "/dashboard/iso9001"},
    {"key": "cambios",        "label": "Control de Cambios",         "path": "/dashboard/cambios"},
    {"key": "equipos",        "label": "Equipos y Calibración",      "path": "/dashboard/equipos"},
    {"key": "capacitacion",   "label": "Planes y Competencias",      "path": "/dashboard/capacitacion"},
    {"key": "satisfaccion",   "label": "Satisfacción de Clientes",   "path": "/dashboard/satisfaccion"},
    {"key": "proveedores",    "label": "Gestión de Proveedores",     "path": "/dashboard/proveedores"},
    {"key": "huella",         "label": "Huella de Carbono",          "path": "/dashboard/huella"},
    {"key": "kpis",           "label": "KPIs e Indicadores",         "path": "/dashboard/kpis"},
    {"key": "direccion",      "label": "Revisión Dirección",         "path": "/dashboard/direccion"},
    {"key": "reportes",       "label": "Reporte SGI",                "path": "/dashboard/reportes"},
    {"key": "ia-auditor",     "label": "Auditor de IA Hub",          "path": "/dashboard/ia-auditor"},
    {"key": "sst",            "label": "Seguridad y Salud (SST)",    "path": "/dashboard/sst"},
    {"key": "mantenimiento",  "label": "Mantenimiento (CMMS)",       "path": "/dashboard/mantenimiento"},
]

MODULE_KEYS = [m["key"] for m in MODULES]

# Perfiles configurables (los que NO ven todo). admin/superadmin quedan afuera.
# `field` marca los perfiles que usan la app móvil de auditor en campo.
PROFILES = [
    {"key": "empleado", "label": "Empleado Base",     "field": False},
    {"key": "auditor",  "label": "Auditor de Campo",  "field": True},
]

# Alcance por defecto de cada perfil (si el tenant no personalizó nada).
DEFAULT_PERMISSIONS = {
    "empleado": ["inicio", "documents", "capacitacion", "iso9001", "sst"],
    "auditor":  ["mis-auditorias"],
}


def sanitize_permissions(raw: dict | None) -> dict:
    """Normaliza un mapa perfil->[keys]: solo perfiles y módulos conocidos."""
    raw = raw or {}
    result = {}
    for p in PROFILES:
        allowed = raw.get(p["key"])
        if not isinstance(allowed, list):
            allowed = DEFAULT_PERMISSIONS.get(p["key"], [])
        result[p["key"]] = [k for k in allowed if k in MODULE_KEYS]
    return result
