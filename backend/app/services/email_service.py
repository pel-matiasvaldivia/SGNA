import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

async def send_2fa_email(email_to: str, code: str):
    """
    Simulates sending a 2FA code via email.
    In a real scenario, this would integrate with Resend/SendGrid/SMTP.
    """
    # Simulate email formatting
    subject = "Tu código de acceso - AuditoríasEnLínea"
    body = f"""
    Hola,
    
    Tu código de acceso es: {code} — Válido por 10 minutos.
    
    Si no solicitaste este código, puedes ignorar este correo.
    """
    
    # Just logging for development purposes
    logger.info(f"--- MOCK EMAIL ---")
    logger.info(f"To: {email_to}")
    logger.info(f"Subject: {subject}")
    logger.info(f"Body: {body}")
    logger.info(f"------------------")
    
    # TODO: Implement real SMTP or Resend logic using settings.SMTP_HOST
    return True
