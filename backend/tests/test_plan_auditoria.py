"""
Plan de auditoría y checklist completo de ISO 9001.

El plan es el documento que se acuerda con la organización antes de auditar:
código, jornada, criterios y el cronograma de la visita. Nace con el programa.

Lo que se verifica acá: que el plan se emita solo, que el correlativo no se
repita aunque se borre un plan, que un programa viejo (creado antes de que
esto existiera) también obtenga el suyo, que lo que se edita se guarde, que el
plan de una organización no se vea desde otra, y que el checklist de ISO 9001
llegue completo y con la evidencia a solicitar en cada punto.
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
from app.models.auditoria import PlanAuditoria, PuntoControl
from app.core.security import get_password_hash
from app.core.config import settings
from app.data.checklist_templates import get_template, available_normas
from app.data.plan_auditoria import formatear_codigo, cronograma_base
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
    c.execute(text("DROP SCHEMA IF EXISTS tenant_olca CASCADE;"))
    c.execute(text("DROP SCHEMA IF EXISTS tenant_otra CASCADE;"))
Base.metadata.create_all(
    ENGINE, tables=[t for t in Base.metadata.sorted_tables if t.schema == "public"])


def crear_tenant(slug, nombre, email):
    with Session() as db:
        t = Tenant(id=uuid.uuid4(), slug=slug, name=nombre, two_factor_enabled=False)
        db.add(t)
        db.flush()
        u = User(id=uuid.uuid4(), tenant_id=t.id, email=email, full_name="Marisol Seco",
                 role="admin", password_hash=get_password_hash("Secreta123"), active=True)
        db.add(u)
        db.flush()
        db.add(UserTenant(id=uuid.uuid4(), user_id=u.id, tenant_id=t.id, role="admin", active=True))
        db.commit()
        return t.id


def token_de(email):
    client.post(f"{API}/auth/login", json={"email": email, "password": "Secreta123"})
    tok = client.post(f"{API}/auth/verify-2fa",
                      json={"email": email, "code": "BYPASS"}).json()["access_token"]
    return {"Authorization": f"Bearer {tok}"}


crear_tenant("olca", "OLCA S.A.", "calidad@olca.com")
crear_tenant("otra", "Otra Empresa S.A.", "calidad@otra.com")
H = token_de("calidad@olca.com")
H2 = token_de("calidad@otra.com")
client.get(f"{API}/auditorias/programas", headers=H)    # aprovisiona el schema
client.get(f"{API}/auditorias/programas", headers=H2)


def crear_programa(headers, titulo, norma="ISO 9001", inicio="2026-10-07"):
    return client.post(f"{API}/auditorias/programas", headers=headers, json={
        "titulo": titulo,
        "objetivos": "Verificar la conformidad del SGC.",
        "alcance": "Servicio de alquiler de vehículos livianos, pesados y máquinas viales.",
        "fecha_inicio": inicio, "fecha_fin": inicio, "estado": "planificado",
        "norma": norma,
    })


print("\n=== 1. Crear el programa emite el plan ===")
r = crear_programa(H, "Auditoría Interna de Calidad 2026")
check("POST /programas responde 201", r.status_code == 201, f"{r.status_code} {r.text[:200]}")
prog = r.json() if r.status_code == 201 else {}
prog_id = prog.get("id")
check("el programa guarda la norma", prog.get("norma") == "ISO 9001", str(prog.get("norma")))

r = client.get(f"{API}/auditorias/programas/{prog_id}/plan", headers=H)
check("GET del plan responde 200", r.status_code == 200, f"{r.status_code} {r.text[:200]}")
plan = r.json() if r.status_code == 200 else {}
check("ya existe sin haber pedido nada mas", bool(plan.get("id")), str(plan)[:120])
check("trae codigo correlativo del año", plan.get("codigo") == "PL-AUD-2026-01", str(plan.get("codigo")))
check("revision inicial 01", plan.get("revision") == "01", str(plan.get("revision")))

print("\n=== 2. El plan trae lo que el documento necesita ===")
check("organizacion tomada del tenant", plan.get("organizacion") == "OLCA S.A.", str(plan.get("organizacion")))
check("auditor lider = quien lo creo", plan.get("auditor_lider") == "Marisol Seco", str(plan.get("auditor_lider")))
check("norma con año de edicion", plan.get("norma") == "ISO 9001:2015", str(plan.get("norma")))
check("fecha de auditoria tomada del programa", plan.get("fecha_auditoria") == "2026-10-07", str(plan.get("fecha_auditoria")))
check("jornada cargada", bool(plan.get("jornada")), str(plan.get("jornada")))
check("alcance heredado del programa", "alquiler de vehículos" in (plan.get("alcance") or ""), str(plan.get("alcance"))[:80])
check("objetivo nombra la organizacion y la norma",
      "OLCA S.A." in (plan.get("objetivo") or "") and "ISO 9001:2015" in (plan.get("objetivo") or ""),
      str(plan.get("objetivo"))[:140])
check("criterios citan ISO 19011", "19011" in (plan.get("criterios") or ""), str(plan.get("criterios"))[:140])
check("trae el titulo del programa", plan.get("programa_titulo") == "Auditoría Interna de Calidad 2026",
      str(plan.get("programa_titulo")))

print("\n=== 3. El cronograma viene cargado, no vacio ===")
crono = plan.get("cronograma") or []
check("tiene las 8 franjas de la jornada ISO 9001", len(crono) == 8, str(len(crono)))
check("abre con la Reunion de Apertura",
      crono and crono[0]["actividad"] == "Reunión de Apertura", str(crono[:1])[:120])
check("cierra con la Reunion de Cierre",
      crono and crono[-1]["actividad"] == "Reunión de Cierre", str(crono[-1:])[:120])
check("cada franja tiene horario, requisitos y responsables",
      all(f.get("desde") and f.get("hasta") and f.get("requisitos") and f.get("responsables") for f in crono),
      str([f for f in crono if not f.get("requisitos")])[:160])

print("\n=== 4. El correlativo no se repite aunque se borre un plan ===")
r2 = crear_programa(H, "Auditoría de seguimiento 2026")
plan2 = client.get(f"{API}/auditorias/programas/{r2.json()['id']}/plan", headers=H).json()
check("el segundo plan es el -02", plan2.get("codigo") == "PL-AUD-2026-02", str(plan2.get("codigo")))

client.delete(f"{API}/auditorias/programas/{r2.json()['id']}", headers=H)  # borra programa y plan
r3 = crear_programa(H, "Auditoría de cierre 2026")
plan3 = client.get(f"{API}/auditorias/programas/{r3.json()['id']}/plan", headers=H).json()
check("tras borrar el -02, el siguiente es -03 y no reusa el numero entregado",
      plan3.get("codigo") == "PL-AUD-2026-03", str(plan3.get("codigo")))

print("\n=== 5. Un programa viejo (sin plan) obtiene el suyo al pedirlo ===")
r = crear_programa(H, "Programa anterior a esta funcion", inicio="2025-05-20")
viejo_id = r.json()["id"]
from app.db.session import get_tenant_db
tdb = next(get_tenant_db("olca"))
tdb.query(PlanAuditoria).filter(PlanAuditoria.programa_id == uuid.UUID(viejo_id)).delete()
tdb.commit()
restante = tdb.query(PlanAuditoria).filter(PlanAuditoria.programa_id == uuid.UUID(viejo_id)).count()
tdb.close()
check("se simulo un programa sin plan", restante == 0, str(restante))

r = client.get(f"{API}/auditorias/programas/{viejo_id}/plan", headers=H)
check("pedirlo lo emite en el momento", r.status_code == 200, f"{r.status_code} {r.text[:160]}")
check("y lo numera con el año de ESE programa",
      (r.json().get("codigo") or "").startswith("PL-AUD-2025-"), str(r.json().get("codigo")))

print("\n=== 6. Lo que se edita se guarda ===")
r = client.put(f"{API}/auditorias/programas/{prog_id}/plan", headers=H, json={
    "ente_certificador": "Bureau Veritas Certification",
    "coordinador_sgc": "Alejandro Zur (Resp. SGC)",
    "lugar_sede": "Ruta Nac. N° 7 km 1006, Palmira, Mendoza",
    "jornada": "09:00 a 13:00 hs",
    "cronograma": [
        {"desde": "09:00", "hasta": "09:30", "actividad": "Reunión de Apertura",
         "detalle": "Presentación del plan.", "requisitos": "ISO 19011 (6.4.3)",
         "responsables": "Directorio"},
    ],
})
check("PUT responde 200", r.status_code == 200, f"{r.status_code} {r.text[:200]}")
guardado = r.json() if r.status_code == 200 else {}
check("guarda el ente certificador", guardado.get("ente_certificador") == "Bureau Veritas Certification",
      str(guardado.get("ente_certificador")))
check("guarda el coordinador del cliente", guardado.get("coordinador_sgc") == "Alejandro Zur (Resp. SGC)",
      str(guardado.get("coordinador_sgc")))
check("reemplaza el cronograma por el editado", len(guardado.get("cronograma") or []) == 1,
      str(len(guardado.get("cronograma") or [])))
check("el codigo NO se puede cambiar desde el PUT", guardado.get("codigo") == "PL-AUD-2026-01",
      str(guardado.get("codigo")))

releido = client.get(f"{API}/auditorias/programas/{prog_id}/plan", headers=H).json()
check("y persiste al releer", releido.get("lugar_sede") == "Ruta Nac. N° 7 km 1006, Palmira, Mendoza",
      str(releido.get("lugar_sede")))

print("\n=== 7. El plan de una organizacion no se ve desde otra ===")
r = client.get(f"{API}/auditorias/programas/{prog_id}/plan", headers=H2)
check("GET con el token de otro tenant da 404", r.status_code == 404, f"{r.status_code} {r.text[:160]}")
r = client.put(f"{API}/auditorias/programas/{prog_id}/plan", headers=H2, json={"jornada": "pisado"})
check("PUT con el token de otro tenant da 404", r.status_code == 404, f"{r.status_code} {r.text[:160]}")
sigue = client.get(f"{API}/auditorias/programas/{prog_id}/plan", headers=H).json()
check("y el plan original quedo intacto", sigue.get("jornada") == "09:00 a 13:00 hs", str(sigue.get("jornada")))

print("\n=== 8. Checklist completo de ISO 9001 ===")
check("la plantilla figura entre las disponibles",
      "ISO 9001 (completo)" in available_normas(), str(available_normas()))
completo = get_template("ISO 9001 (completo)")
check("tiene los 27 puntos del checklist", len(completo) == 27, str(len(completo)))
check("cubre los 6 modulos de la jornada", len({p["modulo"] for p in completo}) == 6,
      str(sorted({p["modulo"] for p in completo})))
check("TODOS los puntos dicen que evidencia pedir",
      all((p.get("evidencia") or "").strip() for p in completo),
      str([p["clausula"] for p in completo if not p.get("evidencia")]))
check("la plantilla corta de ISO 9001 sigue existiendo aparte",
      len(get_template("ISO 9001")) == 5, str(len(get_template("ISO 9001"))))

print("\n=== 9. Aplicado a una asignacion llega completo a la base ===")
with Session() as db:
    auditor = db.query(User).filter(User.email == "calidad@olca.com").first()
    auditor_id = str(auditor.id)

r = client.post(f"{API}/auditorias/asignaciones", headers=H, json={
    "programa_id": prog_id, "auditor_id": auditor_id,
    "area": "Dirección y Procesos", "fecha_programada": "2026-10-07",
})
check("se creo la asignacion", r.status_code == 201, f"{r.status_code} {r.text[:200]}")
asig_id = r.json().get("id") if r.status_code == 201 else None

r = client.post(f"{API}/auditorias/asignaciones/{asig_id}/plantilla", headers=H,
                json={"norma": "ISO 9001 (completo)", "reemplazar": True})
check("aplicar la plantilla responde 200", r.status_code == 200, f"{r.status_code} {r.text[:200]}")
puntos = r.json() if r.status_code == 200 else []
check("genero los 27 puntos", len(puntos) == 27, str(len(puntos)))
check("cada punto trae su modulo", all(p.get("modulo") for p in puntos),
      str([p["clausula"] for p in puntos if not p.get("modulo")])[:160])
check("cada punto trae la evidencia a solicitar",
      all(p.get("evidencia_solicitada") for p in puntos),
      str([p["clausula"] for p in puntos if not p.get("evidencia_solicitada")])[:160])

tdb = next(get_tenant_db("olca"))
fila = tdb.query(PuntoControl).filter(
    PuntoControl.asignacion_id == uuid.UUID(asig_id),
    PuntoControl.clausula == "ISO 9001 7.1.5").first()
check("se persistio en la base, no solo en la respuesta",
      fila is not None and "calibración" in (fila.evidencia_solicitada or ""),
      str(fila.evidencia_solicitada if fila else None))
tdb.close()

print("\n=== 10. Una norma sin cronograma propio usa el generico ===")
r = crear_programa(H, "Auditoría ambiental 2026", norma="ISO 14001")
plan14 = client.get(f"{API}/auditorias/programas/{r.json()['id']}/plan", headers=H).json()
check("cronograma generico de 4 bloques", len(plan14.get("cronograma") or []) == 4,
      str(len(plan14.get("cronograma") or [])))
check("criterios propios de ISO 14001", "14001" in (plan14.get("criterios") or ""),
      str(plan14.get("criterios"))[:120])
check("no se inventa una jornada detallada de 14001",
      cronograma_base("ISO 14001") != cronograma_base("ISO 9001"))

print("\n=== 11. El contador de codigos solo sube ===")
check("formato del codigo", formatear_codigo(2026, 7) == "PL-AUD-2026-07", formatear_codigo(2026, 7))
tdb = next(get_tenant_db("olca"))
fila = tdb.execute(text(
    "SELECT ultimo FROM planes_auditoria_correlativo WHERE anio = 2026")).scalar()
tdb.close()
check("el contador de 2026 quedo por encima de los planes vivos", (fila or 0) >= 4, str(fila))

vivos = client.get(f"{API}/auditorias/programas", headers=H).json()
codigos = []
for pr in vivos:
    rp = client.get(f"{API}/auditorias/programas/{pr['id']}/plan", headers=H)
    if rp.status_code == 200:
        codigos.append(rp.json()["codigo"])
check("ningun codigo emitido se repite", len(codigos) == len(set(codigos)), str(sorted(codigos)))

print("\n" + "=" * 62)
if fallos:
    print(f"FALLARON {len(fallos)}: " + "; ".join(fallos))
    sys.exit(1)
print("TODAS LAS COMPROBACIONES PASARON")
