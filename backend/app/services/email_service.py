import asyncio
import socket
import ssl
import smtplib
from email.mime.text import MIMEText
from email.header import Header
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)


def test_smtp_connection(
    host: str,
    port,
    user: str | None,
    password: str | None,
    encryption: str | None,
    from_email: str,
    to_email: str,
) -> dict:
    """
    Attempts a real connection + authentication + test send against the given SMTP
    settings and returns a structured diagnostic result:
        {"success": bool, "message": str, "detail": str}

    Never raises: any failure is captured and translated into a human-readable
    reason (in Spanish) so the caller can show exactly what went wrong.
    """
    if not host:
        return {"success": False, "message": "No hay servidor SMTP configurado (falta el host).", "detail": ""}

    encryption = (encryption or "tls").lower()

    # Resolve the port: explicit value wins, otherwise a sensible default per mode.
    try:
        port_num = int(port) if str(port).strip() else (465 if encryption == "ssl" else 587)
    except (TypeError, ValueError):
        return {"success": False, "message": f"Puerto SMTP inválido: '{port}'.", "detail": ""}

    server = None
    try:
        if encryption == "ssl":
            context = ssl.create_default_context()
            server = smtplib.SMTP_SSL(host, port_num, timeout=15, context=context)
        else:
            server = smtplib.SMTP(host, port_num, timeout=15)

        server.ehlo()
        if encryption == "tls":
            context = ssl.create_default_context()
            server.starttls(context=context)
            server.ehlo()

        if user and password:
            server.login(user, password)

        subject = "Prueba de configuración SMTP - AuditoríasEnLínea"
        body = (
            "Este es un correo de prueba enviado desde AuditoríasEnLínea para verificar "
            "la configuración del servidor SMTP de tu organización.\n\n"
            "Si lo recibiste, la configuración es correcta."
        )
        msg = MIMEText(body, "plain", "utf-8")
        msg["Subject"] = Header(subject, "utf-8")
        msg["From"] = from_email
        msg["To"] = to_email

        server.sendmail(from_email, [to_email], msg.as_string())

        return {
            "success": True,
            "message": f"Conexión y envío exitosos. Se envió un correo de prueba a {to_email}.",
            "detail": f"{host}:{port_num} ({encryption.upper()})",
        }

    except smtplib.SMTPAuthenticationError as e:
        return {
            "success": False,
            "message": "Autenticación rechazada: usuario o contraseña incorrectos.",
            "detail": f"{e.smtp_code} {e.smtp_error.decode(errors='ignore') if isinstance(e.smtp_error, bytes) else e.smtp_error}",
        }
    except (socket.gaierror,) as e:
        return {
            "success": False,
            "message": f"No se pudo resolver el host '{host}'. Revisá el nombre del servidor.",
            "detail": str(e),
        }
    except (ConnectionRefusedError,) as e:
        return {
            "success": False,
            "message": f"Conexión rechazada en {host}:{port_num}. Revisá el puerto y que el servidor acepte conexiones.",
            "detail": str(e),
        }
    except (socket.timeout, TimeoutError) as e:
        return {
            "success": False,
            "message": f"Tiempo de espera agotado conectando a {host}:{port_num}. Puede ser un firewall o un puerto incorrecto.",
            "detail": str(e),
        }
    except ssl.SSLError as e:
        return {
            "success": False,
            "message": "Error TLS/SSL. Revisá el modo de cifrado (STARTTLS/SSL) y el puerto (587 para STARTTLS, 465 para SSL).",
            "detail": str(e),
        }
    except smtplib.SMTPServerDisconnected as e:
        return {
            "success": False,
            "message": "El servidor cerró la conexión inesperadamente. Suele indicar un modo de cifrado o puerto incorrecto.",
            "detail": str(e),
        }
    except smtplib.SMTPException as e:
        return {"success": False, "message": f"Error SMTP: {str(e)}", "detail": str(e)}
    except OSError as e:
        return {"success": False, "message": f"No se pudo conectar a {host}:{port_num}: {str(e)}", "detail": str(e)}
    except Exception as e:  # noqa: BLE001 - last resort, never leak a 500 to the UI
        return {"success": False, "message": f"Error inesperado: {str(e)}", "detail": str(e)}
    finally:
        if server is not None:
            try:
                server.quit()
            except Exception:
                pass

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
