"""
Impersonación de un tenant por el superadmin, de punta a punta.

El superadmin no pertenece a ninguna organización (su fila tiene tenant_id
NULL), así que entra a una cuenta de cliente con un token firmado por
/admin/tenants/{id}/impersonate. Ese camino se apoya en que
`get_current_active_user` le sobrescriba el tenant en memoria, y conviene
tenerlo cubierto porque es el único que salta la verificación de pertenencia.
"""
import os
import sys
import uuid

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
DB = os.environ.get("TEST_DATABASE_URL",
                    "postgresql://postgres@/postgres?host=/var/tmp&port=55432")
os.environ.update(
    DATABASE_URL=DB, JWT_SECRET="test-secret", SECRET_KEY="test-secret",
    REDIS_URL="redis://127.0.0.1:6399/0", APP_BASE_URL="http://localhost:3000",
)

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

import app.models  # noqa: F401
from app.models.base_class import Base
from app.models.tenant import Tenant
from app.models.user import User
from app.models.user_tenant import UserTenant
from app.core.security import get_password_hash
from app.core.config import settings
from app.data.modules_catalog import FULL_ROLES, allowed_modules_for_role
from app.main import app as fastapi_app

ENGINE = create_engine(settings.DATABASE_URL)
Session = sessionmaker(bind=ENGINE)
client = TestClient(fastapi_app)
API = "/api/v1"

fallos = []


def check(nombre, cond, detalle=""):
    print(f"  [{'OK  ' if cond else 'FALLA'}] {nombre}" + (f" — {detalle}" if detalle and not cond else ""))
    if not cond:
        fallos.append(nombre)


with ENGINE.begin() as c:
    c.execute(text("DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;"))
Base.metadata.create_all(
    ENGINE, tables=[t for t in Base.metadata.sorted_tables if t.schema == "public"])

with Session() as db:
    olca = Tenant(id=uuid.uuid4(), slug="olca-sa", name="OLCA SA", two_factor_enabled=False)
    db.add(olca)
    db.flush()
    pw = get_password_hash("Secreta123")
    # El superadmin: sin tenant_id y sin pertenencias, a propósito.
    sa = User(id=uuid.uuid4(), tenant_id=None, email="gerencia@auditoriasenlinea.com.ar",
              full_name="Gerencia Superadmin", role="superadmin", password_hash=pw, active=True)
    admin_olca = User(id=uuid.uuid4(), tenant_id=olca.id, email="admin@olca.com",
                      full_name="Admin OLCA", role="admin", password_hash=pw, active=True)
    db.add_all([sa, admin_olca])
    db.flush()
    db.add(UserTenant(id=uuid.uuid4(), user_id=admin_olca.id, tenant_id=olca.id,
                      role="admin", active=True))
    db.commit()
    olca_id = str(olca.id)

print("\n=== 1. El superadmin entra sin pertenecer a ninguna organizacion ===")
client.post(f"{API}/auth/login", json={"email": "gerencia@auditoriasenlinea.com.ar",
                                       "password": "Secreta123"})
r = client.post(f"{API}/auth/verify-2fa", json={"email": "gerencia@auditoriasenlinea.com.ar",
                                                "code": "BYPASS"})
check("el superadmin puede iniciar sesion", r.status_code == 200, f"{r.status_code} {r.text[:200]}")
check("su token no queda atado a un tenant", r.json().get("tenant_slug") == "public", r.text[:160])
h_sa = {"Authorization": f"Bearer {r.json()['access_token']}"}

print("\n=== 2. Pide el token de impersonacion ===")
r = client.post(f"{API}/admin/tenants/{olca_id}/impersonate", headers=h_sa)
check("el endpoint responde 200", r.status_code == 200, f"{r.status_code} {r.text[:200]}")
check("el token apunta al tenant elegido", r.json().get("tenant_slug") == "olca-sa", r.text[:160])
tok_imp = r.json()["access_token"]
h_imp = {"Authorization": f"Bearer {tok_imp}"}

import jose.jwt as jwt
claims = jwt.decode(tok_imp, "test-secret", algorithms=["HS256"])
check("el rol del token es superadmin_impersonation",
      claims.get("role") == "superadmin_impersonation", str(claims.get("role")))

print("\n=== 3. Operando dentro del tenant impersonado ===")
r = client.get(f"{API}/users/", headers=h_imp)
check("ve el padron del tenant", r.status_code == 200, f"{r.status_code} {r.text[:200]}")
if r.status_code == 200:
    check("y es el padron correcto",
          "admin@olca.com" in {u["email"] for u in r.json()}, r.text[:200])

# Este es el que devolvia 400 en la consola del navegador.
r = client.get(f"{API}/tenant/uso", headers=h_imp)
check("GET /tenant/uso no da 400", r.status_code == 200, f"{r.status_code} {r.text[:260]}")

r = client.get(f"{API}/tenant/permissions", headers=h_imp)
check("GET /tenant/permissions responde", r.status_code == 200, f"{r.status_code} {r.text[:200]}")

print("\n=== 4. El gateo de modulos lo deja ver todo ===")
check("superadmin_impersonation esta en FULL_ROLES del backend",
      "superadmin_impersonation" in FULL_ROLES, str(FULL_ROLES))
check("allowed_modules_for_role devuelve None (sin restriccion)",
      allowed_modules_for_role({}, "superadmin_impersonation") is None,
      str(allowed_modules_for_role({}, "superadmin_impersonation")))

r = client.get(f"{API}/auditorias/programas", headers=h_imp)
check("alcanza un modulo con gateo (auditorias)", r.status_code == 200,
      f"{r.status_code} {r.text[:200]}")

print("\n=== 5. El frontend tiene que usar la misma lista ===")
import re
layout = open(os.path.join(os.path.dirname(__file__), "..", "..",
                           "frontend/src/app/dashboard/layout.tsx")).read()
m = re.search(r'const FULL_ROLES\s*=\s*\[([^\]]*)\]', layout)
roles_front = {x.strip().strip('"\'') for x in m.group(1).split(',') if x.strip()} if m else set()
check("FULL_ROLES del frontend incluye superadmin_impersonation",
      "superadmin_impersonation" in roles_front, str(sorted(roles_front)))
check("frontend y backend declaran el mismo conjunto",
      roles_front == set(FULL_ROLES), f"front={sorted(roles_front)} back={sorted(FULL_ROLES)}")

print("\n=== 6. La impersonacion no debe escribirse en la base ===")
with Session() as db:
    fila = db.query(User).filter_by(email="gerencia@auditoriasenlinea.com.ar").one()
    check("el superadmin sigue con tenant_id NULL", fila.tenant_id is None, str(fila.tenant_id))
    check("no se le creo ninguna pertenencia",
          db.query(UserTenant).filter_by(user_id=fila.id).count() == 0)
    check("su rol en la base sigue siendo superadmin", fila.role == "superadmin", fila.role)

print("\n" + "=" * 62)
if fallos:
    print(f"FALLARON {len(fallos)}: " + "; ".join(fallos))
    sys.exit(1)
print("TODAS LAS COMPROBACIONES PASARON")
