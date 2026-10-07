"""
Ubicación y contacto de la auditoría de campo.

El auditor asignado recibía el área auditada junto a un ícono de mapa, que no
es una ubicación: sabía QUÉ tenía que auditar pero no a qué domicilio ir, a qué
hora ni a quién presentarse al llegar.

Lo que se verifica acá: que la asignación llegue con la organización, el
domicilio, el pin del mapa, el horario, el referente en sitio y el alcance;
que cuando la asignación no los trae los herede de la ficha de la organización
sin ensuciar la fila; que el auditor de campo los vea en su propio listado
—que es el que se guarda para trabajar sin señal—; que no pueda cambiar la
planificación que acordó el líder; y que el domicilio de una organización no se
vea con el token de otra.

Necesita un Postgres real: la resolución de la ubicación cruza el schema del
tenant con public.tenants.

    export TEST_DATABASE_URL="postgresql+psycopg2://usuario:clave@localhost:5432/basedeprueba"
    python tests/test_ubicacion_auditoria.py

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
from app.models.auditoria import AuditoriaAsignacion
from app.models.tenant import Tenant
from app.models.user import User
from app.models.user_tenant import UserTenant
from app.core.config import settings
from app.core.security import get_password_hash
from app.services import notifications
from app.services.ubicacion import direccion_efectiva, jornada_legible, url_de_mapa
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


# Los correos se capturan para poder leer lo que recibiría el auditor.
enviados = []
_send_real = notifications._send
notifications._send = lambda to, subject, text_body, html_body: (
    enviados.append({"to": to, "subject": subject, "text": text_body, "html": html_body}) or True)


with ENGINE.begin() as c:
    c.execute(text("DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;"))
    c.execute(text("DROP SCHEMA IF EXISTS tenant_olca CASCADE;"))
    c.execute(text("DROP SCHEMA IF EXISTS tenant_otra CASCADE;"))
Base.metadata.create_all(
    ENGINE, tables=[t for t in Base.metadata.sorted_tables if t.schema == "public"])

CLAVE = "Secreta123"
DOMICILIO_OLCA = "Ruta 40 Sur 1234, Luján de Cuyo, Mendoza"


def crear_tenant(slug, nombre, email_admin, **ficha):
    with Session() as db:
        t = Tenant(id=uuid.uuid4(), slug=slug, name=nombre, two_factor_enabled=False, **ficha)
        db.add(t)
        db.flush()
        u = User(id=uuid.uuid4(), tenant_id=t.id, email=email_admin, full_name="Marisol Seco",
                 role="admin", password_hash=get_password_hash(CLAVE), active=True)
        db.add(u)
        db.flush()
        db.add(UserTenant(id=uuid.uuid4(), user_id=u.id, tenant_id=t.id, role="admin", active=True))
        db.commit()
        return t.id


def crear_auditor(tenant_id, email, nombre):
    with Session() as db:
        u = User(id=uuid.uuid4(), tenant_id=tenant_id, email=email, full_name=nombre,
                 role="auditor", password_hash=get_password_hash(CLAVE), active=True)
        db.add(u)
        db.flush()
        db.add(UserTenant(id=uuid.uuid4(), user_id=u.id, tenant_id=tenant_id,
                          role="auditor", active=True))
        db.commit()
        return u.id


def token_de(email):
    client.post(f"{API}/auth/login", json={"email": email, "password": CLAVE})
    tok = client.post(f"{API}/auth/verify-2fa",
                      json={"email": email, "code": "BYPASS"}).json()["access_token"]
    return {"Authorization": f"Bearer {tok}"}


print("\n=== 1. Armado del pin del mapa y del domicilio efectivo ===")
check("las coordenadas tienen prioridad sobre el texto",
      url_de_mapa("Av. San Martín 100", -33.0, -68.8)
      == "https://www.google.com/maps/search/?api=1&query=-33.0,-68.8",
      url_de_mapa("Av. San Martín 100", -33.0, -68.8))
check("sin coordenadas, el domicilio va codificado para URL",
      url_de_mapa("Ruta 40 Sur 1234, Luján de Cuyo")
      == "https://www.google.com/maps/search/?api=1&query=Ruta%2040%20Sur%201234%2C%20Luj%C3%A1n%20de%20Cuyo",
      url_de_mapa("Ruta 40 Sur 1234, Luján de Cuyo"))
check("sin domicilio ni coordenadas no hay enlace (y no un mapa vacío)",
      url_de_mapa(None) is None and url_de_mapa("   ") is None)
check("una latitud 0 sigue siendo una coordenada válida",
      url_de_mapa(None, 0.0, 0.0) == "https://www.google.com/maps/search/?api=1&query=0.0,0.0",
      str(url_de_mapa(None, 0.0, 0.0)))
check("con una sola coordenada se usa el texto, no media coordenada",
      url_de_mapa("Mendoza", -33.0, None) is not None
      and "query=Mendoza" in url_de_mapa("Mendoza", -33.0, None),
      str(url_de_mapa("Mendoza", -33.0, None)))

check("manda el domicilio de la asignación", direccion_efectiva("Obra Ruta 7 km 12", DOMICILIO_OLCA)
      == "Obra Ruta 7 km 12")
check("sin el de la asignación, el de la organización",
      direccion_efectiva(None, DOMICILIO_OLCA) == DOMICILIO_OLCA)
check("un campo con espacios cuenta como vacío y no tapa el de la organización",
      direccion_efectiva("   ", DOMICILIO_OLCA) == DOMICILIO_OLCA)
check("sin ninguno de los dos, no hay domicilio",
      direccion_efectiva(None, None) is None and direccion_efectiva("", "  ") is None)

check("jornada con las dos horas", jornada_legible("09:00", "13:00") == "09:00 a 13:00 hs",
      str(jornada_legible("09:00", "13:00")))
check("jornada con sólo la de inicio", jornada_legible("09:00", None) == "desde las 09:00 hs",
      str(jornada_legible("09:00", None)))
check("sin horas no hay jornada", jornada_legible(None, None) is None)


olca = crear_tenant("olca", "OLCA S.A.", "calidad@olca.com",
                    domicilio=DOMICILIO_OLCA, telefono="261 555-1234",
                    contacto_nombre="Ramiro Ponce", contacto_email="recepcion@olca.com")
otra = crear_tenant("otra", "Otra Empresa S.A.", "calidad@otra.com",
                    domicilio="Belgrano 900, Ciudad de Mendoza")
auditor_id = crear_auditor(olca, "auditor.campo@olca.com", "Nadia Robledo")

H = token_de("calidad@olca.com")          # auditor líder (admin)
H2 = token_de("calidad@otra.com")         # líder de la otra organización
HC = token_de("auditor.campo@olca.com")   # auditor de campo
client.get(f"{API}/auditorias/programas", headers=H)    # aprovisiona el schema
client.get(f"{API}/auditorias/programas", headers=H2)

prog = client.post(f"{API}/auditorias/programas", headers=H, json={
    "titulo": "Auditoría Interna de Calidad 2026",
    "objetivos": "Verificar la conformidad del SGC.",
    "alcance": "Servicio de alquiler de vehículos livianos, pesados y máquinas viales.",
    "fecha_inicio": "2026-10-20", "fecha_fin": "2026-10-20",
    "estado": "planificado", "norma": "ISO 9001",
}).json()


def asignar(headers=H, **extra):
    cuerpo = {
        "programa_id": prog["id"], "auditor_id": str(auditor_id),
        "area": "Taller de mantenimiento", "norma": "ISO 9001",
        "fecha_programada": "2026-10-20",
    }
    cuerpo.update(extra)
    return client.post(f"{API}/auditorias/asignaciones", headers=headers, json=cuerpo)


print("\n=== 2. Sin datos propios, la asignación hereda la ficha de la organización ===")
enviados.clear()
r = asignar()
check("POST /asignaciones responde 201", r.status_code == 201, f"{r.status_code} {r.text[:240]}")
a = r.json() if r.status_code == 201 else {}
heredada_id = a.get("id")
check("trae el nombre de la organización auditada", a.get("organizacion") == "OLCA S.A.",
      str(a.get("organizacion")))
check("trae el domicilio de la organización", a.get("direccion") == DOMICILIO_OLCA,
      str(a.get("direccion")))
check("trae el enlace al mapa", (a.get("mapa_url") or "").startswith(
    "https://www.google.com/maps/search/?api=1&query=Ruta%2040"), str(a.get("mapa_url")))
check("trae el alcance del programa",
      "alquiler de vehículos" in (a.get("programa_alcance") or ""),
      str(a.get("programa_alcance"))[:80])
check("trae los objetivos del programa",
      "conformidad del SGC" in (a.get("programa_objetivos") or ""),
      str(a.get("programa_objetivos"))[:80])
contacto = a.get("contacto") or {}
check("el contacto sale de la organización", contacto.get("nombre") == "Ramiro Ponce",
      str(contacto))
check("con su teléfono", contacto.get("telefono") == "261 555-1234", str(contacto))
check("y queda marcado como contacto de la organización",
      contacto.get("de_la_organizacion") is True, str(contacto))

print("\n=== 3. Heredar no escribe en la fila de la asignación ===")
# Si el valor heredado se asignara sobre las columnas del modelo, el contacto de
# la organización terminaría guardado dentro de la asignación en el primer
# flush, y después no habría forma de distinguir lo acordado de lo heredado.
with Session() as db:
    fila = db.execute(text(
        'SELECT contacto_nombre, contacto_telefono, lugar_direccion '
        'FROM tenant_olca.auditorias_asignaciones WHERE id = :i'
    ), {"i": heredada_id}).first()
    check("contacto_nombre sigue NULL en la base", fila[0] is None, str(fila[0]))
    check("contacto_telefono sigue NULL en la base", fila[1] is None, str(fila[1]))
    check("lugar_direccion sigue NULL en la base", fila[2] is None, str(fila[2]))

print("\n=== 4. El correo de asignación alcanza para llegar ===")
check("salió un correo al auditor asignado",
      any(e["to"] == "auditor.campo@olca.com" for e in enviados), str([e["to"] for e in enviados]))
correo = next((e for e in enviados if e["to"] == "auditor.campo@olca.com"), None)
cuerpo = (correo or {}).get("text", "")
html = (correo or {}).get("html", "")
check("el asunto nombra la organización", "OLCA S.A." in (correo or {}).get("subject", ""),
      str((correo or {}).get("subject")))
check("el cuerpo trae el domicilio", DOMICILIO_OLCA in cuerpo, cuerpo[:300])
check("el cuerpo trae el enlace al mapa", "google.com/maps" in cuerpo, cuerpo[:300])
check("el cuerpo trae a quién buscar", "Ramiro Ponce" in cuerpo, cuerpo[:300])
check("el cuerpo trae la fecha", "20/10/2026" in cuerpo, cuerpo[:300])
check("el cuerpo trae el alcance", "alquiler de vehículos" in cuerpo, cuerpo[:400])
check("aclara que el contacto es el general de la organización",
      "contacto general de la organización" in cuerpo, cuerpo[:600])
check("el HTML deja el teléfono como enlace para llamar", 'href="tel:' in html, html[:200])

print("\n=== 5. La asignación puede fijar su propia sede y referente ===")
enviados.clear()
r = asignar(
    area="Obra Ruta 7", lugar_nombre="Obrador Ruta 7 km 12",
    lugar_direccion="Ruta Nacional 7 km 12, Palmira, San Martín, Mendoza",
    hora_inicio="08:30", hora_fin="12:30",
    contacto_nombre="Ernesto Lagos", contacto_cargo="Jefe de Obra",
    contacto_telefono="263 444-9876", contacto_email="elagos@olca.com",
)
check("POST con ubicación propia responde 201", r.status_code == 201, f"{r.status_code} {r.text[:240]}")
b = r.json() if r.status_code == 201 else {}
propia_id = b.get("id")
check("manda el domicilio de la asignación sobre el de la organización",
      b.get("direccion") == "Ruta Nacional 7 km 12, Palmira, San Martín, Mendoza",
      str(b.get("direccion")))
check("guarda el nombre de la sede", b.get("lugar_nombre") == "Obrador Ruta 7 km 12",
      str(b.get("lugar_nombre")))
check("arma la jornada legible", b.get("jornada") == "08:30 a 12:30 hs", str(b.get("jornada")))
cb = b.get("contacto") or {}
check("el referente es el de la asignación", cb.get("nombre") == "Ernesto Lagos", str(cb))
check("con su cargo", cb.get("cargo") == "Jefe de Obra", str(cb))
check("y NO queda marcado como el de la organización",
      cb.get("de_la_organizacion") is False, str(cb))
check("el teléfono es el del referente y no el de la empresa",
      cb.get("telefono") == "263 444-9876", str(cb))
correo2 = next((e for e in enviados if e["to"] == "auditor.campo@olca.com"), None)
check("el correo no sugiere pedir por otro responsable",
      "contacto general de la organización" not in (correo2 or {}).get("text", ""),
      str((correo2 or {}).get("text", ""))[:400])

print("\n=== 6. Un referente parcial no se mezcla con el de la empresa ===")
# Si la asignación nombra a alguien sin teléfono, no se le cuelga el número de
# la recepción: se mostraría un número ajeno como si fuera el suyo.
r = asignar(area="Pañol", contacto_nombre="Silvina Arce")
c = (r.json().get("contacto") or {}) if r.status_code == 201 else {}
check("vale la persona de la asignación", c.get("nombre") == "Silvina Arce", str(c))
check("y su teléfono queda vacío en lugar de heredar el de la empresa",
      c.get("telefono") is None, str(c))

print("\n=== 7. El auditor de campo ve todo esto en SU listado ===")
r = client.get(f"{API}/auditorias/asignaciones/mias", headers=HC)
check("GET /asignaciones/mias responde 200", r.status_code == 200, f"{r.status_code} {r.text[:200]}")
mias = r.json() if r.status_code == 200 else []
check("ve sus asignaciones", len(mias) >= 3, str(len(mias)))
una = next((m for m in mias if m["id"] == heredada_id), None)
check("con el nombre de la organización", (una or {}).get("organizacion") == "OLCA S.A.",
      str((una or {}).get("organizacion")))
check("con el domicilio resuelto", (una or {}).get("direccion") == DOMICILIO_OLCA,
      str((una or {}).get("direccion")))
check("con el pin del mapa", bool((una or {}).get("mapa_url")), str((una or {}).get("mapa_url")))
check("con el referente", ((una or {}).get("contacto") or {}).get("nombre") == "Ramiro Ponce",
      str((una or {}).get("contacto")))
check("y con el alcance, para saber qué entra en la visita",
      "alquiler de vehículos" in ((una or {}).get("programa_alcance") or ""),
      str((una or {}).get("programa_alcance"))[:80])

r = client.get(f"{API}/auditorias/asignaciones/{heredada_id}/detalle", headers=HC)
check("el detalle que abre la app trae lo mismo",
      r.status_code == 200 and r.json().get("direccion") == DOMICILIO_OLCA,
      f"{r.status_code} {r.text[:200]}")

print("\n=== 8. La planificación la cambia el líder, no el que ejecuta ===")
r = client.patch(f"{API}/auditorias/asignaciones/{heredada_id}", headers=HC,
                 json={"estado": "en_progreso"})
check("el auditor de campo sí puede mover el estado de su auditoría",
      r.status_code == 200, f"{r.status_code} {r.text[:200]}")

r = client.patch(f"{API}/auditorias/asignaciones/{heredada_id}", headers=HC,
                 json={"lugar_direccion": "Mi casa 123"})
check("pero no puede cambiar el domicilio acordado", r.status_code == 403,
      f"{r.status_code} {r.text[:200]}")
r = client.patch(f"{API}/auditorias/asignaciones/{heredada_id}", headers=HC,
                 json={"contacto_telefono": "000"})
check("ni el teléfono del referente", r.status_code == 403, f"{r.status_code} {r.text[:200]}")
r = client.patch(f"{API}/auditorias/asignaciones/{heredada_id}", headers=HC,
                 json={"fecha_programada": "2027-01-01"})
check("ni la fecha programada", r.status_code == 403, f"{r.status_code} {r.text[:200]}")
with Session() as db:
    fila = db.execute(text(
        'SELECT lugar_direccion, contacto_telefono, fecha_programada '
        'FROM tenant_olca.auditorias_asignaciones WHERE id = :i'
    ), {"i": heredada_id}).first()
    check("nada de eso quedó escrito en la base",
          fila[0] is None and fila[1] is None and str(fila[2]) == "2026-10-20", str(fila))

r = client.patch(f"{API}/auditorias/asignaciones/{heredada_id}", headers=H,
                 json={"lugar_direccion": "Av. Acceso Sur 500, Maipú, Mendoza",
                       "hora_inicio": "10:00"})
check("el líder sí puede corregir la planificación", r.status_code == 200,
      f"{r.status_code} {r.text[:200]}")
check("y la corrección se refleja en el domicilio efectivo",
      r.json().get("direccion") == "Av. Acceso Sur 500, Maipú, Mendoza",
      str(r.json().get("direccion")))
check("y en la jornada", r.json().get("jornada") == "desde las 10:00 hs",
      str(r.json().get("jornada")))

print("\n=== 9. El horario se valida al entrar ===")
r = asignar(area="Horario raro", hora_inicio="9:00")
check("«9:00» (sin cero) se rechaza con 422", r.status_code == 422, f"{r.status_code} {r.text[:200]}")
r = asignar(area="Horario raro", hora_inicio="25:00")
check("«25:00» se rechaza con 422", r.status_code == 422, f"{r.status_code} {r.text[:200]}")
r = asignar(area="Horario válido", hora_inicio="09:00")
check("«09:00» se acepta", r.status_code == 201, f"{r.status_code} {r.text[:200]}")
r = asignar(area="Coordenada imposible", lugar_lat=120.0, lugar_lng=0.0)
check("una latitud de 120° se rechaza con 422", r.status_code == 422, f"{r.status_code} {r.text[:200]}")

print("\n=== 10. Coordenadas: el pin cae en el punto exacto ===")
r = asignar(area="Silos sobre ruta", lugar_direccion="Ruta 40, sin numeración",
            lugar_lat=-33.0581, lugar_lng=-68.8761)
d = r.json() if r.status_code == 201 else {}
check("el enlace usa las coordenadas y no el texto",
      d.get("mapa_url") == "https://www.google.com/maps/search/?api=1&query=-33.0581,-68.8761",
      str(d.get("mapa_url")))
check("pero el domicilio escrito se sigue mostrando",
      d.get("direccion") == "Ruta 40, sin numeración", str(d.get("direccion")))

print("\n=== 11. El domicilio de una organización no se ve desde otra ===")
r = client.get(f"{API}/tenant/organizacion", headers=H)
check("GET /tenant/organizacion devuelve la ficha propia",
      r.status_code == 200 and r.json().get("domicilio") == DOMICILIO_OLCA,
      f"{r.status_code} {r.text[:200]}")
r2 = client.get(f"{API}/tenant/organizacion", headers=H2)
check("la otra organización ve la suya, no la de OLCA",
      r2.status_code == 200 and r2.json().get("domicilio") == "Belgrano 900, Ciudad de Mendoza",
      f"{r2.status_code} {r2.text[:200]}")
r = client.get(f"{API}/auditorias/asignaciones", headers=H2)
check("y no ve ninguna asignación de OLCA", r.status_code == 200 and r.json() == [],
      f"{r.status_code} {r.text[:200]}")
r = client.get(f"{API}/auditorias/asignaciones/{heredada_id}/detalle", headers=H2)
check("pedir el detalle de una asignación ajena da 404",
      r.status_code == 404, f"{r.status_code} {r.text[:200]}")

print("\n=== 12. La ficha de la organización se puede editar ===")
r = client.put(f"{API}/tenant/organizacion", headers=H, json={
    "domicilio": "Carril Gómez 450, Maipú, Mendoza",
    "telefono": "261 400-0000",
    "contacto_nombre": "Valeria Cruz",
    "contacto_email": "vcruz@olca.com",
})
check("PUT responde 200", r.status_code == 200, f"{r.status_code} {r.text[:200]}")
check("devuelve el domicilio guardado",
      r.json().get("domicilio") == "Carril Gómez 450, Maipú, Mendoza", str(r.json()))

# El cambio tiene que alcanzar a las asignaciones que heredan, sin tocarlas.
r = client.get(f"{API}/auditorias/asignaciones/mias", headers=HC)
heredan = [m for m in r.json() if m["id"] not in (heredada_id, propia_id)]
check("las asignaciones que heredan toman el domicilio nuevo",
      all(m.get("direccion") == "Carril Gómez 450, Maipú, Mendoza"
          for m in heredan if not m.get("lugar_direccion")),
      str([(m["area"], m.get("direccion")) for m in heredan])[:300])
una_propia = next((m for m in r.json() if m["id"] == propia_id), None)
check("la que tiene domicilio propio no se ve afectada",
      (una_propia or {}).get("direccion") == "Ruta Nacional 7 km 12, Palmira, San Martín, Mendoza",
      str((una_propia or {}).get("direccion")))

r = client.put(f"{API}/tenant/organizacion", headers=H, json={"domicilio": "   "})
check("un domicilio en blanco se guarda como vacío y no como espacios",
      r.status_code == 200 and r.json().get("domicilio") is None, str(r.json()))
r = client.put(f"{API}/tenant/organizacion", headers=H, json={"name": ""})
check("el nombre no se puede vaciar (identifica a la organización)",
      r.status_code in (200, 422) and client.get(
          f"{API}/tenant/organizacion", headers=H).json().get("name") == "OLCA S.A.",
      str(client.get(f"{API}/tenant/organizacion", headers=H).json().get("name")))

print("\n=== 13. Sin domicilio cargado, la respuesta lo dice en vez de inventarlo ===")
r = client.get(f"{API}/auditorias/asignaciones/mias", headers=HC)
sin_dom = [m for m in r.json() if not m.get("lugar_direccion")]
check("las que heredaban quedan sin domicilio y sin mapa",
      all(m.get("direccion") is None and m.get("mapa_url") is None for m in sin_dom),
      str([(m["area"], m.get("direccion"), m.get("mapa_url")) for m in sin_dom])[:300])

r = client.put(f"{API}/tenant/organizacion", headers=HC, json={"domicilio": "Mi casa"})
check("un auditor de campo no puede editar la ficha de la organización",
      r.status_code == 403, f"{r.status_code} {r.text[:200]}")

notifications._send = _send_real

print()
if fallos:
    print(f"FALLARON {len(fallos)} comprobaciones:")
    for f in fallos:
        print(f"  - {f}")
    sys.exit(1)
print("Todas las comprobaciones pasaron")
