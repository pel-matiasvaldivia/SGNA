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
    
    # MCP
    MCP_CLAUDE_API_KEY: str | None = None
    
    # S3 / MinIO
    MINIO_ENDPOINT: str = "http://localhost:9000"
    MINIO_ACCESS_KEY: str = "minio_admin"
    MINIO_SECRET_KEY: str = "minio_secret"
    MINIO_SECURE: bool = False
    
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra='ignore')

settings = Settings()
