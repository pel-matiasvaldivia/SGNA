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
    # Sin «(DMS)»: el nombre va en un menú de 256px y el acrónimo hacía que se
    # cortara en «Gestión Documental (...». La sigla queda en la portada y en el
    # encabezado de la propia sección, que es donde se explica.
    {"key": "documents",      "label": "Gestión Documental",         "path": "/dashboard/documents"},
    {"key": "approvals",      "label": "Aprobaciones de Calidad",    "path": "/dashboard/approvals"},
    {"key": "auditorias",     "label": "Auditorías Internas",        "path": "/dashboard/auditorias"},
    {"key": "mis-auditorias", "label": "Mis Auditorías (Campo)",     "path": "/dashboard/mis-auditorias"},
    # Sin «(ISO 9001)»: no entraba en el menú, y además ya no es cierto —el
    # mismo módulo registra las no conformidades de 14001 y 45001. La `key`
    # sigue siendo `iso9001` porque está guardada en los permisos de cada tenant.
    {"key": "iso9001",        "label": "No Conformidades",           "path": "/dashboard/iso9001"},
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

# --------------------------------- Ediciones ---------------------------------
# La plataforma se vende en dos niveles, y hasta ahora los dos veían los 22
# módulos: alguien que contrató para ejecutar auditorías internas entraba y se
# encontraba con Huella de Carbono, CMMS y Revisión por la Dirección, todos
# vacíos. El tamaño del sistema no es gratis: cada módulo que no se usa es una
# decisión más que tomar antes de hacer lo que uno vino a hacer.
#
# `auditorias` es un SUBCONJUNTO ESTRICTO de `completa`. Eso es a propósito:
# pasar de una a otra es cambiar un valor, sin migrar ni perder nada, y es
# también el camino comercial de la plataforma.
#
# `modulos: None` significa «todos» (no «ninguno»).
EDICIONES = [
    {
        "key": "auditorias",
        "label": "Auditorías",
        "resumen": "Ejecutar auditorías internas en cualquier industria.",
        "detalle": "Programa, plan, checklist, auditor en campo, hallazgos e informe. "
                   "Sin los módulos de implementación de un sistema de gestión.",
        "modulos": [
            "inicio",
            "auditorias",
            "mis-auditorias",
            "iso9001",
            "documents",
            "reportes",
        ],
    },
    {
        "key": "completa",
        "label": "SGI Completo",
        "resumen": "Implementar y mantener un sistema de gestión integrado.",
        "detalle": "Todo lo anterior más contexto, planificación, procesos, competencias, "
                   "equipos, proveedores, indicadores y revisión por la dirección.",
        "modulos": None,
    },
]

EDICION_POR_DEFECTO = "completa"

EDICION_KEYS = {e["key"] for e in EDICIONES}


def normalizar_edicion(valor: str | None) -> str:
    """
    Clave de edición válida para cualquier valor almacenado.

    Un tenant sin edición definida —los que existían antes de esta función, y
    los nuevos hasta que contestan la pregunta del asistente de alta— cae en
    `completa`: ensanchar de más es un módulo de sobra en el menú, achicar de
    más es dejar a una organización sin la mitad de lo que ya estaba usando.
    """
    clave = (valor or "").strip().lower()
    return clave if clave in EDICION_KEYS else EDICION_POR_DEFECTO


def definicion_edicion(valor: str | None) -> dict:
    clave = normalizar_edicion(valor)
    return next(e for e in EDICIONES if e["key"] == clave)


def modulos_de_edicion(valor: str | None) -> set | None:
    """Módulos que habilita una edición. `None` = sin restricción (todos)."""
    modulos = definicion_edicion(valor)["modulos"]
    if modulos is None:
        return None
    return {k for k in modulos if k in MODULE_KEYS}

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


def allowed_modules_for_role(settings: dict | None, role: str | None,
                             edicion: str | None = None) -> set | None:
    """
    Conjunto de módulos permitidos: **intersección de la edición contratada y el
    alcance del perfil**. `None` = sin restricción (ve todo).

    Son dos límites de naturaleza distinta y los dos tienen que aplicar. La
    edición es lo que la organización contrató; el perfil es lo que dentro de
    esa organización le toca a cada persona. Un administrador no tiene más
    edición por ser administrador: en una organización que contrató solo
    Auditorías, el admin tampoco ve Huella de Carbono.

    Un rol restringido y desconocido devuelve el conjunto vacío (no ve nada
    salvo lo siempre-permitido: Perfil/Ayuda, que se resuelven en el frontend).

    `edicion=None` mantiene el comportamiento anterior a las ediciones —sin
    recorte— para que los llamadores que todavía no la pasan no cambien de
    conducta.
    """
    de_la_edicion = modulos_de_edicion(edicion) if edicion is not None else None

    if role in FULL_ROLES:
        del_perfil = None
    else:
        perms = resolve_permissions(settings)
        if role in perms:
            del_perfil = set(perms[role])
        elif role in DEFAULT_PERMISSIONS:
            del_perfil = set(DEFAULT_PERMISSIONS[role])
        else:
            del_perfil = set()

    # `None` es «todos», así que intersecar con None es devolver el otro.
    if de_la_edicion is None:
        return del_perfil
    if del_perfil is None:
        return set(de_la_edicion)
    return del_perfil & de_la_edicion


def sanitize_config(raw_permissions: dict | None, raw_custom_profiles: list | None,
                    edicion: str | None = None) -> tuple[dict, list]:
    """
    Normaliza la config recibida del gestor: valida keys de perfiles y módulos,
    conserva los integrados con sus defaults si faltan y descarta lo desconocido.
    Devuelve (permissions, custom_profiles).

    Con `edicion`, además descarta los módulos que esa edición no incluye. El
    gestor ya no los ofrece, pero el PUT es una API: sin esto, un pedido armado
    a mano dejaría guardado un permiso que la edición no habilita. No llegaría a
    abrir nada —`allowed_modules_for_role` interseca igual— pero quedaría una
    config que miente sobre lo que el perfil puede hacer, y que se activaría
    sola el día que la organización pase a la edición completa.
    """
    customs = get_custom_profiles({"custom_profiles": raw_custom_profiles})
    valid_keys = {"empleado", "auditor"} | {c["key"] for c in customs}

    de_la_edicion = modulos_de_edicion(edicion) if edicion is not None else None
    permitidos = MODULE_KEYS if de_la_edicion is None else (MODULE_KEYS & de_la_edicion)

    perms = {}
    for key, mods in (raw_permissions or {}).items():
        if key not in valid_keys or not isinstance(mods, list):
            continue
        perms[key] = [m for m in mods if m in permitidos]

    # Garantizar que todos los perfiles efectivos tengan una entrada. Los
    # defaults también se recortan: el default de `empleado` incluye `sst`, que
    # la edición Auditorías no tiene.
    for key in ("empleado", "auditor"):
        perms.setdefault(key, [m for m in DEFAULT_PERMISSIONS[key] if m in permitidos])
    for c in customs:
        perms.setdefault(c["key"], [])

    return perms, customs
