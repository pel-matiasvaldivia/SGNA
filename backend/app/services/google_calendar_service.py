"""
Servicio de Google Calendar para agendar demos con Google Meet automáticamente.

Usa una cuenta de servicio con delegación de dominio (domain-wide delegation)
para crear el evento en nombre del usuario comercial (GOOGLE_CALENDAR_ORGANIZER),
adjuntar un enlace de Google Meet y enviar la invitación a los asistentes.

Si las credenciales no están configuradas —o la librería de Google no está
instalada— el servicio degrada de forma segura: `is_configured()` devuelve False
y `create_meet_event()` devuelve None, sin lanzar excepciones.
"""

import json
import uuid
import logging
from datetime import datetime, timedelta
from typing import Optional

from app.core.config import settings

logger = logging.getLogger(__name__)

# Scope mínimo para crear eventos.
_SCOPES = ["https://www.googleapis.com/auth/calendar.events"]


def is_configured() -> bool:
    """True si hay credenciales suficientes para intentar crear el evento."""
    has_creds = bool(settings.GOOGLE_SERVICE_ACCOUNT_JSON or settings.GOOGLE_SERVICE_ACCOUNT_FILE)
    return has_creds and bool(settings.GOOGLE_CALENDAR_ORGANIZER)


def _load_credentials():
    """Carga las credenciales de la cuenta de servicio con delegación al organizador."""
    from google.oauth2 import service_account  # import perezoso

    if settings.GOOGLE_SERVICE_ACCOUNT_JSON:
        info = json.loads(settings.GOOGLE_SERVICE_ACCOUNT_JSON)
        creds = service_account.Credentials.from_service_account_info(info, scopes=_SCOPES)
    else:
        creds = service_account.Credentials.from_service_account_file(
            settings.GOOGLE_SERVICE_ACCOUNT_FILE, scopes=_SCOPES
        )
    # Delegación de dominio: actuar como el usuario comercial.
    return creds.with_subject(settings.GOOGLE_CALENDAR_ORGANIZER)


def create_meet_event(
    *,
    summary: str,
    description: str,
    start: datetime,
    duration_minutes: int = 30,
    attendee_emails: Optional[list[str]] = None,
) -> Optional[dict]:
    """
    Crea un evento con Google Meet y devuelve:
        {"meet_link": str|None, "event_link": str|None, "event_id": str}
    o None si no está configurado o si ocurre cualquier error (se loguea).
    """
    if not is_configured():
        return None

    try:
        from googleapiclient.discovery import build  # import perezoso

        creds = _load_credentials()
        service = build("calendar", "v3", credentials=creds, cache_discovery=False)

        end = start + timedelta(minutes=duration_minutes)
        tz = settings.DEMO_TIMEZONE
        attendees = [{"email": e} for e in (attendee_emails or []) if e]

        body = {
            "summary": summary,
            "description": description,
            "start": {"dateTime": start.isoformat(), "timeZone": tz},
            "end": {"dateTime": end.isoformat(), "timeZone": tz},
            "attendees": attendees,
            "conferenceData": {
                "createRequest": {
                    "requestId": str(uuid.uuid4()),
                    "conferenceSolutionKey": {"type": "hangoutsMeet"},
                }
            },
            "reminders": {"useDefault": True},
        }

        event = (
            service.events()
            .insert(
                calendarId=settings.GOOGLE_CALENDAR_ID,
                body=body,
                conferenceDataVersion=1,
                sendUpdates="all",  # envía la invitación por email a los asistentes
            )
            .execute()
        )

        meet_link = event.get("hangoutLink")
        # Fallback: buscar el enlace en los entryPoints de conferenceData.
        if not meet_link:
            for ep in event.get("conferenceData", {}).get("entryPoints", []):
                if ep.get("entryPointType") == "video" and ep.get("uri"):
                    meet_link = ep["uri"]
                    break

        return {
            "meet_link": meet_link,
            "event_link": event.get("htmlLink"),
            "event_id": event.get("id"),
        }
    except Exception as e:  # noqa: BLE001 — nunca romper el flujo de agendamiento
        logger.error(f"No se pudo crear el evento de Google Calendar: {e}")
        return None
