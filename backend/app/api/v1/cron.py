# -*- coding: utf-8 -*-
"""
Disparo externo del barrido preventivo de notificaciones.

Pensado para llamarse una vez al día desde un cron externo, n8n o un
uptime-monitor. Está protegido por el header ``X-Cron-Secret``, que debe
coincidir con ``settings.CRON_SECRET``. Si el secreto no está configurado, el
endpoint queda deshabilitado (503) y el barrido solo corre por el scheduler interno.
"""
from fastapi import APIRouter, Header, HTTPException, status
from starlette.concurrency import run_in_threadpool

from app.core.config import settings
from app.services.notifications import run_preventive_sweep

router = APIRouter()


@router.post("/notificaciones")
async def disparar_notificaciones(x_cron_secret: str | None = Header(default=None)):
    """Ejecuta el barrido preventivo y devuelve el resumen de lo enviado."""
    if not settings.CRON_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="El endpoint de cron está deshabilitado (falta configurar CRON_SECRET).",
        )
    if not x_cron_secret or x_cron_secret != settings.CRON_SECRET:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Secreto de cron inválido.",
        )
    # El barrido es síncrono (SQL + SMTP); lo corremos en un hilo para no
    # bloquear el bucle de eventos.
    summary = await run_in_threadpool(run_preventive_sweep)
    return {"ok": True, "resumen": summary}
