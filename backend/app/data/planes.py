"""
Catálogo de planes: única fuente de verdad de qué incluye cada uno.

El precio NO vive acá a propósito. Se cotiza por acuerdo según los módulos que
la organización habilite, así que la plataforma solo necesita conocer los topes
de uso — nunca el importe.

Un límite en None significa «sin tope».
"""

# Días de prueba desde el alta del tenant. Durante la prueba se mide el uso pero
# no se avisa por exceso: recién al vencer empiezan a aplicar los topes.
TRIAL_DIAS = 30

PLANES: dict[str, dict] = {
    "basico": {
        "nombre": "Básico",
        "auditorias_anuales": 1,
        "normas_iso": 1,
        "checklists": 1,
        "almacenamiento_mb": 1024,          # 1 GB
        "multiempresa": False,
        "ia_auditor": False,
    },
    "standard": {
        "nombre": "Standard",
        "auditorias_anuales": 2,
        "normas_iso": 3,
        "checklists": 5,
        "almacenamiento_mb": 5120,          # 5 GB
        "multiempresa": False,
        "ia_auditor": False,
    },
    "business": {
        "nombre": "Business",
        "auditorias_anuales": None,
        "normas_iso": 3,
        "checklists": None,
        "almacenamiento_mb": 102400,        # 100 GB
        "multiempresa": True,
        "ia_auditor": True,
    },
}

PLAN_POR_DEFECTO = "basico"

# Los tenants dados de alta antes de este catálogo tienen 'free', 'starter' o
# 'premium' en la columna plan. Sin este mapeo quedarían sin plan reconocido y
# el cálculo de uso los trataría como si no tuvieran tope alguno.
ALIAS_PLAN = {
    "free": "basico",
    "starter": "basico",
    "trial": "basico",
    "premium": "business",
    "personalizado": "business",
    "enterprise": "business",
}


def normalizar_plan(plan: str | None) -> str:
    """Devuelve una clave válida de PLANES para cualquier valor almacenado."""
    if not plan:
        return PLAN_POR_DEFECTO
    clave = plan.strip().lower()
    clave = ALIAS_PLAN.get(clave, clave)
    return clave if clave in PLANES else PLAN_POR_DEFECTO


def definicion_plan(plan: str | None) -> dict:
    return PLANES[normalizar_plan(plan)]
