# -*- coding: utf-8 -*-
"""
Catálogo canónico de módulos + perfiles (roles) y su resolución de permisos.

Fuente ÚNICA de verdad de qué secciones existen y qué ve cada perfil. Lo usan:
 - el gestor de "Permisos y Perfiles" (Configuración del Tenant),
 - el frontend, para filtrar el menú y bloquear rutas,
 - el backend (`require_modules`), para rechazar a nivel API los módulos fuera
   del alcance del perfil.

Perfiles:
 - `admin` / `superadmin`: siempre ven todo (no se configuran).
 - `empleado`, `auditor`: perfiles integrados (built-in), su alcance se puede
   personalizar por tenant.
 - Perfiles PERSONALIZADOS: los crea el admin del tenant; se guardan en
   `tenant.settings["custom_profiles"]` y su alcance en
   `tenant.settings["role_permissions"]`.
"""
import re

# key: identificador estable (se guarda en tenant.settings y en User.role).
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

MODULE_KEYS = {m["key"] for m in MODULES}

# Perfiles integrados (built-in). `field` = usa la app móvil de auditor en campo.
BUILTIN_PROFILES = [
    {"key": "empleado", "label": "Empleado Base",    "field": False, "system": True},
    {"key": "auditor",  "label": "Auditor de Campo", "field": True,  "system": True},
]

# Roles que ven TODO y no se configuran.
FULL_ROLES = {"admin", "superadmin", "superadmin_impersonation"}

# Keys reservadas: no pueden usarse para perfiles personalizados.
RESERVED_KEYS = {"admin", "superadmin", "superadmin_impersonation", "empleado", "auditor",
                 "collaborator", "inicio"}

# Alcance por defecto de cada perfil integrado (y del rol heredado collaborator).
DEFAULT_PERMISSIONS = {
    "empleado":     ["inicio", "documents", "capacitacion", "iso9001", "sst"],
    "collaborator": ["inicio", "documents", "capacitacion", "iso9001", "sst"],
    "auditor":      ["mis-auditorias"],
}


def slugify_profile_key(value: str) -> str:
    """Genera una key estable (minúsculas, alfanumérico y guiones) para un perfil."""
    s = re.sub(r"[^a-z0-9]+", "-", (value or "").strip().lower()).strip("-")
    return s[:40]


def get_custom_profiles(settings: dict | None) -> list[dict]:
    raw = (settings or {}).get("custom_profiles")
    result = []
    seen = set()
    for p in raw or []:
        if not isinstance(p, dict):
            continue
        key = slugify_profile_key(p.get("key") or p.get("label") or "")
        if not key or key in RESERVED_KEYS or key in seen:
            continue
        seen.add(key)
        result.append({
            "key": key,
            "label": (str(p.get("label") or key))[:60],
            "field": bool(p.get("field")),
            "system": False,
        })
    return result


def effective_profiles(settings: dict | None) -> list[dict]:
    """Perfiles configurables del tenant: integrados + personalizados."""
    return [dict(p) for p in BUILTIN_PROFILES] + get_custom_profiles(settings)


def resolve_permissions(settings: dict | None) -> dict:
    """Mapa perfil->[módulos permitidos] para todos los perfiles efectivos."""
    saved = (settings or {}).get("role_permissions") or {}
    out = {}
    for prof in effective_profiles(settings):
        key = prof["key"]
        allowed = saved.get(key)
        if not isinstance(allowed, list):
            allowed = DEFAULT_PERMISSIONS.get(key, [])
        out[key] = [k for k in allowed if k in MODULE_KEYS]
    return out


def allowed_modules_for_role(settings: dict | None, role: str | None) -> set | None:
    """
    Conjunto de módulos permitidos para un rol. `None` = sin restricción (ve todo).
    Un rol restringido y desconocido devuelve el conjunto vacío (no ve nada salvo
    lo siempre-permitido: Perfil/Ayuda, que se resuelven en el frontend).
    """
    if role in FULL_ROLES:
        return None
    perms = resolve_permissions(settings)
    if role in perms:
        return set(perms[role])
    if role in DEFAULT_PERMISSIONS:
        return set(DEFAULT_PERMISSIONS[role])
    return set()


def sanitize_config(raw_permissions: dict | None, raw_custom_profiles: list | None) -> tuple[dict, list]:
    """
    Normaliza la config recibida del gestor: valida keys de perfiles y módulos,
    conserva los integrados con sus defaults si faltan y descarta lo desconocido.
    Devuelve (permissions, custom_profiles).
    """
    customs = get_custom_profiles({"custom_profiles": raw_custom_profiles})
    valid_keys = {"empleado", "auditor"} | {c["key"] for c in customs}

    perms = {}
    for key, mods in (raw_permissions or {}).items():
        if key not in valid_keys or not isinstance(mods, list):
            continue
        perms[key] = [m for m in mods if m in MODULE_KEYS]

    # Garantizar que todos los perfiles efectivos tengan una entrada.
    for key in ("empleado", "auditor"):
        perms.setdefault(key, list(DEFAULT_PERMISSIONS[key]))
    for c in customs:
        perms.setdefault(c["key"], [])

    return perms, customs
