from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "AuditoríasEnLínea API"
    API_V1_STR: str = "/api/v1"
    
    # DB
    DATABASE_URL: str
    
    # Redis
    REDIS_URL: str
    
    # Auth
    JWT_SECRET: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Email
    SMTP_HOST: str | None = None
    SMTP_PORT: int | None = None
    SMTP_USER: str | None = None
    SMTP_PASS: str | None = None
    FROM_EMAIL: str = "noreply@auditoriasenlinea.com.ar"

    # Notificaciones transaccionales del sistema (alta de tenant, invitaciones,
    # auditorías, calibraciones, mantenimiento, vencimientos...). Todas salen
    # desde esta casilla para separarlas del correo de login/comercial.
    NOTIFICATIONS_FROM_EMAIL: str = "notificaciones@auditoriasenlinea.com.ar"
    NOTIFICATIONS_ENABLED: bool = True
    APP_BASE_URL: str = "https://sgna.auditoriasenlinea.com.ar"

    # Barrido preventivo (avisos "por vencer"): umbrales en días de anticipación.
    NOTIF_CALIBRACION_DIAS: int = 15
    NOTIF_MANTENIMIENTO_DIAS: int = 7
    NOTIF_APROBACION_DIAS: int = 3

    # Scheduler interno (APScheduler) que ejecuta el barrido preventivo a diario.
    SCHEDULER_ENABLED: bool = True
    NOTIF_HORA_UTC: int = 10  # 10:00 UTC ≈ 07:00 America/Argentina
    # Secreto para el endpoint POST /cron/notificaciones (disparo externo).
    # Si queda vacío, el endpoint queda deshabilitado (solo corre el scheduler interno).
    CRON_SECRET: str | None = None

    # Comercial / agendamiento de demos
    SALES_EMAIL: str = "ventas@auditoriasenlinea.com.ar"
    DEMO_TIMEZONE: str = "America/Argentina/Mendoza"

    # Google Calendar (agendamiento automático con Google Meet)
    # Cuenta de servicio con delegación de dominio. Se puede pasar el JSON completo
    # en GOOGLE_SERVICE_ACCOUNT_JSON o una ruta de archivo en GOOGLE_SERVICE_ACCOUNT_FILE.
    GOOGLE_SERVICE_ACCOUNT_JSON: str | None = None
    GOOGLE_SERVICE_ACCOUNT_FILE: str | None = None
    GOOGLE_CALENDAR_ORGANIZER: str | None = None  # usuario a impersonar (ej: ventas@...)
    GOOGLE_CALENDAR_ID: str = "primary"

    # WhatsApp Cloud API (Meta) — aviso automático opcional
    WHATSAPP_TOKEN: str | None = None
    WHATSAPP_PHONE_ID: str | None = None
    WHATSAPP_NOTIFY_TO: str | None = None  # número destino (ej: 5492615708516)

    # MCP
    MCP_CLAUDE_API_KEY: str | None = None

    # Transcripción de audio (evidencia de voz del auditor en campo).
    # El audio siempre se guarda como evidencia; la transcripción a texto se
    # ejecuta al finalizar la auditoría si hay un proveedor configurado.
    # Proveedores: "openai" (Whisper / gpt-4o-transcribe) | "none" (deshabilitado).
    TRANSCRIPTION_PROVIDER: str = "openai"
    # La clave se toma de TRANSCRIPTION_API_KEY o, si está vacía, de OPENAI_API_KEY.
    TRANSCRIPTION_API_KEY: str | None = None
    OPENAI_API_KEY: str | None = None
    TRANSCRIPTION_MODEL: str = "whisper-1"
    TRANSCRIPTION_API_URL: str = "https://api.openai.com/v1/audio/transcriptions"
    TRANSCRIPTION_LANGUAGE: str = "es"
    TRANSCRIPTION_TIMEOUT: int = 120
    TRANSCRIPTION_MAX_MB: int = 25
    
    # S3 / MinIO
    MINIO_ENDPOINT: str = "http://localhost:9000"
    MINIO_ACCESS_KEY: str = "minio_admin"
    MINIO_SECRET_KEY: str = "minio_secret"
    MINIO_SECURE: bool = False
    
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra='ignore')

settings = Settings()
