"""
Prueba de punta a punta sobre la API real (FastAPI TestClient).

Lo que importa verificar acá no es solo que Marisol pueda entrar a las dos
organizaciones, sino que el cambio no haya abierto la puerta de al lado: el
token de una organización no puede leer datos de otra.
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
from app.models.tenant import Tenant
from app.models.user import User
from app.models.user_tenant import UserTenant
from app.core.security import get_password_hash
from app.main import app as fastapi_app

# Se lee desde settings, no de DB crudo: misma URL normalizada que usa
# el backend (driver psycopg2 explicito).
from app.core.config import settings
ENGINE = create_engine(settings.DATABASE_URL)
Session = sessionmaker(bind=ENGINE)

# Esquema limpio desde los modelos. La migracion 0002 se valida aparte contra
# una base con forma de produccion.
from app.models.base_class import Base
with ENGINE.begin() as _c:
    _c.execute(text("DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;"))
Base.metadata.create_all(
    ENGINE, tables=[t for t in Base.metadata.sorted_tables if t.schema == "public"])
client = TestClient(fastapi_app)

fallos = []


def check(nombre, cond, detalle=""):
    print(f"  [{'OK  ' if cond else 'FALLA'}] {nombre}" + (f" — {detalle}" if detalle and not cond else ""))
    if not cond:
        fallos.append(nombre)


# --- datos: dos organizaciones con 2FA apagado (asi el login usa BYPASS) ----
with Session() as db:
    db.execute(text("DELETE FROM public.user_tenants"))
    db.execute(text("DELETE FROM public.users"))
    db.execute(text("DELETE FROM public.tenants"))
    db.commit()

    ael = Tenant(id=uuid.uuid4(), slug="ael", name="Auditorias en Linea", two_factor_enabled=False)
    olca = Tenant(id=uuid.uuid4(), slug="olca", name="OLCA", two_factor_enabled=False)
    db.add_all([ael, olca])
    db.flush()

    pw = get_password_hash("Secreta123")
    marisol = User(id=uuid.uuid4(), tenant_id=ael.id, email="marisolseco@auditoriasenlinea.com.ar",
                   full_name="Marisol Seco", role="auditor", password_hash=pw, active=True)
    admin_ael = User(id=uuid.uuid4(), tenant_id=ael.id, email="admin@ael.com",
                     full_name="Admin AEL", role="admin", password_hash=pw, active=True)
    admin_olca = User(id=uuid.uuid4(), tenant_id=olca.id, email="admin@olca.com",
                      full_name="Admin OLCA", role="admin", password_hash=pw, active=True)
    db.add_all([marisol, admin_ael, admin_olca])
    db.flush()
    for u, t, r in [(marisol, ael, "auditor"), (admin_ael, ael, "admin"), (admin_olca, olca, "admin")]:
        db.add(UserTenant(id=uuid.uuid4(), user_id=u.id, tenant_id=t.id, role=r, active=True))
    db.commit()
    ael_id, olca_id = ael.id, olca.id

API = "/api/v1"


def login(email, password="Secreta123"):
    return client.post(f"{API}/auth/login", json={"email": email, "password": password})


def token(email, tenant_slug=None, password="Secreta123"):
    login(email, password)
    cuerpo = {"email": email, "code": "BYPASS"}
    if tenant_slug:
        cuerpo["tenant_slug"] = tenant_slug
    return client.post(f"{API}/auth/verify-2fa", json=cuerpo)


print("\n=== 1. Antes del alta: una sola organizacion ===")
r = login("marisolseco@auditoriasenlinea.com.ar")
check("login responde 200", r.status_code == 200, r.text[:200])
check("devuelve una sola organizacion", len(r.json().get("tenants", [])) == 1, r.text[:200])
r = token("marisolseco@auditoriasenlinea.com.ar")
check("entra sin elegir organizacion", r.status_code == 200, r.text[:200])
check("el token apunta a la suya", r.json().get("tenant_slug") == "ael", r.text[:200])

print("\n=== 2. El admin de OLCA la invita (el error reportado) ===")
tok_olca = token("admin@olca.com", "olca").json()["access_token"]
h_olca = {"Authorization": f"Bearer {tok_olca}"}
r = client.post(f"{API}/tenant/users/invite", headers=h_olca, json={
    "email": "marisolseco@auditoriasenlinea.com.ar",
    "full_name": "Marisol Seco",
    "role": "auditor",
})
check("la invitacion ya no se rechaza", r.status_code == 200, f"{r.status_code} {r.text[:260]}")

with Session() as db:
    n = db.query(User).filter_by(email="marisolseco@auditoriasenlinea.com.ar").count()
    check("no se creo una cuenta duplicada", n == 1, f"hay {n}")
    m = db.query(UserTenant).filter_by(tenant_id=olca_id).count()
    check("se creo la pertenencia a OLCA", m == 2, f"hay {m}")

r = client.post(f"{API}/tenant/users/invite", headers=h_olca, json={
    "email": "marisolseco@auditoriasenlinea.com.ar", "full_name": "Marisol Seco", "role": "auditor"})
check("invitarla dos veces da error claro", r.status_code == 400 and "esta organización" in r.text,
      f"{r.status_code} {r.text[:200]}")

print("\n=== 3. Marisol ahora elige organizacion ===")
r = login("marisolseco@auditoriasenlinea.com.ar")
slugs = sorted(t["slug"] for t in r.json().get("tenants", []))
check("el login ofrece las dos", slugs == ["ael", "olca"], str(slugs))

r = client.post(f"{API}/auth/verify-2fa", json={
    "email": "marisolseco@auditoriasenlinea.com.ar", "code": "BYPASS"})
check("sin elegir, pide que elija", r.status_code == 400, f"{r.status_code} {r.text[:200]}")

r = token("marisolseco@auditoriasenlinea.com.ar", "olca")
check("entra a OLCA", r.status_code == 200 and r.json()["tenant_slug"] == "olca", r.text[:200])
check("con el rol de esa organizacion", r.json().get("role") == "auditor", r.text[:200])
tok_marisol_olca = r.json()["access_token"]

r = token("marisolseco@auditoriasenlinea.com.ar", "ael")
check("y tambien a la suya", r.status_code == 200 and r.json()["tenant_slug"] == "ael", r.text[:200])

print("\n=== 4. Aislamiento: el token de una no sirve para la otra ===")
r = token("admin@olca.com", "ael")
check("no puede entrar a una organizacion ajena", r.status_code == 403, f"{r.status_code} {r.text[:200]}")

# Token de OLCA forjado hacia AEL: se firma a mano para simular el peor caso.
from datetime import timedelta
from app.core.security import create_access_token
forjado = create_access_token(subject="admin@olca.com", tenant_slug="ael", role="admin",
                              expires_delta=timedelta(minutes=5))
r = client.get(f"{API}/users/", headers={"Authorization": f"Bearer {forjado}"})
check("un token con otro tenant es rechazado por la API", r.status_code == 403,
      f"{r.status_code} {r.text[:200]}")

print("\n=== 5. Asignacion de auditoria (el objetivo) ===")
h_m = {"Authorization": f"Bearer {tok_marisol_olca}"}
r = client.get(f"{API}/users/", headers=h_olca)
emails = {u["email"] for u in r.json()} if r.status_code == 200 else set()
check("Marisol figura entre los asignables de OLCA",
      "marisolseco@auditoriasenlinea.com.ar" in emails, f"{r.status_code} {sorted(emails)}")
roles = {u["email"]: u["role"] for u in r.json()} if r.status_code == 200 else {}
check("y figura con el rol de OLCA",
      roles.get("marisolseco@auditoriasenlinea.com.ar") == "auditor", str(roles))

r = client.get(f"{API}/users/", headers=h_m)
check("Marisol, operando en OLCA, ve el padron de OLCA",
      r.status_code == 200 and "admin@olca.com" in {u["email"] for u in r.json()},
      f"{r.status_code} {r.text[:200]}")
check("y NO ve a la gente de su propia organizacion",
      r.status_code == 200 and "admin@ael.com" not in {u["email"] for u in r.json()},
      r.text[:200])

print("\n=== 6. El perfil propio se sigue guardando ===")
r = client.put(f"{API}/users/me", headers=h_m, json={"full_name": "Marisol Seco Perez"})
check("PUT /users/me responde 200", r.status_code == 200, f"{r.status_code} {r.text[:200]}")
with Session() as db:
    guardado = db.query(User).filter_by(email="marisolseco@auditoriasenlinea.com.ar").one()
    check("el nombre quedo persistido", guardado.full_name == "Marisol Seco Perez", str(guardado.full_name))
    check("y NO se le movio la organizacion de origen", guardado.tenant_id == ael_id,
          "se habria persistido el tenant del token")
    check("ni se le piso el rol de la cuenta", guardado.role == "auditor", str(guardado.role))

print("\n=== 7. Baja en OLCA, sin perder la cuenta ===")
with Session() as db:
    mid = db.query(User).filter_by(email="marisolseco@auditoriasenlinea.com.ar").one().id
r = client.put(f"{API}/tenant/users/{mid}/toggle", headers=h_olca)
check("la baja responde 200", r.status_code == 200, f"{r.status_code} {r.text[:200]}")
with Session() as db:
    cuenta = db.query(User).filter_by(id=mid).one()
    check("la cuenta global sigue activa", cuenta.active is True)
    m_olca = db.query(UserTenant).filter_by(user_id=mid, tenant_id=olca_id).one()
    check("la pertenencia a OLCA quedo inactiva", m_olca.active is False)
r = token("marisolseco@auditoriasenlinea.com.ar", "olca")
check("ya no puede entrar a OLCA", r.status_code == 403, f"{r.status_code} {r.text[:200]}")
r = token("marisolseco@auditoriasenlinea.com.ar", "ael")
check("pero sigue entrando a la suya", r.status_code == 200, f"{r.status_code} {r.text[:200]}")

print("\n" + "=" * 62)
if fallos:
    print(f"FALLARON {len(fallos)}: " + "; ".join(fallos))
    sys.exit(1)
print("TODAS LAS COMPROBACIONES PASARON")
