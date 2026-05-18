from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.config import settings
from app.db.session import SessionLocal
from app.models.user import User
from app.models.tenant import Tenant
from app.schemas.auth import TokenData

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)

def get_current_user(
    token: str = Depends(oauth2_scheme)
) -> TokenData:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET, algorithms=[settings.ALGORITHM]
        )
        email: str = payload.get("sub")
        tenant_slug: str = payload.get("tenant")
        if email is None or tenant_slug is None:
            raise credentials_exception
        token_data = TokenData(email=email, tenant_slug=tenant_slug)
    except JWTError:
        raise credentials_exception
        
    return token_data


def get_tenant_db_from_token(
    token_data: TokenData = Depends(get_current_user)
) -> Session:
    """
    Dependency that extracts the tenant slug from the validated JWT token
    and yields an isolated DB session configured with the search_path of that tenant.
    """
    from app.db.session import get_tenant_db
    yield from get_tenant_db(token_data.tenant_slug)


def get_current_active_user(
    token_data: TokenData = Depends(get_current_user),
    db: Session = Depends(get_tenant_db_from_token)
) -> User:
    """
    Fetches the authenticated user database object under the isolated tenant schema.
    """
    user = db.query(User).filter(User.email == token_data.email, User.active == True).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado o inactivo"
        )
    return user
