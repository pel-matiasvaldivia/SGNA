import random
from datetime import timedelta
from typing import List
import redis
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import verify_password, create_access_token
from app.db.session import get_db
from app.models.user import User
from app.models.tenant import Tenant
from app.schemas.auth import LoginRequest, LoginResponse, Verify2FARequest, Token, UserResponse, TenantOption
from app.services.email_service import send_2fa_email
from app.api.deps import get_tenant_db_from_token, get_current_active_user
from app.core.membership import memberships_of, tenants_of, users_of_tenant

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

    # Organizaciones de la persona. Se devuelven con la contraseña ya
    # verificada, para que el front pueda preguntar a cuál quiere entrar.
    organizaciones = tenants_of(db, user)
    opciones = [TenantOption(slug=t.slug, name=t.name) for t in organizaciones]

    # El 2FA se decide por la organización de origen: es la única conocida en
    # este paso, y la preferencia de 2FA es de la cuenta, no de la sesión.
    tenant = db.query(Tenant).filter(Tenant.id == user.tenant_id).first()
    # Default to True, unless tenant explicitly disabled it
    tenant_2fa_enabled = tenant.two_factor_enabled if tenant else True

    # Bypass 2FA if email is superadmin OR if tenant disabled 2FA
    if data.email == "gerencia@auditoriasenlinea.com.ar" or not tenant_2fa_enabled:
        store_2fa_code(data.email, "BYPASS")
        return LoginResponse(
            message="Acceso directo concedido.",
            requires_2fa=False,
            email=data.email,
            tenants=opciones,
        )

    # Generate 6-digit 2FA code
    code = f"{random.randint(100000, 999999)}"
    store_2fa_code(data.email, code)

    # Send 2FA email
    await send_2fa_email(data.email, code)

    return LoginResponse(
        message="Código de verificación 2FA enviado a su correo.",
        requires_2fa=True,
        email=data.email,
        tenants=opciones,
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

    # Organización de la sesión. El código ya se validó arriba: recién ahora se
    # mira la pertenencia, para no revelar en qué organizaciones está un correo
    # a quien no superó el 2FA.
    pertenencias = memberships_of(db, user)

    if not pertenencias:
        # Superadmin de plataforma: sin organización propia, opera por
        # impersonación desde la consola.
        tenant_slug, role = "public", user.role
    else:
        if data.tenant_slug:
            destino = next(
                (
                    m
                    for m in pertenencias
                    if (t := db.query(Tenant).filter(Tenant.id == m.tenant_id).first())
                    and t.slug == data.tenant_slug
                ),
                None,
            )
            if not destino:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="No tenés acceso a esa organización.",
                )
        elif len(pertenencias) == 1:
            destino = pertenencias[0]
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Elegí a qué organización querés ingresar.",
            )

        tenant = db.query(Tenant).filter(Tenant.id == destino.tenant_id).first()
        tenant_slug = tenant.slug if tenant else "public"
        # El rol es el de esa organización, no el de la cuenta.
        role = destino.role

    # Create access token containing subject (user email), tenant_slug, and user role
    access_token = create_access_token(
        subject=user.email,
        tenant_slug=tenant_slug,
        role=role,
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        tenant_slug=tenant_slug,
        role=role
    )


@router.get("/users", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    return users_of_tenant(db, current_user.tenant_id).all()
