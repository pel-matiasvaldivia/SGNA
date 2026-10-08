import logging
import random
from datetime import datetime, timedelta, timezone
from typing import List
import redis
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    create_access_token, generar_token_recuperacion, get_password_hash,
    hash_token_recuperacion, verify_password,
)
from app.db.session import get_db
from app.models.password_reset import PasswordResetToken
from app.models.user import User
from app.models.tenant import Tenant
from app.schemas.auth import (
    LoginRequest, LoginResponse, RecuperacionRequest, RecuperacionResponse,
    RestablecerPasswordRequest, TenantOption, Token, TokenRecuperacionEstado,
    UserResponse, Verify2FARequest,
)
from app.services.email_service import send_2fa_email
from app.services import notifications
from app.api.deps import get_tenant_db_from_token, get_current_active_user
from app.core.membership import memberships_of, tenants_of, users_of_tenant

logger = logging.getLogger(__name__)

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


# --------------------------------------------------------------------------- #
#  Recuperación de contraseña                                                  #
# --------------------------------------------------------------------------- #
# Hasta ahora, el auditor de campo que olvidaba su contraseña dependía de que un
# administrador se la cambiara a mano: en una auditoría en planta, eso es quedar
# afuera del trabajo del día. El flujo es el estándar: se manda un enlace de un
# solo uso al correo de la cuenta, y quien demuestra tener ese correo elige una
# contraseña nueva. No se pide la anterior —justamente es la que no se recuerda.

# Siempre la misma respuesta, exista o no la cuenta. Si dijéramos "ese correo no
# está registrado", el formulario —que es público y no pide autenticación—
# serviría para averiguar quién trabaja en la plataforma.
_RESPUESTA_RECUPERACION = (
    "Si el correo corresponde a una cuenta activa, te enviamos un enlace para "
    "elegir una contraseña nueva. Revisá tu bandeja de entrada y la carpeta de "
    "spam; el enlace vence en {horas} horas."
)


def _mensaje_recuperacion() -> str:
    horas = max(1, round(settings.PASSWORD_RESET_TTL_MINUTES / 60))
    return _RESPUESTA_RECUPERACION.format(horas=horas)


def _email_parcial(email: str) -> str:
    """
    Tapa el correo dejando lo justo para reconocerlo: ``auditor@empresa.com``
    queda como ``au***or@empresa.com``. Confirma de qué cuenta es el enlace sin
    publicar la dirección entera en la pantalla.
    """
    usuario, _, dominio = email.partition("@")
    if not dominio:
        return "***"
    if len(usuario) <= 4:
        visible = usuario[:1]
        return f"{visible}***@{dominio}"
    return f"{usuario[:2]}***{usuario[-2:]}@{dominio}"


def _token_vigente(db: Session, token: str) -> PasswordResetToken | None:
    """
    Busca el vale por la huella del token y lo devuelve sólo si sigue sirviendo.

    La consulta va por ``token_hash`` (indexado y único): el valor en claro no
    está en la base, así que no hay forma de recorrer los vales vigentes y
    deducir los enlaces enviados.
    """
    fila = db.query(PasswordResetToken).filter(
        PasswordResetToken.token_hash == hash_token_recuperacion(token)
    ).first()
    if not fila or fila.used_at is not None:
        return None
    if fila.expires_at <= datetime.now(timezone.utc):
        return None
    return fila


@router.post("/recuperar-password", response_model=RecuperacionResponse)
def recuperar_password(
    data: RecuperacionRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """Pide el enlace de recuperación. Responde igual exista o no la cuenta."""
    respuesta = RecuperacionResponse(message=_mensaje_recuperacion())

    user = db.query(User).filter(
        User.email == data.email.lower().strip(),
        User.active == True,  # noqa: E712
    ).first()
    if not user:
        return respuesta

    ahora = datetime.now(timezone.utc)

    # Espera mínima entre dos pedidos de la misma cuenta: sin esto, el
    # formulario se puede reenviar en bucle para inundar una casilla ajena.
    # El pedido se descarta en silencio —la respuesta no cambia— así que el que
    # lo intenta tampoco se entera de si acertó el correo.
    ultimo = db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id
    ).order_by(PasswordResetToken.created_at.desc()).first()
    if ultimo is not None and ultimo.created_at is not None:
        espera = timedelta(seconds=settings.PASSWORD_RESET_THROTTLE_SECONDS)
        if ahora - ultimo.created_at < espera:
            return respuesta

    # Los vales anteriores sin usar se invalidan: vale el último enlace enviado
    # y no una colección de enlaces vivos repartidos por la casilla.
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.used_at.is_(None),
    ).update({PasswordResetToken.used_at: ahora}, synchronize_session=False)

    token = generar_token_recuperacion()
    db.add(PasswordResetToken(
        user_id=user.id,
        token_hash=hash_token_recuperacion(token),
        expires_at=ahora + timedelta(minutes=settings.PASSWORD_RESET_TTL_MINUTES),
        ip_solicitud=request.client.host if request.client else None,
    ))
    db.commit()

    try:
        enviado = notifications.notify_password_reset(
            user.email, user.full_name, token,
            settings.PASSWORD_RESET_TTL_MINUTES,
        )
        if not enviado:
            # A la persona no se le puede decir: "no pudimos mandar el correo"
            # sólo aparecería para cuentas que existen, y el formulario pasaría
            # a servir para averiguar qué correos están registrados. Queda en el
            # log, que es donde se puede diagnosticar un SMTP caído.
            logger.warning(
                "El enlace de recuperación de %s NO se pudo enviar (revisar SMTP). "
                "El vale quedó emitido y vence en %s minutos.",
                user.email, settings.PASSWORD_RESET_TTL_MINUTES,
            )
    except Exception:  # noqa: BLE001 — el vale ya está emitido; el aviso no debe romper
        logger.exception("Fallo enviando el enlace de recuperación a %s", user.email)

    return respuesta


@router.get("/restablecer-password", response_model=TokenRecuperacionEstado)
def estado_token_recuperacion(token: str, db: Session = Depends(get_db)):
    """
    Dice si un enlace sirve todavía, para que la pantalla avise antes de que la
    persona elija una contraseña nueva en vano.
    """
    fila = _token_vigente(db, token)
    if not fila:
        return TokenRecuperacionEstado(
            valido=False,
            motivo="El enlace no es válido, ya se usó o venció. Pedí uno nuevo.",
        )
    user = db.query(User).filter(User.id == fila.user_id).first()
    if not user or not user.active:
        return TokenRecuperacionEstado(
            valido=False, motivo="La cuenta no está activa. Contactá al administrador.",
        )
    return TokenRecuperacionEstado(valido=True, email_parcial=_email_parcial(user.email))


@router.post("/restablecer-password", response_model=RecuperacionResponse)
def restablecer_password(
    data: RestablecerPasswordRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """Canjea el enlace por una contraseña nueva. El vale queda consumido."""
    fila = _token_vigente(db, data.token)
    if not fila:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El enlace no es válido, ya se usó o venció. Pedí uno nuevo "
                   "desde «¿Olvidaste tu contraseña?».",
        )

    user = db.query(User).filter(User.id == fila.user_id).first()
    if not user or not user.active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La cuenta no está activa. Contactá al administrador de tu organización.",
        )

    ahora = datetime.now(timezone.utc)
    user.password_hash = get_password_hash(data.password)
    # Se consume este vale y se apagan los demás de la cuenta: después de un
    # cambio de contraseña no puede quedar ningún enlace viejo que sirva.
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.used_at.is_(None),
    ).update({PasswordResetToken.used_at: ahora}, synchronize_session=False)
    db.commit()

    # Aviso a la cuenta de que la contraseña cambió: si no fue la persona, es la
    # única señal que tiene para reaccionar.
    try:
        notifications.notify_password_changed(
            user.email, user.full_name,
            request.client.host if request.client else None,
        )
    except Exception:  # noqa: BLE001
        logger.exception("Fallo enviando el aviso de contraseña cambiada")

    return RecuperacionResponse(
        message="Tu contraseña se cambió. Ya podés ingresar con la nueva.",
    )


@router.get("/users", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    return users_of_tenant(db, current_user.tenant_id).all()
