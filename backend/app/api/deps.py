from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.config import settings
from app.db.session import SessionLocal, get_db
from app.models.user import User
from app.models.tenant import Tenant
from app.schemas.auth import TokenData
from app.data.modules_catalog import allowed_modules_for_role
from app.core.membership import membership_for, PLATFORM_ROLES

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
        role: str = payload.get("role")
        if email is None or tenant_slug is None:
            raise credentials_exception
        token_data = TokenData(email=email, tenant_slug=tenant_slug, role=role)
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
    Resuelve al usuario autenticado Y la organización en la que está operando.

    El email identifica a la persona (es único en toda la plataforma); el tenant
    del token dice en cuál de sus organizaciones está trabajando. Antes esta
    función ignoraba el tenant del token, así que una misma persona en dos
    organizaciones habría devuelto una fila cualquiera: de ahí venía el unique
    global sobre el email. Ahora el acceso lo decide la pertenencia.

    `user.tenant_id` queda sobrescrito EN MEMORIA con la organización activa,
    que es lo que leen los ~180 filtros `tenant_id == current_user.tenant_id`
    del resto de la API. Para que esa sobrescritura no se persista nunca, la
    instancia se desprende de la sesión; por eso los endpoints que modifican el
    propio perfil tienen que volver a cargar la fila (ver api/v1/users.py).
    """
    user = db.query(User).filter(User.email == token_data.email, User.active == True).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado o inactivo"
        )

    tenant = db.query(Tenant).filter(Tenant.slug == token_data.tenant_slug).first()

    # El superadmin no pertenece a ninguna organización: su fila tiene
    # tenant_id NULL y entra a cualquier tenant vía impersonación.
    if token_data.role in PLATFORM_ROLES:
        if tenant:
            db.expunge(user)
            user.tenant_id = tenant.id
        return user

    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="La organización de la sesión no existe."
        )

    membership = membership_for(db, user, tenant.id)
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tenés acceso a esta organización."
        )

    db.expunge(user)
    user.tenant_id = tenant.id
    # El rol es por organización: la misma persona puede ser admin en la suya y
    # auditora de campo en la de un cliente.
    user.role = membership.role
    return user


def require_modules(*module_keys: str):
    """
    Dependencia de router/endpoint que exige acceso a al menos uno de
    `module_keys`, con los DOS límites que aplican: la **edición** contratada
    por la organización y el **alcance del perfil** del usuario.

    admin/superadmin no tienen límite de perfil, pero sí de edición: en una
    organización que contrató solo Auditorías, el administrador tampoco entra a
    Huella de Carbono. Si no fuera así, esconder el módulo del menú sería
    decorativo —la API seguiría contestando— y bastaría con escribir la URL.

    Las dos cosas se leen en vivo de la base (`tenant.settings` y
    `tenant.edicion`), así que cambiar los permisos o la edición aplica sin
    re-login. Cambiar el ROL de un usuario sí requiere re-login, porque el rol
    viaja en el JWT.
    """
    def _dep(token_data: TokenData = Depends(get_current_user),
             db: Session = Depends(get_db)) -> bool:
        role = token_data.role
        tenant = db.query(Tenant).filter(Tenant.slug == token_data.tenant_slug).first()
        settings_dict = tenant.settings if (tenant and isinstance(tenant.settings, dict)) else {}
        edicion = tenant.edicion if tenant else None
        allowed = allowed_modules_for_role(settings_dict, role, edicion)
        if allowed is None or any(k in allowed for k in module_keys):
            return True
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tu organización o tu perfil no tienen acceso a esta sección.",
        )
    return _dep


def require_module_writes(*module_keys: str):
    """
    Como `require_modules`, pero solo exige el módulo en métodos de ESCRITURA
    (POST/PUT/PATCH/DELETE). Las lecturas (GET/HEAD/OPTIONS) quedan abiertas a
    cualquier usuario autenticado del tenant, para no romper lecturas
    transversales entre módulos (p. ej. elegir un documento existente desde
    Equipos o Planificación). Se usa en los módulos transversales.
    """
    guard = require_modules(*module_keys)

    def _dep(request: Request,
             token_data: TokenData = Depends(get_current_user),
             db: Session = Depends(get_db)) -> bool:
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return True
        return guard(token_data=token_data, db=db)

    return _dep
