"""
Cartera de empresas auditadas y plantillas de checklist propias.

Las dos mitades de lo que hace falta para que la plataforma le sirva a un
auditor de cualquier actividad, y no solo al responsable de calidad que audita
su propia casa:

1. **Empresas auditadas.** La plataforma asumía que la organización auditaba su
   propia casa: la ficha de `public.tenants` era a la vez quién usa el sistema y
   qué se audita. Un auditor externo con quince clientes mandaba a su equipo al
   domicilio de su propio estudio. Ahora la asignación apunta a una empresa de
   la cartera y el auditor recibe el nombre y la dirección del CLIENTE.

2. **Plantillas propias.** Una plantilla solo podía nacer de una asignación ya
   cargada, tipeando pregunta por pregunta, y los catálogos por norma venían
   con el código y no se podían tocar. Quien llegaba con su checklist en Excel
   —que es como trabaja la mayoría— no tenía por dónde entrar.

Lo que más se mira acá es la **precedencia**, porque es donde un error manda a
una persona a la dirección equivocada: lo acordado para esta visita gana sobre
la ficha del cliente, y la ficha del cliente gana sobre la de la organización.
Y que heredar **no escriba**: el mismo riesgo que ya tenía el contacto de la
organización.

Necesita un Postgres real.

    export TEST_DATABASE_URL="postgresql+psycopg2://usuario:clave@localhost:5432/basedeprueba"
    python tests/test_empresas_y_plantillas.py

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
from app.services import notifications
from app.services.checklist_csv import a_csv, parsear_csv
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


enviados = []
notifications._send = lambda to, subject, text_body, html_body: (
    enviados.append({"to": to, "subject": subject, "text": text_body, "html": html_body}) or True)


with ENGINE.begin() as c:
    c.execute(text("DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;"))
    for s in ("tenant_estudio", "tenant_rival"):
        c.execute(text(f"DROP SCHEMA IF EXISTS {s} CASCADE;"))
Base.metadata.create_all(
    ENGINE, tables=[t for t in Base.metadata.sorted_tables if t.schema == "public"])

CLAVE = "Secreta123"
DOMICILIO_ESTUDIO = "Av. Colón 500, Ciudad, Mendoza"
DOMICILIO_BODEGA = "Ruta 40 Sur 2200, Luján de Cuyo, Mendoza"


def crear_tenant(slug, nombre, email_admin, **ficha):
    with Session() as db:
        t = Tenant(id=uuid.uuid4(), slug=slug, name=nombre, two_factor_enabled=False, **ficha)
        db.add(t); db.flush()
        u = User(id=uuid.uuid4(), tenant_id=t.id, email=email_admin, full_name="Marisol Seco",
                 role="admin", password_hash=get_password_hash(CLAVE), active=True)
        db.add(u); db.flush()
        db.add(UserTenant(id=uuid.uuid4(), user_id=u.id, tenant_id=t.id, role="admin", active=True))
        db.commit()
        return t.id


def crear_auditor(tenant_id, email, nombre):
    with Session() as db:
        u = User(id=uuid.uuid4(), tenant_id=tenant_id, email=email, full_name=nombre,
                 role="auditor", password_hash=get_password_hash(CLAVE), active=True)
        db.add(u); db.flush()
        db.add(UserTenant(id=uuid.uuid4(), user_id=u.id, tenant_id=tenant_id,
                          role="auditor", active=True))
        db.commit()
        return u.id


def token_de(email):
    client.post(f"{API}/auth/login", json={"email": email, "password": CLAVE})
    tok = client.post(f"{API}/auth/verify-2fa",
                      json={"email": email, "code": "BYPASS"}).json()["access_token"]
    return {"Authorization": f"Bearer {tok}"}


# ===========================================================================
print("\n=== 1. Lectura de CSV: los formatos que la gente realmente tiene ===")

# Excel en español guarda con punto y coma (la coma es el separador decimal) y
# antepone un BOM. Exigir coma habría rechazado el archivo más común.
items, probs = parsear_csv("﻿Cláusula;Pregunta;Módulo\n4.1;¿Está señalizada la salida?;Depósito\n")
check("Excel en español (punto y coma, BOM y tildes)",
      len(items) == 1 and items[0]["pregunta"] == "¿Está señalizada la salida?"
      and items[0]["modulo"] == "Depósito", str(items))
check("...y el BOM no se cuela en el nombre de la columna",
      items and items[0]["clausula"] == "4.1", str(items))

items, _ = parsear_csv("clausula,pregunta\nA.1,¿Hay extintor?\n")
check("CSV con coma", len(items) == 1 and items[0]["clausula"] == "A.1", str(items))

items, _ = parsear_csv("pregunta\tevidencia\n¿Hay registro?\tPlanilla diaria\n")
check("pegado desde una planilla (tabulaciones)",
      len(items) == 1 and items[0]["evidencia"] == "Planilla diaria", str(items))

# Mucha gente pega dos columnas y listo.
items, _ = parsear_csv("1.1,¿Se usa casco?\n1.2,¿Hay botiquín?\n")
check("archivo sin encabezado", len(items) == 2 and items[1]["clausula"] == "1.2", str(items))

items, _ = parsear_csv("CLÁUSULA ; PREGUNTA\n1;¿Ok?\n")
check("encabezado con mayúsculas, tildes y espacios", len(items) == 1, str(items))

items, _ = parsear_csv("requisito;verificacion\n5;¿Sí?\n")
check("sinónimos de columna (requisito/verificacion)", len(items) == 1, str(items))

print("\n=== 2. Un archivo imperfecto importa lo que se puede ===")
# Rechazar cien filas por dos malas obliga a adivinar cuáles son.
items, probs = parsear_csv("punto;pregunta;color\n1;¿Ok?;rojo\n2;;azul\n3;¿Y esta?;verde\n")
check("las filas buenas entran", len(items) == 2, str(items))
check("la fila sin pregunta se reporta con su número",
      any("Fila 3" in p for p in probs), str(probs))
check("la columna desconocida se avisa y se ignora",
      any("color" in p for p in probs), str(probs))

items, probs = parsear_csv("")
check("archivo vacío: ningún ítem y un motivo claro",
      items == [] and probs and "vac" in probs[0].lower(), str(probs))

# Un archivo de dos columnas SIN encabezado es estructuralmente idéntico a un
# checklist sin encabezado: una lista de contactos entra igual. No se puede
# rechazar sin rechazar también el caso legítimo, que es frecuente. Lo que sí
# se puede —y se hace— es decir en voz alta qué interpretación se usó, para
# que se vea en la vista previa antes de confirmar.
items, probs = parsear_csv("nombre;apellido\nJuan;Perez\n")
check("un archivo sin encabezado avisa cómo se interpretaron las columnas",
      any("no trae encabezado" in p for p in probs), str(probs))
check("...y el aviso dice cómo arreglarlo",
      any("clausula;pregunta" in p for p in probs), str(probs))

items, probs = parsear_csv("nombre\nJuan\nPedro\n")
check("una sola columna sin encabezado no inventa preguntas",
      items == [] and any("columna de preguntas" in p for p in probs), str(probs))
check("...y el mensaje dice exactamente qué poner",
      any("clausula;pregunta" in p for p in probs), str(probs))

items, _ = parsear_csv("nombre;pregunta\nJuan;¿Hay casco?\n")
check("con un encabezado donde «pregunta» sí está, se usa esa columna",
      len(items) == 1 and items[0]["pregunta"] == "¿Hay casco?", str(items))

largo = "¿" + ("x" * 2500) + "?"
items, probs = parsear_csv(f"pregunta\n{largo}\n")
check("una pregunta desmedida se recorta y se avisa",
      len(items) == 1 and len(items[0]["pregunta"]) == 2000 and probs, str(probs)[:120])

muchas = "pregunta\n" + "\n".join(f"¿Pregunta {i}?" for i in range(600))
items, probs = parsear_csv(muchas)
check("un archivo enorme se corta en el tope y lo dice",
      len(items) == 500 and any("500" in p for p in probs), f"{len(items)} {probs[:1]}")

print("\n=== 3. Lo exportado se puede volver a importar ===")
originales, _ = parsear_csv("﻿Cláusula;Pregunta;Módulo\n4.1;¿Está señalizada la salida?;Depósito\n")
texto = a_csv(originales)
check("el export arranca con BOM (si no, Excel rompe los acentos)", texto.startswith("﻿"))
vuelta, _ = parsear_csv(texto)
check("ida y vuelta sin pérdida",
      [(i["clausula"], i["pregunta"], i["modulo"]) for i in vuelta]
      == [(i["clausula"], i["pregunta"], i["modulo"]) for i in originales], str(vuelta))

# ===========================================================================
print("\n=== 4. La cartera de empresas ===")

t_estudio = crear_tenant("estudio", "Estudio Seco & Asociados", "lider@estudio.com",
                         domicilio=DOMICILIO_ESTUDIO, telefono="261 400-0000",
                         contacto_nombre="Recepción del estudio",
                         contacto_email="hola@estudio.com")
t_rival = crear_tenant("rival", "Otra Consultora", "lider@rival.com")
auditor_id = crear_auditor(t_estudio, "nadia@estudio.com", "Nadia Robledo")

H = token_de("lider@estudio.com")
H_RIVAL = token_de("lider@rival.com")
H_CAMPO = token_de("nadia@estudio.com")

client.get(f"{API}/auditorias/programas", headers=H)        # aprovisiona el schema
client.get(f"{API}/auditorias/programas", headers=H_RIVAL)

r = client.post(f"{API}/auditorias/empresas", headers=H, json={
    "nombre": "Bodega La Esperanza", "identificacion": "30-12345678-9",
    "actividad": "Elaboración de vinos", "domicilio": DOMICILIO_BODEGA,
    "telefono": "261 499-1000", "contacto_nombre": "Ramiro Ponce",
    "contacto_cargo": "Jefe de Planta", "contacto_telefono": "261 555-7777",
    "contacto_email": "rponce@laesperanza.com",
})
check("se crea una empresa en la cartera", r.status_code == 201, f"{r.status_code} {r.text[:150]}")
bodega = r.json()
check("y vuelve con el pin del mapa armado",
      "google.com/maps" in (bodega.get("mapa_url") or ""), str(bodega.get("mapa_url")))

r = client.post(f"{API}/auditorias/empresas", headers=H, json={"nombre": "  bodega la esperanza "})
check("no deja cargar la misma empresa dos veces (ni con otra capitalización)",
      r.status_code == 409, f"{r.status_code} {r.text[:120]}")

r = client.post(f"{API}/auditorias/empresas", headers=H, json={"nombre": "   "})
check("una empresa sin nombre se rechaza", r.status_code == 400, str(r.status_code))

client.post(f"{API}/auditorias/empresas", headers=H, json={
    "nombre": "Frigorífico del Oeste", "actividad": "Faena y despostado",
    "domicilio": "Carril Norte 1500, Maipú, Mendoza"})

r = client.get(f"{API}/auditorias/empresas", headers=H)
check("la cartera lista las empresas ordenadas por nombre",
      [e["nombre"] for e in r.json()] == ["Bodega La Esperanza", "Frigorífico del Oeste"],
      str([e["nombre"] for e in r.json()]))

print("\n=== 5. La cartera de una organización no se ve con el token de otra ===")
check("la otra consultora ve su cartera vacía",
      client.get(f"{API}/auditorias/empresas", headers=H_RIVAL).json() == [])
r = client.patch(f"{API}/auditorias/empresas/{bodega['id']}", headers=H_RIVAL,
                 json={"nombre": "Secuestrada"})
check("y no puede editar una empresa ajena", r.status_code == 404, str(r.status_code))
r = client.delete(f"{API}/auditorias/empresas/{bodega['id']}", headers=H_RIVAL)
check("ni borrarla", r.status_code == 404, str(r.status_code))

# ===========================================================================
print("\n=== 6. La asignación lleva al auditor a la empresa, no al estudio ===")

prog = client.post(f"{API}/auditorias/programas", headers=H, json={
    "titulo": "Programa anual 2026", "objetivos": "Verificar el SGC",
    "alcance": "Elaboración y fraccionamiento", "fecha_inicio": "2026-03-01",
    "fecha_fin": "2026-12-31", "norma": "ISO 9001"}).json()

r = client.post(f"{API}/auditorias/asignaciones", headers=H, json={
    "programa_id": prog["id"], "auditor_id": str(auditor_id), "area": "Línea de fraccionamiento",
    "fecha_programada": "2026-04-10", "hora_inicio": "09:00", "hora_fin": "13:00",
    "empresa_id": bodega["id"]})
check("se crea la asignación apuntando a la empresa", r.status_code == 201,
      f"{r.status_code} {r.text[:200]}")
asig = r.json()

check("«organización» es el CLIENTE, no el estudio",
      asig["organizacion"] == "Bodega La Esperanza", str(asig["organizacion"]))
check("el domicilio es el del cliente",
      asig["direccion"] == DOMICILIO_BODEGA, str(asig["direccion"]))
check("el pin apunta al domicilio del cliente",
      "Lujan" in (asig["mapa_url"] or "").replace("%C3%A1n", "an").replace("%20", " ")
      or "Ruta%2040" in (asig["mapa_url"] or ""), str(asig["mapa_url"]))
check("el referente es el del cliente",
      asig["contacto"]["nombre"] == "Ramiro Ponce"
      and asig["contacto"]["telefono"] == "261 555-7777", str(asig["contacto"]))
check("y queda marcado de dónde salió",
      asig["contacto"]["origen"] == "empresa", str(asig["contacto"]))
check("viaja también a qué se dedica el cliente",
      asig["empresa_actividad"] == "Elaboración de vinos", str(asig.get("empresa_actividad")))

print("\n=== 7. El contacto del estudio NO se usa de respaldo del cliente ===")
# Darle al auditor el teléfono de su propio estudio para entrar a la planta de
# un cliente es peor que no darle ninguno: parece un dato útil y no lo es.
sin_contacto = client.post(f"{API}/auditorias/empresas", headers=H, json={
    "nombre": "Metalúrgica Andina", "domicilio": "Parque Industrial, San Luis"}).json()
r = client.post(f"{API}/auditorias/asignaciones", headers=H, json={
    "programa_id": prog["id"], "auditor_id": str(auditor_id), "area": "Soldadura",
    "fecha_programada": "2026-05-05", "empresa_id": sin_contacto["id"]}).json()
check("sin contacto del cliente, no se hereda el de la organización",
      r["contacto"] is None, str(r["contacto"]))
check("pero el domicilio del cliente sí llega",
      r["direccion"] == "Parque Industrial, San Luis", str(r["direccion"]))

print("\n=== 8. Lo acordado para la visita gana sobre la ficha del cliente ===")
r = client.post(f"{API}/auditorias/asignaciones", headers=H, json={
    "programa_id": prog["id"], "auditor_id": str(auditor_id), "area": "Finca",
    "fecha_programada": "2026-06-01", "empresa_id": bodega["id"],
    "lugar_nombre": "Finca Agrelo", "lugar_direccion": "Calle Cobos s/n, Agrelo",
    "contacto_nombre": "José Barros", "contacto_telefono": "261 300-1111"}).json()
check("el domicilio de la visita pisa al de la ficha",
      r["direccion"] == "Calle Cobos s/n, Agrelo", str(r["direccion"]))
check("el referente de la visita pisa al de la ficha",
      r["contacto"]["nombre"] == "José Barros" and r["contacto"]["origen"] == "asignacion",
      str(r["contacto"]))
check("y no se le pega el teléfono del referente de la ficha",
      r["contacto"]["telefono"] == "261 300-1111", str(r["contacto"]))
check("la empresa sigue siendo la que se audita",
      r["organizacion"] == "Bodega La Esperanza", str(r["organizacion"]))

print("\n=== 9. Las coordenadas viajan con el domicilio al que pertenecen ===")
# Si la visita es en otra sede, pegarle las coordenadas de la casa central
# pondría el pin a kilómetros, y el auditor confiaría en él.
con_coords = client.post(f"{API}/auditorias/empresas", headers=H, json={
    "nombre": "Planta Sur", "domicilio": "Ruta 7 km 20", "lat": -33.1, "lng": -68.5}).json()
r = client.post(f"{API}/auditorias/asignaciones", headers=H, json={
    "programa_id": prog["id"], "auditor_id": str(auditor_id), "area": "Casa central",
    "fecha_programada": "2026-06-10", "empresa_id": con_coords["id"]}).json()
check("sin dirección propia, el pin usa las coordenadas del cliente",
      "query=-33.1,-68.5" in (r["mapa_url"] or ""), str(r["mapa_url"]))

r = client.post(f"{API}/auditorias/asignaciones", headers=H, json={
    "programa_id": prog["id"], "auditor_id": str(auditor_id), "area": "Obra nueva",
    "fecha_programada": "2026-06-20", "empresa_id": con_coords["id"],
    "lugar_direccion": "Obra Ruta 60, Tunuyán"}).json()
check("con dirección propia, NO se le pegan las coordenadas del cliente",
      "-33.1" not in (r["mapa_url"] or ""), str(r["mapa_url"]))
check("...y el pin se arma con la dirección de la visita",
      "Tunuy" in (r["mapa_url"] or "").replace("%C3%A1", "a"), str(r["mapa_url"]))

print("\n=== 10. Heredar no escribe (la fila cruda queda limpia) ===")
# Mismo riesgo que ya tenía el contacto de la organización: si el valor
# heredado se asignara sobre las columnas, el domicilio del cliente quedaría
# guardado dentro de la asignación en el primer flush y después no habría forma
# de distinguir lo acordado de lo heredado.
with Session() as db:
    fila = db.execute(text(
        "SELECT lugar_direccion, contacto_nombre, contacto_telefono "
        "FROM tenant_estudio.auditorias_asignaciones WHERE id = :i"), {"i": asig["id"]}).first()
check("lugar_direccion sigue NULL en la base", fila[0] is None, str(fila[0]))
check("contacto_nombre sigue NULL en la base", fila[1] is None, str(fila[1]))
check("contacto_telefono sigue NULL en la base", fila[2] is None, str(fila[2]))

print("\n=== 11. Lo que ve el auditor de campo y lo que dice el correo ===")
mias = client.get(f"{API}/auditorias/asignaciones/mias", headers=H_CAMPO).json()
check("el auditor ve sus visitas", len(mias) >= 4, str(len(mias)))
una = [a for a in mias if a["id"] == asig["id"]][0]
check("en su listado figura el cliente, no el estudio",
      una["organizacion"] == "Bodega La Esperanza", str(una["organizacion"]))
check("con el domicilio del cliente", una["direccion"] == DOMICILIO_BODEGA, str(una["direccion"]))
check("y con el referente del cliente",
      una["contacto"]["nombre"] == "Ramiro Ponce", str(una["contacto"]))

correo = [e for e in enviados if "nadia@estudio.com" in str(e["to"])]
check("se le envió el correo de asignación", len(correo) >= 1, str(len(correo)))
if correo:
    cuerpo = correo[0]["text"] + correo[0]["html"]
    check("el correo nombra al cliente", "Bodega La Esperanza" in cuerpo)
    check("y lleva el domicilio del cliente", DOMICILIO_BODEGA in cuerpo)
    check("y no manda al domicilio del estudio", DOMICILIO_ESTUDIO not in cuerpo)

print("\n=== 12. No se puede auditar a la empresa de otra organización ===")
r = client.post(f"{API}/auditorias/asignaciones", headers=H_RIVAL, json={
    "programa_id": prog["id"], "auditor_id": str(auditor_id), "area": "X",
    "fecha_programada": "2026-07-01", "empresa_id": bodega["id"]})
check("asignar con el id de una empresa ajena falla", r.status_code in (403, 404),
      f"{r.status_code} {r.text[:120]}")

print("\n=== 13. Borrar vs. desactivar una empresa ===")
r = client.delete(f"{API}/auditorias/empresas/{bodega['id']}", headers=H)
check("no se borra una empresa con auditorías hechas", r.status_code == 409, str(r.status_code))
check("y el mensaje dice qué hacer en su lugar",
      "esactiv" in r.json().get("detail", ""), r.json().get("detail", "")[:120])

r = client.patch(f"{API}/auditorias/empresas/{bodega['id']}", headers=H, json={"activa": False})
check("se puede desactivar", r.status_code == 200 and r.json()["activa"] is False, str(r.status_code))
activas = [e["nombre"] for e in client.get(f"{API}/auditorias/empresas", headers=H).json()]
check("sale del selector", "Bodega La Esperanza" not in activas, str(activas))
todas = [e["nombre"] for e in client.get(
    f"{API}/auditorias/empresas?incluir_inactivas=true", headers=H).json()]
check("pero sigue existiendo", "Bodega La Esperanza" in todas, str(todas))

detalle = client.get(f"{API}/auditorias/asignaciones/{asig['id']}/detalle", headers=H).json()
check("y su auditoría pasada la sigue nombrando",
      detalle["organizacion"] == "Bodega La Esperanza", str(detalle["organizacion"]))

sin_uso = client.post(f"{API}/auditorias/empresas", headers=H,
                      json={"nombre": "Cargada por error"}).json()
r = client.delete(f"{API}/auditorias/empresas/{sin_uso['id']}", headers=H)
check("una empresa sin auditorías sí se borra", r.status_code == 204, str(r.status_code))

print("\n=== 14. El conteo de auditorías por empresa ===")
cartera = client.get(f"{API}/auditorias/empresas?incluir_inactivas=true", headers=H).json()
porc = {e["nombre"]: e["auditorias"] for e in cartera}
check("cada empresa informa cuántas auditorías tiene",
      porc.get("Bodega La Esperanza") == 2, str(porc))
check("y una recién cargada informa cero",
      porc.get("Frigorífico del Oeste") == 0, str(porc))

# ===========================================================================
print("\n=== 15. Plantillas: importar un checklist de cualquier actividad ===")
# El punto de la función: esto no es ISO 9001, es una verificación de una
# cámara de frío, y entra igual.
csv_frio = (
    "clausula;pregunta;modulo;evidencia\n"
    "HACCP 1;¿La cámara registra temperatura cada 2 horas?;Cámara de frío;Planilla de registro\n"
    "HACCP 2;¿El termómetro está calibrado?;Cámara de frío;Certificado\n"
    "BPM 3;¿El personal usa cofia y barbijo?;Sala de despostado;\n"
)
r = client.post(f"{API}/auditorias/plantillas-checklist/importar", headers=H, json={
    "nombre": "Cámara de frío y BPM", "categoria": "Alimentos", "csv": csv_frio})
check("se importa una plantilla desde CSV", r.status_code == 201, f"{r.status_code} {r.text[:200]}")
imp = r.json()
check("informa cuántas preguntas entraron", imp["importadas"] == 3, str(imp["importadas"]))
check("sin problemas en un archivo limpio", imp["problemas"] == [], str(imp["problemas"]))
plantilla = imp["plantilla"]
check("la plantilla queda con sus tres ítems", len(plantilla["items"]) == 3, str(len(plantilla["items"])))
check("conserva el módulo", plantilla["items"][0]["modulo"] == "Cámara de frío", str(plantilla["items"][0]))
check("conserva la evidencia a pedir",
      plantilla["items"][0]["evidencia"] == "Planilla de registro", str(plantilla["items"][0]))

r = client.post(f"{API}/auditorias/plantillas-checklist/importar", headers=H, json={
    "nombre": "Rota", "csv": "pregunta\n¿Una?\n\n"})
check("un archivo con una sola pregunta válida igual entra", r.status_code == 201, str(r.status_code))

r = client.post(f"{API}/auditorias/plantillas-checklist/importar", headers=H, json={
    "nombre": "Sin encabezado", "csv": "nombre;apellido\nJuan;Perez\n"})
check("un archivo ambiguo entra pero avisa cómo se interpretó", r.status_code == 201,
      str(r.status_code))
check("y el aviso llega al que importa",
      any("no trae encabezado" in p for p in r.json()["problemas"]), str(r.json()["problemas"]))

r = client.post(f"{API}/auditorias/plantillas-checklist/importar", headers=H, json={
    "nombre": "Imposible", "csv": "nombre\nJuan\n"})
check("un archivo del que no sale ninguna pregunta se rechaza con 400",
      r.status_code == 400, str(r.status_code))
check("explicando qué falta", "pregunta" in r.json().get("detail", "").lower(),
      r.json().get("detail", "")[:140])

print("\n=== 16. Exportar y volver a importar ===")
r = client.get(f"{API}/auditorias/plantillas-checklist/{plantilla['id']}/exportar", headers=H)
check("la exportación responde un CSV", r.status_code == 200
      and "text/csv" in r.headers.get("content-type", ""), r.headers.get("content-type", ""))
check("como archivo descargable y con nombre",
      "attachment" in r.headers.get("content-disposition", ""),
      r.headers.get("content-disposition", ""))
exportado = r.content.decode("utf-8")
check("con BOM para que Excel respete los acentos", exportado.startswith("﻿"))
check("y con el texto tal cual se cargó", "¿El termómetro está calibrado?" in exportado)

r = client.post(f"{API}/auditorias/plantillas-checklist/importar", headers=H, json={
    "nombre": "Reimportada", "csv": exportado})
check("lo exportado se puede volver a importar", r.status_code == 201, str(r.status_code))
check("con las mismas preguntas", r.json()["importadas"] == 3, str(r.json()["importadas"]))

print("\n=== 17. Editar, duplicar y partir de un catálogo ===")
r = client.put(f"{API}/auditorias/plantillas-checklist/{plantilla['id']}", headers=H, json={
    "nombre": "Cámara de frío (rev. 2)", "categoria": "Alimentos",
    "items": [{"clausula": "HACCP 1", "pregunta": "¿Registra temperatura cada hora?"}]})
check("se puede editar sin borrar y rehacer", r.status_code == 200, f"{r.status_code} {r.text[:150]}")
check("queda el nombre nuevo", r.json()["nombre"] == "Cámara de frío (rev. 2)", str(r.json()["nombre"]))
check("y los ítems nuevos", len(r.json()["items"]) == 1, str(r.json()["items"]))

r = client.put(f"{API}/auditorias/plantillas-checklist/{plantilla['id']}", headers=H, json={
    "nombre": "Vacía", "items": []})
check("no se puede dejar una plantilla sin preguntas", r.status_code == 400, str(r.status_code))

r = client.post(f"{API}/auditorias/plantillas-checklist/{plantilla['id']}/duplicar", headers=H)
check("se puede duplicar para adaptarla", r.status_code == 201, str(r.status_code))
copia = r.json()
check("la copia se distingue por el nombre", "copia" in copia["nombre"], str(copia["nombre"]))
check("y arranca con los mismos ítems", len(copia["items"]) == 1, str(copia["items"]))
client.put(f"{API}/auditorias/plantillas-checklist/{copia['id']}", headers=H, json={
    "nombre": "Derivada", "items": [{"clausula": "X", "pregunta": "¿Otra cosa?"}]})
original = [p for p in client.get(f"{API}/auditorias/plantillas-checklist", headers=H).json()
            if p["id"] == plantilla["id"]][0]
check("editar la copia no toca la original",
      original["items"][0]["pregunta"] == "¿Registra temperatura cada hora?",
      str(original["items"][0]))

r = client.post(f"{API}/auditorias/plantillas-checklist/desde-catalogo", headers=H,
                json={"norma": "ISO 45001", "nombre": "Recorrido SST a medida"})
check("se puede partir de un catálogo de fábrica", r.status_code == 201,
      f"{r.status_code} {r.text[:150]}")
propia = r.json()
check("y la copia es propia y editable", len(propia["items"]) >= 4, str(len(propia["items"])))
r = client.put(f"{API}/auditorias/plantillas-checklist/{propia['id']}", headers=H, json={
    "nombre": "Recorrido SST a medida", "items": propia["items"][:2] + [
        {"clausula": "Propia", "pregunta": "¿Se firmó el permiso de trabajo en altura?"}]})
check("se le pueden agregar preguntas propias al catálogo copiado",
      r.status_code == 200 and len(r.json()["items"]) == 3, str(r.status_code))

r = client.post(f"{API}/auditorias/plantillas-checklist/desde-catalogo", headers=H,
                json={"norma": "ISO 99999"})
check("un catálogo inexistente se rechaza", r.status_code == 400, str(r.status_code))

print("\n=== 18. Las plantillas de una organización no se ven desde otra ===")
ajenas = client.get(f"{API}/auditorias/plantillas-checklist", headers=H_RIVAL).json()
check("la otra consultora no ve las plantillas del estudio", ajenas == [], str(ajenas))
for metodo, ruta in (("get", f"/auditorias/plantillas-checklist/{plantilla['id']}/exportar"),
                     ("post", f"/auditorias/plantillas-checklist/{plantilla['id']}/duplicar")):
    r = getattr(client, metodo)(f"{API}{ruta}", headers=H_RIVAL)
    check(f"ni puede {metodo.upper()} {ruta.split('/')[-1]} de una ajena",
          r.status_code == 404, str(r.status_code))
r = client.put(f"{API}/auditorias/plantillas-checklist/{plantilla['id']}", headers=H_RIVAL,
               json={"nombre": "Robada", "items": [{"clausula": "", "pregunta": "¿?"}]})
check("ni editarla", r.status_code == 404, str(r.status_code))

print("\n=== 19. Aplicar una plantilla propia a una auditoría ===")
r = client.post(
    f"{API}/auditorias/asignaciones/{asig['id']}/aplicar-plantilla/{propia['id']}", headers=H)
check("la plantilla propia se aplica al checklist", r.status_code == 200,
      f"{r.status_code} {r.text[:150]}")
puntos = client.get(f"{API}/auditorias/asignaciones/{asig['id']}/puntos", headers=H_CAMPO).json()
check("y el auditor de campo recibe esas preguntas", len(puntos) == 3, str(len(puntos)))
check("incluida la que se agregó a mano",
      any("permiso de trabajo en altura" in p["pregunta"] for p in puntos),
      str([p["pregunta"] for p in puntos]))

print("\n=== 20. El auditor de campo no administra la cartera ===")
# Es quien ejecuta la visita, no quien decide a qué clientes se audita.
r = client.post(f"{API}/auditorias/empresas", headers=H_CAMPO, json={"nombre": "Propia"})
check("no puede agregar empresas", r.status_code == 403, str(r.status_code))
r = client.get(f"{API}/auditorias/empresas", headers=H_CAMPO)
check("ni listar la cartera", r.status_code == 403, str(r.status_code))
r = client.post(f"{API}/auditorias/plantillas-checklist/importar", headers=H_CAMPO,
                json={"nombre": "X", "csv": "pregunta\n¿A?\n"})
check("ni importar plantillas", r.status_code == 403, str(r.status_code))

print("\n=== 21. El auditor interno (sin cartera) sigue igual que antes ===")
# La regresión que importa: todo lo anterior a esta función audita su propia
# casa, con empresa_id en NULL.
r = client.post(f"{API}/auditorias/asignaciones", headers=H, json={
    "programa_id": prog["id"], "auditor_id": str(auditor_id), "area": "Administración",
    "fecha_programada": "2026-08-01"}).json()
check("sin empresa, la organización es el propio tenant",
      r["organizacion"] == "Estudio Seco & Asociados", str(r["organizacion"]))
check("y el domicilio es el de la ficha de la organización",
      r["direccion"] == DOMICILIO_ESTUDIO, str(r["direccion"]))
check("y el contacto se hereda de la organización",
      r["contacto"]["nombre"] == "Recepción del estudio"
      and r["contacto"]["origen"] == "organizacion", str(r["contacto"]))
check("el booleano viejo sigue diciendo la verdad",
      r["contacto"]["de_la_organizacion"] is True, str(r["contacto"]))

print("\n=== 22. La columna y la tabla existen en el schema del tenant ===")
with ENGINE.begin() as c:
    tabla = c.execute(text(
        "SELECT count(*) FROM information_schema.tables "
        "WHERE table_schema='tenant_estudio' AND table_name='empresas_auditadas'")).scalar()
    columna = c.execute(text(
        "SELECT count(*) FROM information_schema.columns "
        "WHERE table_schema='tenant_estudio' AND table_name='auditorias_asignaciones' "
        "AND column_name='empresa_id'")).scalar()
check("empresas_auditadas vive en el schema del tenant", tabla == 1, str(tabla))
check("auditorias_asignaciones tiene empresa_id", columna == 1, str(columna))

print("\n" + "=" * 62)
if fallos:
    print(f"FALLARON {len(fallos)} comprobaciones:")
    for f in fallos:
        print(f"  - {f}")
    sys.exit(1)
print("Todas las comprobaciones pasaron.")
