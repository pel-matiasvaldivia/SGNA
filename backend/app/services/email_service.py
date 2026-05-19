import asyncio
import smtplib
from email.mime.text import MIMEText
from email.header import Header
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

def _send_smtp_email_sync(email_to: str, subject: str, body_text: str) -> bool:
    if not settings.SMTP_HOST:
        logger.warning("SMTP_HOST no configurado. El email se guardará en logs.")
        return False

    msg = MIMEText(body_text, "plain", "utf-8")
    msg["Subject"] = Header(subject, "utf-8")
    msg["From"] = settings.FROM_EMAIL
    msg["To"] = email_to

    try:
        port = settings.SMTP_PORT or 587
        if port == 465:
            server = smtplib.SMTP_SSL(settings.SMTP_HOST, port, timeout=10)
        else:
            server = smtplib.SMTP(settings.SMTP_HOST, port, timeout=10)
            server.ehlo()
            server.starttls()
            server.ehlo()

        if settings.SMTP_USER and settings.SMTP_PASS:
            server.login(settings.SMTP_USER, settings.SMTP_PASS)

        server.sendmail(settings.FROM_EMAIL, [email_to], msg.as_string())
        server.quit()
        logger.info(f"Email enviado exitosamente a {email_to}")
        return True
    except Exception as e:
        logger.error(f"Error al enviar email por SMTP: {str(e)}")
        return False

async def send_2fa_email(email_to: str, code: str):
    """
    Sends the 2FA code via SMTP if configured, always logging it to console for fallback.
    """
    subject = "Tu código de acceso - AuditoríasEnLínea"
    body = f"""Hola,

Tu código de acceso es: {code} — Válido por 10 minutos.

Si no solicitaste este código, puedes ignorar este correo."""

    # Always log to docker console so user has a 100% reliable fallback to retrieve the code
    logger.info(f"=== [CÓDIGO 2FA GENERADO] ===")
    logger.info(f"Para: {email_to}")
    logger.info(f"Código: {code}")
    logger.info(f"=============================")

    if settings.SMTP_HOST:
        return await asyncio.to_thread(_send_smtp_email_sync, email_to, subject, body)
    
    return True
