"""
Transcripción de audio a texto (evidencia de voz del auditor en campo).

El auditor puede grabar una nota de voz en cada punto de control en lugar de
escribir la observación. El audio se guarda siempre como evidencia en el bucket
del tenant; la conversión a texto se ejecuta al finalizar (firmar) la auditoría.

El proveedor es enchufable vía configuración para no atar la plataforma a un
servicio puntual:

    TRANSCRIPTION_PROVIDER = "openai"   # API compatible con /v1/audio/transcriptions
    TRANSCRIPTION_API_KEY  = "sk-..."
    TRANSCRIPTION_MODEL    = "whisper-1"
    TRANSCRIPTION_API_URL  = "https://api.openai.com/v1/audio/transcriptions"

Si no hay proveedor configurado, la función devuelve un estado 'no_disponible'
en lugar de fallar: el audio queda igualmente adjunto y se puede transcribir más
tarde con el endpoint de re-proceso, sin perder la evidencia.
"""
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

# Estados posibles de la transcripción de una respuesta.
ESTADO_PENDIENTE = "pendiente"
ESTADO_OK = "ok"
ESTADO_ERROR = "error"
ESTADO_NO_DISPONIBLE = "no_disponible"


def is_enabled() -> bool:
    """True si hay un proveedor de transcripción configurado y utilizable."""
    provider = (settings.TRANSCRIPTION_PROVIDER or "none").strip().lower()
    return provider not in ("", "none", "off", "disabled") and bool(settings.TRANSCRIPTION_API_KEY)


def transcribe(audio_bytes: bytes, filename: str = "audio.webm") -> tuple[str, str | None]:
    """
    Convierte un audio a texto.

    Devuelve (estado, texto):
      ("ok", "…")             transcripción exitosa
      ("no_disponible", None) no hay proveedor configurado
      ("error", None)         el proveedor falló (se puede reintentar)
    """
    if not is_enabled():
        return ESTADO_NO_DISPONIBLE, None

    if not audio_bytes:
        return ESTADO_ERROR, None

    max_bytes = max(1, settings.TRANSCRIPTION_MAX_MB) * 1024 * 1024
    if len(audio_bytes) > max_bytes:
        logger.warning("Audio de %s bytes supera el máximo de transcripción (%s MB).",
                       len(audio_bytes), settings.TRANSCRIPTION_MAX_MB)
        return ESTADO_ERROR, None

    try:
        import httpx

        files = {"file": (filename, audio_bytes, "application/octet-stream")}
        data = {"model": settings.TRANSCRIPTION_MODEL}
        if settings.TRANSCRIPTION_LANGUAGE:
            data["language"] = settings.TRANSCRIPTION_LANGUAGE

        resp = httpx.post(
            settings.TRANSCRIPTION_API_URL,
            headers={"Authorization": f"Bearer {settings.TRANSCRIPTION_API_KEY}"},
            files=files,
            data=data,
            timeout=settings.TRANSCRIPTION_TIMEOUT,
        )
        if resp.status_code >= 400:
            logger.error("Transcripción rechazada (%s): %s", resp.status_code, resp.text[:300])
            return ESTADO_ERROR, None

        payload = resp.json()
        texto = (payload.get("text") or "").strip()
        if not texto:
            return ESTADO_ERROR, None
        return ESTADO_OK, texto
    except Exception as exc:  # noqa: BLE001 — una transcripción nunca debe romper el cierre
        logger.error("Error transcribiendo audio: %s", exc)
        return ESTADO_ERROR, None
