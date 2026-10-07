import bcrypt
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from jose import jwt
from typing import Any, Union
from app.core.config import settings

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8")
        )
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def generar_token_recuperacion() -> str:
    """
    Token del enlace de recuperación de contraseña: 32 bytes del generador
    criptográfico del sistema, en base64 apto para URL (~43 caracteres).

    No se deriva del correo ni de la fecha: tiene que ser imposible de adivinar
    o de reconstruir, porque quien lo tenga puede cambiar la contraseña.
    """
    return secrets.token_urlsafe(32)


def hash_token_recuperacion(token: str) -> str:
    """
    Huella del token para guardar en la base.

    SHA-256 y no bcrypt a propósito: el token ya tiene 256 bits de entropía, así
    que no hay nada que derivar lento —no existe diccionario que lo alcance— y
    en cambio el hash tiene que ser determinístico para poder buscar la fila por
    índice en lugar de probar contra todas las filas vigentes.
    """
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_access_token(
    subject: Union[str, Any], tenant_slug: str, role: str = "collaborator", expires_delta: timedelta = None
) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode = {"exp": expire, "sub": str(subject), "tenant": tenant_slug, "role": role}
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.ALGORITHM)
    return encoded_jwt
