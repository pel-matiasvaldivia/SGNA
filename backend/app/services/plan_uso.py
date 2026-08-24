"""
Medición del consumo de un tenant contra los topes de su plan.

El resultado alimenta el aviso en pantalla del panel. La política es
**informar, no bloquear**: pasarse de un tope nunca interrumpe una auditoría en
curso ni impide guardar evidencia; se avisa y queda para conversarlo
comercialmente.
"""

import logging
import threading
import time
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.data.planes import TRIAL_DIAS, definicion_plan, normalizar_plan
from app.models.auditoria import AuditoriaAsignacion, PlantillaChecklist, ProgramaAuditoria
from app.models.tenant import Tenant

logger = logging.getLogger(__name__)

# Sumar un bucket entero es una operación cara y el panel pide el uso en cada
# carga. Se cachea por proceso durante unos minutos: el almacenamiento no se
# mueve lo bastante rápido como para justificar recorrerlo en cada request.
_CACHE_TTL_SEG = 300
_cache_almacenamiento: dict[str, tuple[float, int | None]] = {}
_cache_lock = threading.Lock()


def _uso_almacenamiento_mb(tenant_slug: str) -> int | None:
    ahora = time.time()
    with _cache_lock:
        entrada = _cache_almacenamiento.get(tenant_slug)
        if entrada and (ahora - entrada[0]) < _CACHE_TTL_SEG:
            return entrada[1]

    # Fuera del lock: la llamada al objeto de almacenamiento puede tardar y no
    # tiene sentido bloquear a los demás tenants mientras tanto.
    from app.services.s3 import s3_service

    try:
        total_bytes = s3_service.calcular_uso_bytes(tenant_slug)
    except Exception as e:  # el aviso de plan nunca debe tumbar el panel
        logger.warning(f"Fallo al medir almacenamiento de {tenant_slug}: {e}")
        total_bytes = None

    valor = None if total_bytes is None else int(total_bytes / (1024 * 1024))
    with _cache_lock:
        _cache_almacenamiento[tenant_slug] = (ahora, valor)
    return valor


def invalidar_cache_almacenamiento(tenant_slug: str) -> None:
    """Fuerza una nueva medición en la próxima consulta (tras una subida grande)."""
    with _cache_lock:
        _cache_almacenamiento.pop(tenant_slug, None)


def fin_de_prueba(tenant: Tenant) -> datetime | None:
    """
    Fecha en que vence la prueba.

    Se deriva de `created_at` en lugar de guardarse en una columna propia: evita
    una migración sobre `public.tenants`, que en este repo no tiene mecanismo de
    ALTER automático. Para extender una prueba puntual alcanza con escribir
    `trial_ends_at` (ISO 8601) en el JSON de `settings` del tenant.
    """
    override = (tenant.settings or {}).get("trial_ends_at")
    if override:
        try:
            valor = datetime.fromisoformat(str(override))
            return valor if valor.tzinfo else valor.replace(tzinfo=timezone.utc)
        except ValueError:
            logger.warning(f"trial_ends_at inválido en el tenant {tenant.slug}: {override!r}")

    if not tenant.created_at:
        return None
    creado = tenant.created_at
    if not creado.tzinfo:
        creado = creado.replace(tzinfo=timezone.utc)
    return creado + timedelta(days=TRIAL_DIAS)


def _item(clave, etiqueta, usado, limite, unidad=None, detalle=None):
    """
    Arma una fila de uso.

    `usado` en None significa que no se pudo medir — distinto de cero. En ese
    caso nunca se marca excedido: avisar por exceso a partir de una medición
    fallida es peor que no avisar.
    """
    medible = usado is not None
    ilimitado = limite is None
    return {
        "clave": clave,
        "etiqueta": etiqueta,
        "usado": usado,
        "limite": limite,
        "unidad": unidad,
        "detalle": detalle,
        "ilimitado": ilimitado,
        "medible": medible,
        "excedido": bool(medible and not ilimitado and usado > limite),
        "porcentaje": (
            None if (not medible or ilimitado or limite == 0)
            else min(round(usado / limite * 100), 999)
        ),
    }


def calcular_uso(db: Session, tenant: Tenant) -> dict:
    """
    Devuelve el estado del plan del tenant: topes, consumo y qué está excedido.

    `db` debe ser una sesión ya apuntada al schema del tenant.
    """
    plan_clave = normalizar_plan(tenant.plan)
    plan = definicion_plan(tenant.plan)

    anio = date.today().year
    inicio, fin = date(anio, 1, 1), date(anio, 12, 31)

    # Una «auditoría interna» es un programa de auditoría, no cada asignación:
    # un mismo programa puede repartirse en varias áreas y auditores, y contar
    # las asignaciones haría que una sola auditoría multi-área agotara el plan
    # Básico el primer día.
    auditorias = (
        db.query(func.count(ProgramaAuditoria.id))
        .filter(ProgramaAuditoria.fecha_inicio >= inicio,
                ProgramaAuditoria.fecha_inicio <= fin)
        .scalar()
    ) or 0

    normas = (
        db.query(func.count(func.distinct(AuditoriaAsignacion.norma)))
        .filter(AuditoriaAsignacion.norma.isnot(None),
                AuditoriaAsignacion.norma != "")
        .scalar()
    ) or 0

    checklists = db.query(func.count(PlantillaChecklist.id)).scalar() or 0

    almacenamiento_mb = _uso_almacenamiento_mb(tenant.slug)

    uso = [
        _item("auditorias", f"Auditorías internas {anio}", auditorias,
              plan["auditorias_anuales"], "auditorías"),
        _item("normas_iso", "Modelos ISO en uso", normas,
              plan["normas_iso"], "normas"),
        _item("checklists", "Checklists a medida", checklists,
              plan["checklists"], "checklists"),
        _item("almacenamiento", "Almacenamiento", almacenamiento_mb,
              plan["almacenamiento_mb"], "MB",
              None if almacenamiento_mb is not None else "No se pudo medir el almacenamiento."),
    ]

    vence = fin_de_prueba(tenant)
    ahora = datetime.now(timezone.utc)
    en_prueba = bool(vence and ahora < vence)
    dias_restantes = max(0, (vence - ahora).days) if (vence and en_prueba) else 0

    # Durante la prueba se mide pero no se reclama: el cliente todavía está
    # evaluando y avisarle por exceso arruina justamente esa evaluación.
    excedidos = [] if en_prueba else [i["clave"] for i in uso if i["excedido"]]

    return {
        "plan": plan_clave,
        "plan_nombre": plan["nombre"],
        "ia_auditor": plan["ia_auditor"],
        "multiempresa": plan["multiempresa"],
        "en_prueba": en_prueba,
        "prueba_termina": vence.date().isoformat() if vence else None,
        "dias_restantes_prueba": dias_restantes,
        "limites_aplicados": not en_prueba,
        "uso": uso,
        "excedidos": excedidos,
    }
