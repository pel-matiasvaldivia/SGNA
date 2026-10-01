"""
Resolución de pertenencias usuario ↔ organización.

Toda consulta sobre *personas* de un tenant pasa por acá. Las consultas sobre
*datos* siguen usando `current_user.tenant_id`, que `deps.get_current_active_user`
deja fijado en la organización del token.

Regla de compatibilidad: hasta que el backfill haya corrido en todos los
entornos, una cuenta sin ninguna fila en `user_tenants` se considera miembro de
su `users.tenant_id` de origen. Así un despliegue a mitad de camino no deja a
nadie afuera. Una vez migrado, esa rama no se usa nunca.
"""

from typing import List, Optional
from uuid import UUID

from sqlalchemy.orm import Session, aliased

from app.models.user import User
from app.models.user_tenant import UserTenant
from app.models.tenant import Tenant

# El superadmin no pertenece a ninguna organización: entra a todas por el
# endpoint de impersonación, que firma un token con el tenant de destino.
PLATFORM_ROLES = {"superadmin", "superadmin_impersonation"}


def _has_memberships(db: Session, user_id: UUID) -> bool:
    return db.query(UserTenant.id).filter(UserTenant.user_id == user_id).first() is not None


def membership_for(db: Session, user: User, tenant_id: UUID) -> Optional[UserTenant]:
    """Pertenencia activa de `user` en `tenant_id`, o None."""
    if tenant_id is None:
        return None
    m = (
        db.query(UserTenant)
        .filter(
            UserTenant.user_id == user.id,
            UserTenant.tenant_id == tenant_id,
            UserTenant.active.is_(True),
        )
        .first()
    )
    if m:
        return m

    # Compatibilidad previa al backfill (ver docstring del módulo).
    if not _has_memberships(db, user.id) and user.tenant_id == tenant_id:
        return UserTenant(
            user_id=user.id, tenant_id=tenant_id, role=user.role, active=bool(user.active)
        )
    return None


def memberships_of(db: Session, user: User) -> List[UserTenant]:
    """Todas las pertenencias activas del usuario, para elegir organización."""
    rows = (
        db.query(UserTenant)
        .filter(UserTenant.user_id == user.id, UserTenant.active.is_(True))
        .all()
    )
    if rows:
        return rows
    if user.tenant_id:
        return [
            UserTenant(
                user_id=user.id,
                tenant_id=user.tenant_id,
                role=user.role,
                active=bool(user.active),
            )
        ]
    return []


def tenants_of(db: Session, user: User) -> List[Tenant]:
    """Organizaciones a las que el usuario puede entrar, ordenadas por nombre."""
    ids = [m.tenant_id for m in memberships_of(db, user)]
    if not ids:
        return []
    return db.query(Tenant).filter(Tenant.id.in_(ids)).order_by(Tenant.name).all()


def users_of_tenant(db: Session, tenant_id: UUID, only_active: bool = True):
    """
    Query de los usuarios que pertenecen a `tenant_id`.

    Une por pertenencia y además incluye, por compatibilidad, a los usuarios
    cuyo `users.tenant_id` apunta al tenant y todavía no tienen fila de
    pertenencia. El `distinct` evita duplicar a quien cumple las dos cosas.
    """
    union = (UserTenant.user_id == User.id) & (UserTenant.tenant_id == tenant_id)
    if only_active:
        # Una pertenencia dada de baja no debe seguir listando a la persona
        # como miembro, aunque su cuenta siga activa en otra organización.
        union = union & UserTenant.active.is_(True)
    q = db.query(User).outerjoin(UserTenant, union)
    # Alias y correlación explícita: `user_tenants` ya está en el join externo,
    # así que sin esto SQLAlchemy correlaciona también la subconsulta y la deja
    # sin FROM.
    otra = aliased(UserTenant)
    sin_pertenencias = ~(
        db.query(otra.id).filter(otra.user_id == User.id).correlate(User).exists()
    )
    condicion = (UserTenant.id.isnot(None)) | ((User.tenant_id == tenant_id) & sin_pertenencias)
    q = q.filter(condicion)
    if only_active:
        q = q.filter(User.active.is_(True))
    return q.distinct()


def admin_emails_of_tenant(db: Session, tenant_id: UUID) -> List[str]:
    """Correos de los administradores de la organización, para los avisos."""
    return [
        u.email
        for u in users_of_tenant(db, tenant_id).all()
        if u.email and role_in_tenant(db, u, tenant_id) == "admin"
    ]


def role_in_tenant(db: Session, user: User, tenant_id: UUID) -> Optional[str]:
    """Rol efectivo del usuario en esa organización."""
    m = membership_for(db, user, tenant_id)
    return m.role if m else None


def grant_membership(db: Session, user: User, tenant_id: UUID, role: str) -> UserTenant:
    """
    Da de alta (o reactiva) la pertenencia. No hace commit: lo hace quien llama.

    Si el usuario todavía no tiene ninguna fila, materializa también la de su
    organización de origen; de lo contrario el backfill tardío se la comería y
    perdería el acceso a su propia cuenta.
    """
    if not _has_memberships(db, user.id) and user.tenant_id and user.tenant_id != tenant_id:
        db.add(
            UserTenant(
                user_id=user.id,
                tenant_id=user.tenant_id,
                role=user.role,
                active=bool(user.active),
            )
        )

    existente = (
        db.query(UserTenant)
        .filter(UserTenant.user_id == user.id, UserTenant.tenant_id == tenant_id)
        .first()
    )
    if existente:
        existente.role = role
        existente.active = True
        return existente

    nueva = UserTenant(user_id=user.id, tenant_id=tenant_id, role=role, active=True)
    db.add(nueva)
    return nueva
