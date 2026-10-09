"""
Lo que el auditor ve en planta, convertido en hallazgos del informe.

Antes, el checklist de campo contestaba conforme / no conforme / N-A y **todo
lo que volvía marcado «no conforme» entraba como No Conformidad**. Un informe
de auditoría no se escribe así: distingue la no conformidad mayor de la menor,
y separa a las dos de la observación y de la oportunidad de mejora, que no son
incumplimientos y no deberían abrir una acción correctiva. Además, la planilla
de **Hallazgos / Desvíos** se cargaba a mano, repitiendo lo que el auditor ya
había cargado en el celular.

Lo que se verifica acá es sobre todo que el reflejo sea **fiel y reversible**:

- que una respuesta de campo cree la fila en Hallazgos / Desvíos sola, con su
  cláusula, su calificación y el programa correcto;
- que **solo los incumplimientos** abran No Conformidad: una oportunidad de
  mejora que dispara una acción correctiva infla el tablero con cosas que no
  lo son;
- que corregir la respuesta **deshaga** lo que generó —el auditor que se
  equivoca de botón no puede dejar atrás un desvío fantasma—;
- pero que no pise el trabajo de otro: un hallazgo que alguien ya pasó a
  tratamiento, o una no conformidad con análisis de causa cargado, sobreviven;
- y que una respuesta anterior a esta función siga significando lo mismo, es
  decir, no conformidad menor.

También cubre el identificador de la organización (`app/core/slug.py`) y el
nombre del bucket (`app/services/s3.py`), que es por donde se cayó la firma en
producción: un slug que termina en guion o que se pasa de largo produce un
nombre de bucket que S3 rechaza, y el error no menciona de dónde salió.

Necesita un Postgres real.

    export TEST_DATABASE_URL="postgresql+psycopg2://usuario:clave@localhost:5432/basedeprueba"
    python tests/test_hallazgos_campo.py

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
from app.core.slug import generar_slug, slug_disponible
from app.services import notifications
from app.services.s3 import nombre_de_bucket, _BUCKET_VALIDO
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


notifications._send = lambda to, subject, text_body, html_body: True


# ===========================================================================
print("\n=== 1. Identificador de la organización (sin base) ===")
# El slug no es decorativo: con él se arma el schema de Postgres y el bucket de
# archivos. Lo que acá salga mal no se nota en el alta, sino cuando el cliente
# sube su primer archivo.
check("espacios y mayúsculas", generar_slug("Bodega La Esperanza") == "bodega-la-esperanza",
      generar_slug("Bodega La Esperanza"))
check("las tildes se transliteran, no se borran",
      generar_slug("Viñedos del Sol") == "vinedos-del-sol", generar_slug("Viñedos del Sol"))
check("no queda guion al final (es lo que invalida el bucket)",
      generar_slug("Acme S.A.") == "acme-s-a", generar_slug("Acme S.A."))
check("ni guion al principio", not generar_slug("  -Acme").startswith("-"), generar_slug("  -Acme"))
check("ni guiones repetidos", "--" not in generar_slug("Olca   --  SA"), generar_slug("Olca   --  SA"))
largo = generar_slug("Consultora Integral de Sistemas de Gestion Ambiental del Oeste Argentino SA")
check("un nombre largo se recorta a un largo utilizable", len(largo) <= 48, f"{len(largo)}: {largo}")
check("...y el recorte no deja guion colgando", not largo.endswith("-"), largo)
check("un nombre sin letras ni números no inventa nada", generar_slug("!!! ???") == "",
      repr(generar_slug("!!! ???")))

tomados = {"acme", "acme-2"}
check("el desempate sigue más allá del segundo homónimo",
      slug_disponible("acme", lambda s: s in tomados) == "acme-3",
      slug_disponible("acme", lambda s: s in tomados))
try:
    slug_disponible("", lambda s: False)
    check("un nombre vacío se rechaza en vez de guardarse", False, "no levantó")
except ValueError:
    check("un nombre vacío se rechaza en vez de guardarse", True)

print("\n=== 2. Nombre del bucket de archivos ===")
# Es donde se cayó la firma: upload_file devolvía False sin decir por qué.
check("el nombre natural no cambia (si cambiara, los archivos ya subidos se perderían)",
      nombre_de_bucket("bodega-la-esperanza") == "tenant-bodega-la-esperanza",
      nombre_de_bucket("bodega-la-esperanza"))
check("un slug con guion al final no produce un bucket inválido",
      _BUCKET_VALIDO.match(nombre_de_bucket("acme-")) is not None,
      nombre_de_bucket("acme-"))
muy_largo = "a" * 70
check("un slug larguísimo entra en el límite de 63 caracteres",
      len(nombre_de_bucket(muy_largo)) <= 63, f"{len(nombre_de_bucket(muy_largo))}")
check("...y sigue siendo un nombre válido",
      _BUCKET_VALIDO.match(nombre_de_bucket(muy_largo)) is not None, nombre_de_bucket(muy_largo))
check("dos slugs largos distintos no colapsan en el mismo bucket",
      nombre_de_bucket("a" * 70) != nombre_de_bucket("a" * 69 + "b"),
      nombre_de_bucket("a" * 70))
check("un slug con mayúsculas o barras no rompe el nombre",
      _BUCKET_VALIDO.match(nombre_de_bucket("Acme/SA_1")) is not None,
      nombre_de_bucket("Acme/SA_1"))


# ===========================================================================
with ENGINE.begin() as c:
    c.execute(text("DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;"))
    c.execute(text("DROP SCHEMA IF EXISTS tenant_campo CASCADE;"))
Base.metadata.create_all(
    ENGINE, tables=[t for t in Base.metadata.sorted_tables if t.schema == "public"])

CLAVE = "Secreta123"

with Session() as db:
    t = Tenant(id=uuid.uuid4(), slug="campo", name="Estudio Campo", two_factor_enabled=False)
    db.add(t); db.flush()
    TENANT_ID = t.id
    admin = User(id=uuid.uuid4(), tenant_id=t.id, email="lider@campo.com.ar", full_name="Ana Líder",
                 role="admin", password_hash=get_password_hash(CLAVE), active=True)
    auditor = User(id=uuid.uuid4(), tenant_id=t.id, email="auditor@campo.com.ar",
                   full_name="Beto Campo", role="auditor",
                   password_hash=get_password_hash(CLAVE), active=True)
    db.add_all([admin, auditor]); db.flush()
    AUDITOR_ID = auditor.id
    for u in (admin, auditor):
        db.add(UserTenant(id=uuid.uuid4(), user_id=u.id, tenant_id=t.id, role=u.role, active=True))
    db.commit()


def token_de(email):
    client.post(f"{API}/auth/login", json={"email": email, "password": CLAVE})
    tok = client.post(f"{API}/auth/verify-2fa",
                      json={"email": email, "code": "BYPASS"}).json()["access_token"]
    return {"Authorization": f"Bearer {tok}"}


H = token_de("lider@campo.com.ar")
H_CAMPO = token_de("auditor@campo.com.ar")

client.get(f"{API}/auditorias/programas", headers=H)   # aprovisiona el schema

prog = client.post(f"{API}/auditorias/programas", headers=H, json={
    "titulo": "Programa 2026", "objetivos": "Verificar SST", "alcance": "Planta",
    "fecha_inicio": "2026-03-01", "fecha_fin": "2026-03-31"}).json()

asig = client.post(f"{API}/auditorias/asignaciones", headers=H, json={
    "programa_id": prog["id"], "auditor_id": str(AUDITOR_ID), "area": "Depósito",
    "fecha_programada": "2026-03-10"}).json()


def nuevo_punto(clausula, pregunta):
    return client.post(f"{API}/auditorias/asignaciones/{asig['id']}/puntos", headers=H,
                       json={"clausula": clausula, "pregunta": pregunta}).json()


def responder(punto, resultado, clasificacion=None, nota=None):
    cuerpo = {"resultado": resultado, "nota": nota}
    if clasificacion is not None:
        cuerpo["clasificacion"] = clasificacion
    return client.put(f"{API}/auditorias/puntos/{punto['id']}/respuesta",
                      headers=H_CAMPO, json=cuerpo)


def hallazgos():
    return client.get(f"{API}/auditorias/hallazgos", headers=H).json()


def no_conformidades():
    return client.get(f"{API}/iso9001/non-conformities", headers=H).json()


print("\n=== 3. Un «no conforme» llega solo a Hallazgos / Desvíos ===")
p1 = nuevo_punto("ISO 45001 8.1.3", "¿Los extintores están señalizados y vigentes?")
r = responder(p1, "no_conforme", "no_conformidad_mayor", "Faltan etiquetas actualizadas")
check("la respuesta se acepta", r.status_code == 200, f"{r.status_code} {r.text[:200]}")
resp1 = r.json()
check("queda calificada como no conformidad mayor",
      resp1["clasificacion"] == "no_conformidad_mayor", str(resp1.get("clasificacion")))
check("y con una fila de hallazgo vinculada", resp1.get("hallazgo_id") is not None, str(resp1))

lista = hallazgos()
check("aparece en Hallazgos / Desvíos sin que nadie la cargue", len(lista) == 1, str(len(lista)))
h = lista[0]
check("con la calificación que eligió el auditor",
      h["clasificacion"] == "no_conformidad_mayor", h["clasificacion"])
check("con la cláusula del punto de control",
      h["clausula_referencia"] == "ISO 45001 8.1.3", h["clausula_referencia"])
check("colgando del programa de la auditoría", h["programa_id"] == prog["id"], h["programa_id"])
check("marcada como venida del campo", h["origen"] == "campo", str(h.get("origen")))
check("con el sector auditado a la vista", h.get("area") == "Depósito", str(h.get("area")))
check("y con el auditor que la levantó",
      (h.get("auditor_nombre") or "") == "Beto Campo", str(h.get("auditor_nombre")))
check("la observación del auditor viaja al texto del hallazgo",
      "Faltan etiquetas actualizadas" in h["descripcion"], h["descripcion"][:120])

print("\n=== 4. Solo los incumplimientos abren No Conformidad ===")
check("una NC mayor sí abre su tratamiento", resp1.get("nc_id") is not None, str(resp1))

p2 = nuevo_punto("ISO 9001 7.1.3", "¿El sector está ordenado?")
resp2 = responder(p2, "conforme", "oportunidad", "Convendría señalizar los pasillos").json()
check("una oportunidad de mejora se registra como hallazgo",
      resp2.get("hallazgo_id") is not None, str(resp2))
check("...pero NO abre una acción correctiva", resp2.get("nc_id") is None, str(resp2.get("nc_id")))

p3 = nuevo_punto("ISO 9001 8.5.1", "¿Hay instructivo en el puesto?")
resp3 = responder(p3, "conforme", "observacion", "El instructivo está en la oficina").json()
check("una observación tampoco abre no conformidad", resp3.get("nc_id") is None, str(resp3))
check("pero sí figura en el informe", resp3.get("hallazgo_id") is not None, str(resp3))

check("en total hay tres hallazgos", len(hallazgos()) == 3, str(len(hallazgos())))
check("y una sola no conformidad", len(no_conformidades()) == 1, str(len(no_conformidades())))

print("\n=== 5. Un punto conforme y sin nada que decir no ensucia el informe ===")
p4 = nuevo_punto("ISO 9001 7.5", "¿La documentación está vigente?")
resp4 = responder(p4, "conforme").json()
check("no genera hallazgo", resp4.get("hallazgo_id") is None, str(resp4))
check("ni no conformidad", resp4.get("nc_id") is None, str(resp4))
check("el informe sigue con tres hallazgos", len(hallazgos()) == 3, str(len(hallazgos())))

print("\n=== 6. Sin calificar, un «no conforme» vale lo que valía antes ===")
# Es lo que hace que las respuestas ya cargadas y las versiones viejas de la
# app móvil sigan significando lo mismo después de actualizar.
p5 = nuevo_punto("ISO 9001 9.2", "¿Se hizo la auditoría previa?")
resp5 = responder(p5, "no_conforme", None, "No hay registro").json()
check("se interpreta como no conformidad menor",
      resp5.get("nc_id") is not None and resp5.get("hallazgo_id") is not None, str(resp5))
h5 = [x for x in hallazgos() if x["id"] == resp5["hallazgo_id"]][0]
check("y así queda clasificada en el informe",
      h5["clasificacion"] == "no_conformidad_menor", h5["clasificacion"])

print("\n=== 7. Corregir la respuesta deshace lo que generó ===")
# El auditor que toca el botón equivocado no puede dejar atrás un desvío
# fantasma que después alguien tenga que explicar.
antes = len(hallazgos())
responder(p5, "conforme", None)
despues = hallazgos()
check("el hallazgo desaparece al corregir a conforme", len(despues) == antes - 1,
      f"{antes} -> {len(despues)}")
check("y la no conformidad virgen también se cierra sola",
      len(no_conformidades()) == 1, str(len(no_conformidades())))
resp5b = client.get(f"{API}/auditorias/asignaciones/{asig['id']}/puntos",
                    headers=H_CAMPO).json()
punto5 = [p for p in resp5b if p["id"] == p5["id"]][0]
check("la respuesta queda sin vínculos colgados",
      punto5["respuesta"]["hallazgo_id"] is None and punto5["respuesta"]["nc_id"] is None,
      str(punto5["respuesta"]))

print("\n=== 8. Cambiar de calificación reescribe, no duplica ===")
antes = len(hallazgos())
responder(p1, "no_conforme", "no_conformidad_menor", "Faltan etiquetas actualizadas")
check("sigue habiendo un solo hallazgo para ese punto", len(hallazgos()) == antes,
      f"{antes} -> {len(hallazgos())}")
h1 = [x for x in hallazgos() if x["clausula_referencia"] == "ISO 45001 8.1.3"][0]
check("con la calificación nueva", h1["clasificacion"] == "no_conformidad_menor",
      h1["clasificacion"])

print("\n=== 9. No se puede calificar una no conformidad sobre un punto conforme ===")
p6 = nuevo_punto("ISO 9001 6.1", "¿Están evaluados los riesgos?")
r = responder(p6, "conforme", "no_conformidad_mayor")
check("se rechaza con 400", r.status_code == 400, f"{r.status_code} {r.text[:160]}")
r = responder(p6, "no_conforme", "inventada")
check("una calificación inexistente también se rechaza", r.status_code == 400,
      f"{r.status_code} {r.text[:160]}")

print("\n=== 10. El trabajo de otro no se pisa ni se borra ===")
# Si alguien ya movió el hallazgo a tratamiento, corregir la respuesta no puede
# hacerlo desaparecer: alguien está trabajando sobre él.
with Session() as db:
    db.execute(text("UPDATE tenant_campo.auditorias_hallazgos SET estado = 'en_tratamiento' "
                    "WHERE id = :i"), {"i": h1["id"]})
    db.commit()
responder(p1, "conforme", None)
vivos = [x["id"] for x in hallazgos()]
check("un hallazgo en tratamiento sobrevive a la corrección", h1["id"] in vivos, str(vivos))

# Lo mismo del lado de la no conformidad: con análisis de causa cargado, no se
# borra aunque la respuesta deje de ser un incumplimiento.
p7 = nuevo_punto("ISO 9001 10.2", "¿Se trataron las no conformidades previas?")
resp7 = responder(p7, "no_conforme", "no_conformidad_menor", "Dos sin cerrar").json()
with Session() as db:
    db.execute(text("UPDATE tenant_campo.non_conformities SET five_whys = :v WHERE id = :i"),
               {"v": '["falta de seguimiento"]', "i": resp7["nc_id"]})
    db.commit()
responder(p7, "conforme", None)
ids_nc = [x["id"] for x in no_conformidades()]
check("una no conformidad con análisis de causa no se borra",
      resp7["nc_id"] in ids_nc, str(ids_nc))

print("\n=== 11. Un hallazgo de campo no se borra desde la consola ===")
p8 = nuevo_punto("ISO 45001 6.1.2", "¿Está el mapa de riesgos a la vista?")
resp8 = responder(p8, "no_conforme", "no_conformidad_mayor", "No está publicado").json()
r = client.delete(f"{API}/auditorias/hallazgos/{resp8['hallazgo_id']}", headers=H)
check("se rechaza con 409", r.status_code == 409, f"{r.status_code} {r.text[:160]}")
check("y el mensaje dice dónde corregirlo",
      "punto de control" in r.json().get("detail", ""), r.text[:200])
check("el hallazgo sigue ahí",
      resp8["hallazgo_id"] in [x["id"] for x in hallazgos()], "")

manual = client.post(f"{API}/auditorias/hallazgos", headers=H, json={
    "descripcion": "Cargado a mano en la consola", "clasificacion": "observacion",
    "clausula_referencia": "ISO 9001 4.1", "programa_id": prog["id"]}).json()
check("el cargado a mano no se marca como de campo", manual.get("origen") is None,
      str(manual.get("origen")))
r = client.delete(f"{API}/auditorias/hallazgos/{manual['id']}", headers=H)
check("...y ese sí se puede borrar", r.status_code == 204, str(r.status_code))

print("\n=== 12. El informe de la visita los muestra a todos ===")
rep = client.get(f"{API}/auditorias/asignaciones/{asig['id']}/reporte", headers=H_CAMPO).json()
clasifs = sorted({h["clasificacion"] for h in rep["hallazgos"]})
check("el reporte trae los hallazgos calificados", len(rep["hallazgos"]) >= 3, str(len(rep["hallazgos"])))
check("incluye observación y oportunidad, que antes no aparecían en ningún lado",
      "observacion" in clasifs and "oportunidad" in clasifs, str(clasifs))
check("cada uno con su etiqueta legible",
      all(h["clasificacion_label"] for h in rep["hallazgos"]), str(rep["hallazgos"][:1]))
check("y «no_conformidades» sigue trayendo solo las que abrieron acción correctiva",
      all(n["nc_id"] for n in rep["no_conformidades"])
      and len(rep["no_conformidades"]) < len(rep["hallazgos"]),
      f"{len(rep['no_conformidades'])} de {len(rep['hallazgos'])}")

print("\n=== 13. Las columnas existen en el schema del tenant ===")
with Session() as db:
    cols = {r[0] for r in db.execute(text(
        "SELECT column_name FROM information_schema.columns "
        "WHERE table_schema = 'tenant_campo' AND table_name = 'respuestas_control'"))}
    check("respuestas_control.clasificacion", "clasificacion" in cols, str(sorted(cols)))
    check("respuestas_control.hallazgo_id", "hallazgo_id" in cols, str(sorted(cols)))
    cols = {r[0] for r in db.execute(text(
        "SELECT column_name FROM information_schema.columns "
        "WHERE table_schema = 'tenant_campo' AND table_name = 'auditorias_hallazgos'"))}
    check("auditorias_hallazgos.origen", "origen" in cols, str(sorted(cols)))
    check("auditorias_hallazgos.asignacion_id", "asignacion_id" in cols, str(sorted(cols)))

print("\n" + "=" * 62)
if fallos:
    print(f"{len(fallos)} comprobaciones FALLARON:")
    for f in fallos:
        print(f"  - {f}")
    sys.exit(1)
print("Todas las comprobaciones pasaron.")
