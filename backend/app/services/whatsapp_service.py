"""
Aviso por WhatsApp usando la Cloud API de Meta (opcional).

Si WHATSAPP_TOKEN / WHATSAPP_PHONE_ID / WHATSAPP_NOTIFY_TO están configurados,
`send_text()` envía un mensaje de texto al número comercial. Si no, degrada de
forma segura devolviendo False (nunca lanza excepción).

Nota: la Cloud API sólo permite iniciar conversaciones con plantillas aprobadas
fuera de la ventana de 24 h. Para el aviso interno al propio equipo comercial
—que normalmente ya interactuó con el número— el mensaje de texto simple es
suficiente; si tu caso requiere plantilla, ajustá el payload a `type: template`.
"""

import logging
import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


def is_configured() -> bool:
    return bool(settings.WHATSAPP_TOKEN and settings.WHATSAPP_PHONE_ID and settings.WHATSAPP_NOTIFY_TO)


async def send_text(body: str, to: str | None = None) -> bool:
    """Envía un mensaje de texto por WhatsApp Cloud API. Devuelve True si fue aceptado."""
    if not is_configured():
        return False

    to_number = (to or settings.WHATSAPP_NOTIFY_TO or "").lstrip("+")
    url = f"https://graph.facebook.com/v19.0/{settings.WHATSAPP_PHONE_ID}/messages"
    headers = {
        "Authorization": f"Bearer {settings.WHATSAPP_TOKEN}",
        "Content-Type": "application/json",
    }
    payload = {
        "messaging_product": "whatsapp",
        "to": to_number,
        "type": "text",
        "text": {"body": body[:4096]},
    }

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(url, headers=headers, json=payload)
        if resp.status_code < 300:
            logger.info(f"WhatsApp enviado a {to_number}")
            return True
        logger.error(f"WhatsApp API respondió {resp.status_code}: {resp.text}")
        return False
    except Exception as e:  # noqa: BLE001
        logger.error(f"Error enviando WhatsApp: {e}")
        return False
