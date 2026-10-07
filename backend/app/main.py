import logging
import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.router import api_router

# Logging de la aplicación.
#
# uvicorn configura SUS loggers ("uvicorn", "uvicorn.access") y deja el logger
# raíz como viene, en WARNING y sin handlers. Resultado: todo lo que la
# aplicación registraba con logger.info() —el código 2FA, el cuerpo de los
# correos que no se pudieron enviar, el enlace de recuperación de contraseña—
# no aparecía en el log del contenedor. Eso vuelve indiagnosticable justo el
# caso que importa: el SMTP caído. Por eso varias partes del código terminaron
# usando print() para que algo se viera.
#
# `force=True` reemplaza handlers previos: sin eso, si algo ya configuró el
# logger raíz, basicConfig no haría nada y el problema volvería en silencio.
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
    stream=sys.stdout,
    force=True,
)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: configure properly in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.on_event("startup")
def _startup_scheduler():
    """Arranca el scheduler de notificaciones preventivas."""
    from app.services.scheduler import start_scheduler
    start_scheduler()


@app.on_event("startup")
def _startup_transcription_check():
    """
    Deja asentado en el log si la transcripción de notas de voz quedó activa.
    Un proveedor configurado sin clave es un error de despliegue silencioso: el
    audio se sigue guardando como evidencia, pero nunca se convierte en texto.
    """
    from app.services import transcription
    st = transcription.status()
    if st["habilitada"]:
        print(f"[transcripcion] activa — proveedor={st['proveedor']} modelo={st['modelo']} idioma={st['idioma']}")
    else:
        print(f"[transcripcion] INACTIVA — {st['detalle']}")


@app.on_event("shutdown")
def _shutdown_scheduler():
    from app.services.scheduler import shutdown_scheduler
    shutdown_scheduler()


@app.get("/health")
def health_check():
    return {"status": "ok"}

