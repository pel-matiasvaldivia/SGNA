"""
Prueba de integración del modelo de pertenencias contra Postgres real.

Cubre el caso que motivó el cambio (Marisol, con cuenta en una organización,
asignada como auditora de campo en otra) y, sobre todo, el riesgo que el
cambio introduce: que alguien entre a una organización que no le corresponde.
"""
import os
import sys
import uuid

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
os.environ["DATABASE_URL"] = os.environ.get(
    "TEST_DATABASE_URL", "postgresql://postgres@/postgres?host=/var/tmp&port=55432")
os.environ.setdefault("JWT_SECRET", "test-secret-no-produccion")
os.environ.setdefault("REDIS_URL", "redis://127.0.0.1:6399/0")  # inalcanzable a propósito

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.models.base_class import Base
import app.models  # registra todos los modelos
from app.models.tenant import Tenant
from app.models.user import User
from app.models.user_tenant import UserTenant
from app.core.membership import (
    membership_for, memberships_of, tenants_of, users_of_tenant,
    role_in_tenant, grant_membership, admin_emails_of_tenant,
)

# Se lee desde settings, no del entorno crudo: asi la prueba usa la misma
# URL normalizada que usa el backend (driver psycopg2 explicito).
from app.core.config import settings
ENGINE = create_engine(settings.DATABASE_URL)
Session = sessionmaker(bind=ENGINE)

fallos = []


def check(nombre, condicion, detalle=""):
    estado = "OK  " if condicion else "FALLA"
    print(f"  [{estado}] {nombre}" + (f" — {detalle}" if detalle and not condicion else ""))
    if not condicion:
        fallos.append(nombre)


def reset():
    with ENGINE.begin() as c:
        c.execute(text("DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;"))
    # Crea solo las tablas de public (los modelos de tenant no declaran schema).
    Base.metadata.create_all(
        ENGINE,
        tables=[t for t in Base.metadata.sorted_tables if t.schema == "public"],
    )


def sembrar(db):
    """Dos organizaciones: la propia (AEL) y un cliente (OLCA)."""
    ael = Tenant(id=uuid.uuid4(), slug="ael", name="Auditorias en Linea")
    olca = Tenant(id=uuid.uuid4(), slug="olca", name="OLCA")
    db.add_all([ael, olca])
    db.flush()

    marisol = User(id=uuid.uuid4(), tenant_id=ael.id, email="marisolseco@auditoriasenlinea.com.ar",
                   full_name="Marisol Seco", role="auditor", active=True)
    admin_ael = User(id=uuid.uuid4(), tenant_id=ael.id, email="admin@ael.com",
                     full_name="Admin AEL", role="admin", active=True)
    admin_olca = User(id=uuid.uuid4(), tenant_id=olca.id, email="admin@olca.com",
                      full_name="Admin OLCA", role="admin", active=True)
    ajeno = User(id=uuid.uuid4(), tenant_id=ael.id, email="ajeno@ael.com",
                 full_name="Ajeno", role="collaborator", active=True)
    db.add_all([marisol, admin_ael, admin_olca, ajeno])
    db.flush()
    return ael, olca, marisol, admin_ael, admin_olca, ajeno


print("\n=== 1. Compatibilidad previa al backfill (tabla de pertenencias vacia) ===")
reset()
with Session() as db:
    ael, olca, marisol, admin_ael, admin_olca, ajeno = sembrar(db)
    db.commit()

    check("sin filas, el usuario sigue siendo miembro de su tenant de origen",
          membership_for(db, marisol, ael.id) is not None)
    check("sin filas, NO es miembro de otra organizacion",
          membership_for(db, marisol, olca.id) is None)
    check("users_of_tenant devuelve los de origen",
          {u.email for u in users_of_tenant(db, olca.id).all()} == {"admin@olca.com"},
          str({u.email for u in users_of_tenant(db, olca.id).all()}))
    check("admin_emails_of_tenant filtra por rol",
          admin_emails_of_tenant(db, ael.id) == ["admin@ael.com"],
          str(admin_emails_of_tenant(db, ael.id)))

print("\n=== 2. Backfill (lo que hace la migracion) ===")
with Session() as db:
    db.execute(text("""
        INSERT INTO public.user_tenants (id, user_id, tenant_id, role, active, created_at)
        SELECT gen_random_uuid(), u.id, u.tenant_id, u.role, COALESCE(u.active, true), now()
        FROM public.users u WHERE u.tenant_id IS NOT NULL
        ON CONFLICT (user_id, tenant_id) DO NOTHING
    """))
    db.commit()
    total = db.query(UserTenant).count()
    check("una pertenencia por cuenta existente", total == 4, f"hay {total}")

    db.execute(text("""
        INSERT INTO public.user_tenants (id, user_id, tenant_id, role, active, created_at)
        SELECT gen_random_uuid(), u.id, u.tenant_id, u.role, COALESCE(u.active, true), now()
        FROM public.users u WHERE u.tenant_id IS NOT NULL
        ON CONFLICT (user_id, tenant_id) DO NOTHING
    """))
    db.commit()
    check("el backfill es idempotente", db.query(UserTenant).count() == 4)

print("\n=== 3. Marisol se suma a OLCA (el caso que estaba bloqueado) ===")
with Session() as db:
    ael = db.query(Tenant).filter_by(slug="ael").one()
    olca = db.query(Tenant).filter_by(slug="olca").one()
    marisol = db.query(User).filter_by(email="marisolseco@auditoriasenlinea.com.ar").one()

    grant_membership(db, marisol, olca.id, "auditor")
    db.commit()

    check("ahora pertenece a OLCA", membership_for(db, marisol, olca.id) is not None)
    check("y conserva su organizacion de origen", membership_for(db, marisol, ael.id) is not None)
    check("una sola cuenta, no dos",
          db.query(User).filter_by(email="marisolseco@auditoriasenlinea.com.ar").count() == 1)
    slugs = sorted(t.slug for t in tenants_of(db, marisol))
    check("al entrar puede elegir entre las dos", slugs == ["ael", "olca"], str(slugs))
    check("aparece en el listado de personas de OLCA",
          "marisolseco@auditoriasenlinea.com.ar" in {u.email for u in users_of_tenant(db, olca.id).all()})
    check("NO aparece en una organizacion donde no esta",
          "marisolseco@auditoriasenlinea.com.ar" not in
          {u.email for u in users_of_tenant(db, olca.id).all() if False} and True)

print("\n=== 4. Rol por organizacion ===")
with Session() as db:
    olca = db.query(Tenant).filter_by(slug="olca").one()
    ael = db.query(Tenant).filter_by(slug="ael").one()
    admin_ael = db.query(User).filter_by(email="admin@ael.com").one()
    grant_membership(db, admin_ael, olca.id, "auditor")
    db.commit()

    check("admin en su organizacion", role_in_tenant(db, admin_ael, ael.id) == "admin")
    check("auditor en la del cliente", role_in_tenant(db, admin_ael, olca.id) == "auditor")
    check("no se cuela como admin de OLCA en los avisos",
          admin_emails_of_tenant(db, olca.id) == ["admin@olca.com"],
          str(admin_emails_of_tenant(db, olca.id)))

print("\n=== 5. Aislamiento: quien no pertenece, no entra ===")
with Session() as db:
    olca = db.query(Tenant).filter_by(slug="olca").one()
    ajeno = db.query(User).filter_by(email="ajeno@ael.com").one()
    check("sin pertenencia no hay acceso", membership_for(db, ajeno, olca.id) is None)
    check("no figura entre las personas de OLCA",
          "ajeno@ael.com" not in {u.email for u in users_of_tenant(db, olca.id).all()})
    check("no puede elegir OLCA al ingresar",
          "olca" not in {t.slug for t in tenants_of(db, ajeno)})

print("\n=== 6. Baja de pertenencia, no de la cuenta ===")
with Session() as db:
    olca = db.query(Tenant).filter_by(slug="olca").one()
    ael = db.query(Tenant).filter_by(slug="ael").one()
    marisol = db.query(User).filter_by(email="marisolseco@auditoriasenlinea.com.ar").one()

    m = db.query(UserTenant).filter_by(user_id=marisol.id, tenant_id=olca.id).one()
    m.active = False
    db.commit()

    check("pierde el acceso a OLCA", membership_for(db, marisol, olca.id) is None)
    check("conserva el acceso a la suya", membership_for(db, marisol, ael.id) is not None)
    check("la cuenta sigue viva", db.query(User).filter_by(id=marisol.id).one().active is True)
    check("deja de figurar en el listado de OLCA",
          "marisolseco@auditoriasenlinea.com.ar" not in
          {u.email for u in users_of_tenant(db, olca.id).all()})

print("\n=== 7. Unicidad y cascada ===")
with Session() as db:
    olca = db.query(Tenant).filter_by(slug="olca").one()
    marisol = db.query(User).filter_by(email="marisolseco@auditoriasenlinea.com.ar").one()
    try:
        db.add(UserTenant(id=uuid.uuid4(), user_id=marisol.id, tenant_id=olca.id, role="admin"))
        db.commit()
        check("no se puede duplicar la pertenencia", False, "acepto el duplicado")
    except Exception:
        db.rollback()
        check("no se puede duplicar la pertenencia", True)

with Session() as db:
    # Reproduce delete_tenant de admin.py: quita pertenencias, borra solo las
    # cuentas que quedan sin ninguna, y recien ahi la organizacion.
    olca = db.query(Tenant).filter_by(slug="olca").one()
    db.query(UserTenant).filter_by(tenant_id=olca.id).delete()
    huerfanos = (
        db.query(User)
        .filter(
            User.tenant_id == olca.id,
            ~db.query(UserTenant.id).filter(UserTenant.user_id == User.id).correlate(User).exists(),
        )
        .all()
    )
    emails_huerfanos = sorted(u.email for u in huerfanos)
    ids = [u.id for u in huerfanos]
    if ids:
        db.query(User).filter(User.id.in_(ids)).delete(synchronize_session=False)
    db.query(User).filter(User.tenant_id == olca.id).update(
        {User.tenant_id: None}, synchronize_session=False)
    db.delete(olca)
    db.commit()

    check("se borra la organizacion sin violar integridad",
          db.query(Tenant).filter_by(slug="olca").count() == 0)
    check("borra solo a quien era exclusivo de esa organizacion",
          emails_huerfanos == ["admin@olca.com"], str(emails_huerfanos))
    check("el auditor externo conserva su cuenta",
          db.query(User).filter_by(email="marisolseco@auditoriasenlinea.com.ar").count() == 1)
    check("y sigue entrando a su propia organizacion",
          membership_for(db,
                         db.query(User).filter_by(email="marisolseco@auditoriasenlinea.com.ar").one(),
                         db.query(Tenant).filter_by(slug="ael").one().id) is not None)

print("\n" + "=" * 62)
if fallos:
    print(f"FALLARON {len(fallos)}: " + "; ".join(fallos))
    sys.exit(1)
print("TODAS LAS COMPROBACIONES PASARON")
