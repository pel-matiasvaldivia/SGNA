# -*- coding: utf-8 -*-
"""
Scheduler interno para el barrido preventivo de notificaciones.

Usa APScheduler (BackgroundScheduler, basado en hilos) para no bloquear el
bucle de eventos de FastAPI: el barrido es trabajo SQL/SMTP síncrono y corre en
su propio hilo. Si APScheduler no está instalado o SCHEDULER_ENABLED=False, la
app arranca igual y el barrido queda disponible solo vía POST /cron/notificaciones.
"""
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

_scheduler = None


def _run_job():
    """Wrapper que ejecuta el barrido y nunca propaga excepciones al scheduler."""
    from app.services.notifications import run_preventive_sweep
    try:
        run_preventive_sweep()
    except Exception as e:  # noqa: BLE001
        logger.error("Error en el barrido preventivo programado: %s", e)


def start_scheduler():
    """Arranca el scheduler diario. Idempotente y tolerante a fallos."""
    global _scheduler
    if not settings.SCHEDULER_ENABLED:
        logger.info("Scheduler deshabilitado (SCHEDULER_ENABLED=False).")
        return
    if _scheduler is not None:
        return
    try:
        from apscheduler.schedulers.background import BackgroundScheduler
        from apscheduler.triggers.cron import CronTrigger
    except Exception as e:  # noqa: BLE001
        logger.warning(
            "APScheduler no disponible (%s). Las notificaciones preventivas solo "
            "correrán vía POST /cron/notificaciones.", e)
        return

    try:
        _scheduler = BackgroundScheduler(timezone="UTC")
        _scheduler.add_job(
            _run_job,
            CronTrigger(hour=settings.NOTIF_HORA_UTC, minute=0),
            id="barrido_preventivo",
            replace_existing=True,
            misfire_grace_time=3600,
        )
        _scheduler.start()
        logger.info("Scheduler de notificaciones iniciado (diario %02d:00 UTC).",
                    settings.NOTIF_HORA_UTC)
    except Exception as e:  # noqa: BLE001
        logger.error("No se pudo iniciar el scheduler: %s", e)
        _scheduler = None


def shutdown_scheduler():
    """Detiene el scheduler si está activo."""
    global _scheduler
    if _scheduler is not None:
        try:
            _scheduler.shutdown(wait=False)
        except Exception:  # noqa: BLE001
            pass
        _scheduler = None
