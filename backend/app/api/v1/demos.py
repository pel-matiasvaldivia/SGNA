"""
Agendamiento automático de demos desde la landing (endpoint público).

Flujo:
  1. Valida los datos del interesado.
  2. Si hay fecha/hora y Google Calendar está configurado, crea un evento con
     Google Meet e invita al comercial y al interesado (la invitación sale por
     email automáticamente vía Google).
  3. Envía un aviso interno al equipo comercial (SALES_EMAIL) y un correo de
     confirmación al interesado (SMTP del sistema).
  4. Si WhatsApp Cloud API está configurado, avisa también por WhatsApp.

Todo degrada de forma segura: si falta alguna integración, el resto sigue
funcionando y la respuesta indica qué se concretó.
"""

import logging

from fastapi import APIRouter
from app.schemas.demo import DemoRequest, DemoResponse
from app.core.config import settings
from app.services import email_service, google_calendar_service, whatsapp_service

logger = logging.getLogger(__name__)
router = APIRouter()


def _fmt_when(req: DemoRequest) -> str:
    if not req.when:
        return "a coordinar"
    try:
        return req.when.strftime("%d/%m/%Y %H:%M")
    except Exception:  # noqa: BLE001
        return str(req.when)


@router.post("", response_model=DemoResponse)
@router.post("/", response_model=DemoResponse, include_in_schema=False)
async def solicitar_demo(req: DemoRequest) -> DemoResponse:
    when_str = _fmt_when(req)
    contacto = f"{req.nombre}" + (f" ({req.empresa})" if req.empresa else "")

    # 1) Evento con Google Meet (si hay fecha y credenciales)
    meet_link = None
    event_link = None
    calendar_created = False
    if req.when and google_calendar_service.is_configured():
        result = google_calendar_service.create_meet_event(
            summary=f"Demo — Auditorías en Línea · {req.nombre}",
            description=(
                f"Demo del sistema Auditorías en Línea.\n\n"
                f"Solicitante: {contacto}\n"
                f"Email: {req.email}\n"
                f"Teléfono: {req.telefono or '-'}\n\n"
                f"Mensaje: {req.mensaje or '-'}"
            ),
            start=req.when,
            duration_minutes=30,
            attendee_emails=[settings.SALES_EMAIL, str(req.email)],
        )
        if result:
            meet_link = result.get("meet_link")
            event_link = result.get("event_link")
            calendar_created = True

    # 2) Aviso interno al equipo comercial
    meet_line = f"\nGoogle Meet: {meet_link}" if meet_link else ""
    internal_body = (
        f"Nueva solicitud de demo desde la web.\n\n"
        f"Nombre: {req.nombre}\n"
        f"Empresa: {req.empresa or '-'}\n"
        f"Email: {req.email}\n"
        f"Teléfono: {req.telefono or '-'}\n"
        f"Preferencia: {when_str}\n"
        f"Mensaje: {req.mensaje or '-'}\n"
        f"{meet_line}"
        f"{chr(10) + 'Evento: ' + event_link if event_link else ''}"
    )
    email_sent = await email_service.send_email(
        settings.SALES_EMAIL,
        f"[Demo] {contacto} solicitó una demo",
        internal_body,
    )

    # 3) Confirmación al interesado
    if meet_link:
        confirm_body = (
            f"Hola {req.nombre.split(' ')[0]},\n\n"
            f"¡Gracias por tu interés en Auditorías en Línea! Agendamos tu demo:\n\n"
            f"Fecha y hora: {when_str}\n"
            f"Enlace Google Meet: {meet_link}\n\n"
            f"Recibirás también la invitación en tu calendario. Si necesitás reprogramar, "
            f"respondé este correo o escribinos por WhatsApp.\n\n"
            f"Equipo Auditorías en Línea"
        )
    else:
        confirm_body = (
            f"Hola {req.nombre.split(' ')[0]},\n\n"
            f"¡Gracias por tu interés en Auditorías en Línea! Recibimos tu solicitud de demo"
            f" (preferencia: {when_str}). Nuestro equipo comercial se pondrá en contacto a la "
            f"brevedad para confirmar el horario y enviarte el enlace de la reunión.\n\n"
            f"Equipo Auditorías en Línea"
        )
    await email_service.send_email(
        str(req.email),
        "Tu demo de Auditorías en Línea",
        confirm_body,
    )

    # 4) Aviso por WhatsApp (opcional)
    whatsapp_sent = False
    if whatsapp_service.is_configured():
        wa_body = (
            f"📅 Nueva demo solicitada\n"
            f"Nombre: {req.nombre}\n"
            f"Empresa: {req.empresa or '-'}\n"
            f"Email: {req.email}\n"
            f"Tel: {req.telefono or '-'}\n"
            f"Preferencia: {when_str}"
            + (f"\nMeet: {meet_link}" if meet_link else "")
        )
        whatsapp_sent = await whatsapp_service.send_text(wa_body)

    # Mensaje para el usuario
    if meet_link:
        message = "¡Demo agendada! Te enviamos la invitación con el enlace de Google Meet por email."
    elif email_sent:
        message = "¡Solicitud recibida! Nuestro equipo comercial te contactará para confirmar el horario."
    else:
        message = "¡Solicitud registrada! Te contactaremos a la brevedad."

    return DemoResponse(
        ok=True,
        meet_link=meet_link,
        event_link=event_link,
        calendar_created=calendar_created,
        email_sent=email_sent,
        whatsapp_sent=whatsapp_sent,
        message=message,
    )
