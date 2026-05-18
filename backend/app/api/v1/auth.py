import random
from datetime import timedelta
import redis
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import verify_password, create_access_token
from app.db.session import get_db
from app.models.user import User
from app.models.tenant import Tenant
from app.schemas.auth import LoginRequest, LoginResponse, Verify2FARequest, Token
from app.services.email_service import send_2fa_email

router = APIRouter()

# Initialize Redis client (fallback if Redis is not yet up or connection fails)
try:
    redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
except Exception:
    redis_client = None

# In-memory store for fallback if Redis is not configured/accessible during dev
fallback_2fa_store = {}

def store_2fa_code(email: str, code: str):
    if redis_client:
        try:
            redis_client.setex(f"2fa:{email}", 600, code)  # 10 minutes TTL
            return
        except Exception:
            pass
    fallback_2fa_store[email] = code

def verify_2fa_code(email: str, code: str) -> bool:
    if redis_client:
        try:
            stored_code = redis_client.get(f"2fa:{email}")
            if stored_code and stored_code == code:
                redis_client.delete(f"2fa:{email}")
                return True
            return False
        except Exception:
            pass
    
    stored_code = fallback_2fa_store.get(email)
    if stored_code and stored_code == code:
        del fallback_2fa_store[email]
        return True
    return False


@router.post("/login", response_model=LoginResponse)
async def login(data: LoginRequest, db: Session = Depends(get_db)):
    # Find user
    user = db.query(User).filter(User.email == data.email, User.active == True).first()
    if not user or not user.password_hash or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
        )

    # Generate 6-digit 2FA code
    code = f"{random.randint(100000, 999999)}"
    store_2fa_code(data.email, code)

    # Send 2FA email
    await send_2fa_email(data.email, code)

    return LoginResponse(
        message="Código de verificación 2FA enviado a su correo.",
        requires_2fa=True,
        email=data.email
    )


@router.post("/verify-2fa", response_model=Token)
async def verify_2fa(data: Verify2FARequest, db: Session = Depends(get_db)):
    # Verify code
    if not verify_2fa_code(data.email, data.code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Código de verificación incorrecto o expirado",
        )

    # Fetch user & tenant info to build JWT
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )

    tenant = db.query(Tenant).filter(Tenant.id == user.tenant_id).first()
    tenant_slug = tenant.slug if tenant else "public"

    # Create access token containing subject (user email) and tenant_slug
    access_token = create_access_token(
        subject=user.email,
        tenant_slug=tenant_slug,
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        tenant_slug=tenant_slug
    )
