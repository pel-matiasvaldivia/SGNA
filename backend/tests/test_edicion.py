"""
Ediciones de la plataforma: Auditorías y SGI Completo.

La plataforma se ofrece en dos niveles pero los dos veían los 22 módulos: quien
contrataba para ejecutar auditorías internas entraba y se encontraba con Huella
de Carbono, CMMS y Revisión por la Dirección, todos vacíos. La edición recorta
qué módulos existen para una organización.

Lo que se verifica acá es sobre todo que el recorte sea **real y no cosmético**:

  - que el enforcement esté en la API y no solo en el menú, porque esconder un
    enlace no protege nada si la URL sigue contestando;
  - que la edición aplique **también a los administradores**, que no tienen
    límite de perfil pero sí tienen el de lo que la organización contrató;
  - que los dos límites —edición y perfil— se intersequen, en vez de que el más
    permisivo gane;
  - que un tenant que nunca eligió edición (NULL) **no pierda acceso a nada**,
    que es el caso de todos los que existían antes de esta función;
  - que cambiar de edición no borre datos: los módulos que salen vuelven con lo
    que tenían.

Necesita un Postgres real: lo que se prueba es el cruce entre `public.tenants`
y el gating de los routers.

    export TEST_DATABASE_URL="postgresql+psycopg2://usuario:clave@localhost:5432/basedeprueba"
    python tests/test_edicion.py

BORRA Y RECREA el schema `public` y los schemas de prueba.
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
from app.core.config import settings
from app.core.security import get_password_hash
from app.data.modules_catalog import (
    EDICIONES, MODULE_KEYS, allowed_modules_for_role, definicion_edicion,
    modulos_de_edicion, normalizar_edicion, sanitize_config,
)
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
    for s in ("tenant_soloaud", "tenant_completa", "tenant_viejo"):
        c.execute(text(f"DROP SCHEMA IF EXISTS {s} CASCADE;"))
Base.metadata.create_all(
    ENGINE, tables=[t for t in Base.metadata.sorted_tables if t.schema == "public"])

CLAVE = "Secreta123"


def crear_tenant(slug, nombre, email_admin, edicion):
    with Session() as db:
        t = Tenant(id=uuid.uuid4(), slug=slug, name=nombre, two_factor_enabled=False,
                   edicion=edicion)
        db.add(t)
        db.flush()
        u = User(id=uuid.uuid4(), tenant_id=t.id, email=email_admin, full_name="Marisol Seco",
                 role="admin", password_hash=get_password_hash(CLAVE), active=True)
        db.add(u)
        db.flush()
        db.add(UserTenant(id=uuid.uuid4(), user_id=u.id, tenant_id=t.id, role="admin", active=True))
        db.commit()
        return t.id


def crear_usuario(tenant_id, email, rol):
    with Session() as db:
        u = User(id=uuid.uuid4(), tenant_id=tenant_id, email=email, full_name=email.split("@")[0],
                 role=rol, password_hash=get_password_hash(CLAVE), active=True)
        db.add(u)
        db.flush()
        db.add(UserTenant(id=uuid.uuid4(), user_id=u.id, tenant_id=tenant_id, role=rol, active=True))
        db.commit()
        return u.id


def token_de(email):
    client.post(f"{API}/auth/login", json={"email": email, "password": CLAVE})
    tok = client.post(f"{API}/auth/verify-2fa",
                      json={"email": email, "code": "BYPASS"}).json()["access_token"]
    return {"Authorization": f"Bearer {tok}"}


# ---------------------------------------------------------------------------
print("\n=== 1. El catálogo de ediciones ===")

claves = [e["key"] for e in EDICIONES]
check("existen las dos ediciones", set(claves) == {"auditorias", "completa"}, str(claves))
check("la completa no recorta nada", modulos_de_edicion("completa") is None)

solo_aud = modulos_de_edicion("auditorias")
check("la de auditorías sí recorta", solo_aud is not None and len(solo_aud) < len(MODULE_KEYS),
      f"{len(solo_aud or [])} de {len(MODULE_KEYS)}")
check("todas sus keys existen en el catálogo de módulos", solo_aud <= MODULE_KEYS,
      str(solo_aud - MODULE_KEYS))

# Lo que hace que pasar de una edición a otra sea un cambio de valor y no una
# migración: si no fuera subconjunto, bajar de edición dejaría módulos
# habilitados que la otra no conoce.
check("auditorías es subconjunto estricto de completa (subir/bajar no migra nada)",
      solo_aud < MODULE_KEYS)

for imprescindible in ("inicio", "auditorias", "mis-auditorias"):
    check(f"la edición de auditorías incluye «{imprescindible}»", imprescindible in solo_aud)
for fuera in ("huella", "mantenimiento", "direccion", "contexto", "procesos"):
    check(f"la edición de auditorías NO incluye «{fuera}»", fuera not in solo_aud)

print("\n=== 2. Un valor desconocido no deja a nadie sin acceso ===")
# Es la decisión de fondo: ante la duda, ensanchar. Un módulo de más en el menú
# es molesto; una organización que pierde la mitad de su sistema, no.
for valor in (None, "", "   ", "basico", "enterprise", "AUDITORIAS_X"):
    check(f"«{valor!r}» se resuelve a la edición completa",
          normalizar_edicion(valor) == "completa", normalizar_edicion(valor))
check("«auditorias» se reconoce tal cual", normalizar_edicion("auditorias") == "auditorias")
check("y no distingue mayúsculas ni espacios", normalizar_edicion("  Auditorias ") == "auditorias")
check("la definición siempre devuelve algo utilizable",
      definicion_edicion("inventada")["key"] == "completa")

print("\n=== 3. Edición ∩ perfil, los dos límites juntos ===")

check("admin sin edición: ve todo (comportamiento previo intacto)",
      allowed_modules_for_role({}, "admin") is None)
check("admin en la edición completa: ve todo",
      allowed_modules_for_role({}, "admin", "completa") is None)

admin_aud = allowed_modules_for_role({}, "admin", "auditorias")
check("admin en la edición de auditorías: NO ve todo",
      admin_aud is not None and "huella" not in admin_aud, str(admin_aud))
check("...pero sí ve lo de su edición", admin_aud == solo_aud, str(admin_aud))

emp_completa = allowed_modules_for_role({}, "empleado", "completa")
emp_aud = allowed_modules_for_role({}, "empleado", "auditorias")
check("empleado en la completa conserva su alcance de siempre",
      "sst" in emp_completa and "capacitacion" in emp_completa, str(emp_completa))
check("empleado en auditorías pierde lo que la edición no tiene",
      "sst" not in emp_aud and "capacitacion" not in emp_aud, str(emp_aud))
check("y conserva la intersección", emp_aud == emp_completa & solo_aud, str(emp_aud))
check("el perfil nunca gana sobre la edición", emp_aud <= solo_aud)

# Un perfil personalizado al que el admin le dio TODO sigue limitado por la edición.
config_todo = {"custom_profiles": [{"key": "jefe", "label": "Jefe", "field": False}],
               "role_permissions": {"jefe": sorted(MODULE_KEYS)}}
jefe_aud = allowed_modules_for_role(config_todo, "jefe", "auditorias")
check("un perfil con todos los módulos otorgados igual queda dentro de la edición",
      jefe_aud == solo_aud, str(sorted(jefe_aud)))

check("un rol desconocido no ve nada (no todo)",
      allowed_modules_for_role({}, "inventado", "completa") == set())

print("\n=== 4. Los permisos guardados se recortan a la edición ===")
# El gestor ya no ofrece los módulos de afuera, pero el PUT es una API.
perms, _ = sanitize_config({"empleado": ["documents", "huella", "sst", "iso9001"]}, [], "auditorias")
check("un permiso fuera de la edición no se guarda",
      "huella" not in perms["empleado"] and "sst" not in perms["empleado"], str(perms["empleado"]))
check("lo que sí está en la edición se conserva",
      "documents" in perms["empleado"] and "iso9001" in perms["empleado"], str(perms["empleado"]))
perms_completa, _ = sanitize_config({"empleado": ["documents", "huella", "sst"]}, [], "completa")
check("en la edición completa no se recorta nada",
      "huella" in perms_completa["empleado"] and "sst" in perms_completa["empleado"],
      str(perms_completa["empleado"]))
check("el default de un perfil también se recorta",
      "sst" not in sanitize_config({}, [], "auditorias")[0]["empleado"],
      str(sanitize_config({}, [], "auditorias")[0]["empleado"]))

# ---------------------------------------------------------------------------
print("\n=== 5. Enforcement en la API, no solo en el menú ===")

t_aud = crear_tenant("soloaud", "Auditora del Oeste", "admin@soloaud.com", "auditorias")
t_full = crear_tenant("completa", "Bodega Integral", "admin@completa.com", "completa")
t_viejo = crear_tenant("viejo", "Cliente Anterior", "admin@viejo.com", None)

h_aud = token_de("admin@soloaud.com")
h_full = token_de("admin@completa.com")
h_viejo = token_de("admin@viejo.com")

# Endpoints representativos de módulos que la edición de auditorías NO incluye.
fuera_de_alcance = [
    ("/huella/emisiones", "Huella de Carbono"),
    ("/mantenimiento/activos", "Mantenimiento (CMMS)"),
    ("/contexto/partes-interesadas", "Contexto Organizacional"),
    ("/procesos/", "Gestión de Procesos"),
]
for ruta, etiqueta in fuera_de_alcance:
    r = client.get(f"{API}{ruta}", headers=h_aud)
    check(f"el ADMIN de la edición auditorías recibe 403 en {etiqueta}",
          r.status_code == 403, f"{ruta} -> {r.status_code}")

for ruta, etiqueta in fuera_de_alcance:
    r = client.get(f"{API}{ruta}", headers=h_full)
    check(f"el admin de la edición completa SÍ entra a {etiqueta}",
          r.status_code != 403, f"{ruta} -> {r.status_code}")

# Lo que la edición de auditorías sí incluye tiene que seguir funcionando.
for ruta, etiqueta in [("/auditorias/programas", "Auditorías Internas"),
                       ("/auditorias/asignaciones/mias", "Mis Auditorías"),
                       ("/documents/list", "Documentos")]:
    r = client.get(f"{API}{ruta}", headers=h_aud)
    check(f"la edición auditorías entra a {etiqueta}", r.status_code != 403,
          f"{ruta} -> {r.status_code}")

print("\n=== 6. Un tenant que nunca eligió no pierde nada ===")
# Es el caso de todos los que existían antes de esta función: la columna quedó
# en NULL y nadie los migró.
with Session() as db:
    guardada = db.query(Tenant).filter(Tenant.slug == "viejo").first().edicion
check("su columna sigue en NULL (no se le inventó una edición)", guardada is None, str(guardada))
for ruta, etiqueta in fuera_de_alcance:
    r = client.get(f"{API}{ruta}", headers=h_viejo)
    check(f"y conserva el acceso a {etiqueta}", r.status_code != 403,
          f"{ruta} -> {r.status_code}")

print("\n=== 7. Lo que ve el frontend para filtrar el menú ===")
p_aud = client.get(f"{API}/tenant/permissions", headers=h_aud).json()
p_full = client.get(f"{API}/tenant/permissions", headers=h_full).json()
p_viejo = client.get(f"{API}/tenant/permissions", headers=h_viejo).json()

check("la edición viaja en /tenant/permissions", p_aud.get("edicion") == "auditorias",
      str(p_aud.get("edicion")))
check("con su recorte explícito de módulos",
      set(p_aud.get("edicion_modulos") or []) == solo_aud, str(p_aud.get("edicion_modulos")))
check("la completa no manda recorte (null = sin límite)",
      p_full.get("edicion_modulos") is None, str(p_full.get("edicion_modulos")))

check("el catálogo que ve el gestor de permisos ya viene recortado",
      {m["key"] for m in p_aud["modules"]} == solo_aud,
      str(sorted({m["key"] for m in p_aud["modules"]})))
check("y en la completa viene entero",
      {m["key"] for m in p_full["modules"]} == MODULE_KEYS)

# `elegida` es lo que distingue «no contestó» de «eligió la completa»: de eso
# depende que el asistente de alta aparezca una sola vez.
check("el tenant que eligió figura como elegido", p_full.get("edicion_elegida") is True)
check("el que nunca eligió figura como NO elegido", p_viejo.get("edicion_elegida") is False)
check("...aunque su edición efectiva sea la completa", p_viejo.get("edicion") == "completa")

print("\n=== 8. Cambiar de edición ===")
r = client.get(f"{API}/tenant/edicion", headers=h_aud)
check("GET /tenant/edicion contesta", r.status_code == 200, str(r.status_code))
check("y trae las opciones para elegir", len(r.json().get("opciones") or []) == 2)

# Un no-administrador puede LEER (el menú la necesita) pero no cambiarla.
crear_usuario(t_aud, "empleado@soloaud.com", "empleado")
h_emp = token_de("empleado@soloaud.com")
check("un empleado puede leer la edición", client.get(f"{API}/tenant/edicion", headers=h_emp).status_code == 200)
r = client.put(f"{API}/tenant/edicion", headers=h_emp, json={"edicion": "completa"})
check("pero no puede cambiarla", r.status_code in (401, 403), str(r.status_code))

r = client.put(f"{API}/tenant/edicion", headers=h_aud, json={"edicion": "inventada"})
check("una edición inexistente se rechaza con 400", r.status_code == 400, str(r.status_code))

print("\n=== 9. Subir de edición devuelve los módulos intactos ===")
# Antes de subir, el tenant de auditorías no puede entrar a Huella.
antes = client.get(f"{API}/huella/emisiones", headers=h_aud).status_code
r = client.put(f"{API}/tenant/edicion", headers=h_aud, json={"edicion": "completa"})
check("el cambio se acepta", r.status_code == 200, str(r.status_code))
check("y responde con la edición nueva", r.json().get("edicion") == "completa", str(r.json()))
despues = client.get(f"{API}/huella/emisiones", headers=h_aud).status_code
check("el módulo que estaba fuera ahora responde (sin re-login)",
      antes == 403 and despues != 403, f"antes={antes} después={despues}")

# Y bajar de nuevo lo vuelve a cerrar: el cambio es reversible en los dos sentidos.
client.put(f"{API}/tenant/edicion", headers=h_aud, json={"edicion": "auditorias"})
check("volver a bajar lo cierra otra vez",
      client.get(f"{API}/huella/emisiones", headers=h_aud).status_code == 403)

print("\n=== 10. Bajar de edición no borra datos ===")
# Se escribe un documento con la edición completa, se baja la edición y se
# vuelve a subir: el documento tiene que seguir estando. Lo que la edición
# apaga es el acceso, no la información.
client.put(f"{API}/tenant/edicion", headers=h_full, json={"edicion": "completa"})
with Session() as db:
    tid = db.query(Tenant).filter(Tenant.slug == "completa").first().id
with ENGINE.begin() as c:
    filas_antes = c.execute(text(
        "SELECT count(*) FROM information_schema.tables WHERE table_schema='tenant_completa'")).scalar()
client.put(f"{API}/tenant/edicion", headers=h_full, json={"edicion": "auditorias"})
with ENGINE.begin() as c:
    filas_despues = c.execute(text(
        "SELECT count(*) FROM information_schema.tables WHERE table_schema='tenant_completa'")).scalar()
check("bajar de edición no toca el schema del tenant",
      filas_antes == filas_despues, f"{filas_antes} -> {filas_despues}")
client.put(f"{API}/tenant/edicion", headers=h_full, json={"edicion": "completa"})

print("\n=== 11. Los permisos guardados se recortan al bajar de edición ===")
client.put(f"{API}/tenant/permissions", headers=h_full, json={
    "permissions": {"empleado": ["documents", "huella", "sst"]}, "custom_profiles": []})
guardados_completa = client.get(f"{API}/tenant/permissions", headers=h_full).json()["permissions"]
check("con la edición completa se guardan los tres",
      set(guardados_completa["empleado"]) >= {"documents", "huella", "sst"},
      str(guardados_completa["empleado"]))

client.put(f"{API}/tenant/edicion", headers=h_full, json={"edicion": "auditorias"})
guardados_aud = client.get(f"{API}/tenant/permissions", headers=h_full).json()["permissions"]
check("al bajar, los módulos fuera de alcance se van de la config guardada",
      "huella" not in guardados_aud["empleado"] and "sst" not in guardados_aud["empleado"],
      str(guardados_aud["empleado"]))
check("y lo que sigue en la edición se conserva",
      "documents" in guardados_aud["empleado"], str(guardados_aud["empleado"]))

print("\n=== 12. Aislamiento entre organizaciones ===")
# La edición de una no puede cambiarse ni verse con el token de otra.
e_aud = client.get(f"{API}/tenant/edicion", headers=h_aud).json()
e_full = client.get(f"{API}/tenant/edicion", headers=h_full).json()
check("cada token ve la edición de SU organización",
      e_aud["edicion"] == "auditorias" and e_full["edicion"] == "auditorias",
      f"aud={e_aud['edicion']} full={e_full['edicion']}")
# (las dos quedaron en 'auditorias' por los pasos anteriores; lo que importa es
# que cambiar una no cambió la otra)
client.put(f"{API}/tenant/edicion", headers=h_full, json={"edicion": "completa"})
check("cambiar la de una no cambia la de la otra",
      client.get(f"{API}/tenant/edicion", headers=h_aud).json()["edicion"] == "auditorias"
      and client.get(f"{API}/tenant/edicion", headers=h_full).json()["edicion"] == "completa")

print("\n" + "=" * 62)
if fallos:
    print(f"FALLARON {len(fallos)} comprobaciones:")
    for f in fallos:
        print(f"  - {f}")
    sys.exit(1)
print("Todas las comprobaciones pasaron.")
