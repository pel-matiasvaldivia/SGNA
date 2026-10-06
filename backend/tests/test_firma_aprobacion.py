"""
Traza de auditoría de las aprobaciones de documentos.

Antes la pantalla de aprobaciones mostraba un "Acta de Firma Electrónica
Regulada" con un hash hecho con Math.random() y una IP fija escrita a mano. El
servidor sí registraba la traza real, pero no la devolvía. Estas pruebas
cubren que lo que se muestra sea lo registrado, y que la huella se pueda
recalcular: un hash que nadie puede volver a computar no prueba nada.
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
from app.models.document import Document, DocumentApproval
from app.core.security import get_password_hash
from app.core.config import settings
from app.services.firma_aprobacion import huella_aprobacion
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
    c.execute(text("DROP SCHEMA IF EXISTS tenant_acme CASCADE;"))
Base.metadata.create_all(
    ENGINE, tables=[t for t in Base.metadata.sorted_tables if t.schema == "public"])

with Session() as db:
    t = Tenant(id=uuid.uuid4(), slug="acme", name="ACME", two_factor_enabled=False)
    db.add(t)
    db.flush()
    u = User(id=uuid.uuid4(), tenant_id=t.id, email="calidad@acme.com", full_name="Calidad",
             role="admin", password_hash=get_password_hash("Secreta123"), active=True)
    db.add(u)
    db.flush()
    db.add(UserTenant(id=uuid.uuid4(), user_id=u.id, tenant_id=t.id, role="admin", active=True))
    db.commit()
    tenant_id = t.id

client.post(f"{API}/auth/login", json={"email": "calidad@acme.com", "password": "Secreta123"})
tok = client.post(f"{API}/auth/verify-2fa",
                  json={"email": "calidad@acme.com", "code": "BYPASS"}).json()["access_token"]
H = {"Authorization": f"Bearer {tok}"}

# El schema del tenant se aprovisiona en la primera request autenticada.
client.get(f"{API}/documents/", headers=H)

from app.db.session import get_tenant_db
tdb = next(get_tenant_db("acme"))
doc = Document(id=uuid.uuid4(), title="Manual de Calidad", type="manual",
               status="pendiente", version_actual=3, tenant_id=tenant_id)
tdb.add(doc)
tdb.commit()
doc_id = doc.id
tdb.close()

print("\n=== 1. La aprobacion devuelve la traza real ===")
r = client.post(f"{API}/documents/{doc_id}/sign", headers=H,
                json={"approve": True, "comments": "Revisado"})
check("POST /sign responde 200", r.status_code == 200, f"{r.status_code} {r.text[:200]}")
cuerpo = r.json() if r.status_code == 200 else {}
aprobs = [a for a in cuerpo.get("approvals", []) if a.get("fecha_resolucion")]
check("la respuesta incluye la aprobacion resuelta", len(aprobs) == 1, str(cuerpo.get("approvals")))

ap = aprobs[0] if aprobs else {}
check("trae signature_hash", bool(ap.get("signature_hash")), str(ap.get("signature_hash")))
check("trae ip_address", bool(ap.get("ip_address")), str(ap.get("ip_address")))
check("trae user_agent", bool(ap.get("user_agent")), str(ap.get("user_agent")))
check("trae la version firmada", ap.get("document_version") == 3, str(ap.get("document_version")))
check("el hash tiene forma de SHA-256",
      isinstance(ap.get("signature_hash"), str) and len(ap["signature_hash"]) == 64,
      str(ap.get("signature_hash")))

print("\n=== 2. Nada quedo inventado ===")
check("la IP NO es la que estaba escrita a mano en el front",
      ap.get("ip_address") != "192.168.16.7", str(ap.get("ip_address")))
check("el hash NO empieza con el prefijo del mock",
      not str(ap.get("signature_hash", "")).startswith("7f8c9b"), str(ap.get("signature_hash")))

print("\n=== 3. La huella se puede recalcular (si no, no prueba nada) ===")
with Session() as db:
    pass
tdb = next(get_tenant_db("acme"))
fila = tdb.query(DocumentApproval).filter(DocumentApproval.document_id == doc_id).first()
recalc = huella_aprobacion("calidad@acme.com", fila.fecha_resolucion, fila.estado,
                           doc_id, fila.document_version)
check("recalcular desde la base da el mismo hash", recalc == fila.signature_hash,
      f"guardado={fila.signature_hash[:16]}… recalculado={recalc[:16]}…")
aprob_id = fila.id
tdb.close()

r = client.get(f"{API}/documents/{doc_id}/aprobaciones/{aprob_id}/verificar", headers=H)
check("el endpoint de verificacion responde 200", r.status_code == 200, f"{r.status_code} {r.text[:200]}")
v = r.json() if r.status_code == 200 else {}
check("declara la aprobacion verificable", v.get("verificable") is True, str(v))
check("y la huella coincide", v.get("coincide") is True, str(v))

print("\n=== 4. Si alguien altera la fila, la verificacion lo detecta ===")
tdb = next(get_tenant_db("acme"))
fila = tdb.query(DocumentApproval).filter(DocumentApproval.id == aprob_id).first()
fila.estado = "rechazado"          # se cambia la decision por detras
tdb.commit()
tdb.close()
r = client.get(f"{API}/documents/{doc_id}/aprobaciones/{aprob_id}/verificar", headers=H)
check("detecta la manipulacion", r.json().get("coincide") is False, str(r.json())[:200])

tdb = next(get_tenant_db("acme"))
fila = tdb.query(DocumentApproval).filter(DocumentApproval.id == aprob_id).first()
fila.estado = "aprobado"
tdb.commit()
tdb.close()

print("\n=== 5. Una version nueva no queda cubierta por la aprobacion vieja ===")
tdb = next(get_tenant_db("acme"))
d = tdb.query(Document).filter(Document.id == doc_id).first()
d.version_actual = 4               # se sube una version despues de aprobar
tdb.commit()
tdb.close()
r = client.get(f"{API}/documents/{doc_id}/aprobaciones/{aprob_id}/verificar", headers=H)
v = r.json()
check("la huella sigue siendo valida", v.get("coincide") is True, str(v)[:160])
check("pero avisa que la version cambio",
      v.get("version_cambio_desde_la_aprobacion") is True, str(v)[:200])
check("y distingue version aprobada de version actual",
      v.get("version_aprobada") == 3 and v.get("version_actual_documento") == 4, str(v)[:200])

print("\n=== 6. La IP de la traza no la puede elegir el que firma ===")
import re
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware

RAIZ = os.path.join(os.path.dirname(__file__), "..", "..")
dockerfile = open(os.path.join(RAIZ, "backend", "Dockerfile")).read()
m = re.search(r"--forwarded-allow-ips='([^']*)'", dockerfile)
check("el Dockerfile fija --forwarded-allow-ips", m is not None, "no se encontro la bandera")
permitidas = m.group(1) if m else "*"
check("y no confia en cualquiera: con '*' uvicorn se queda con el PRIMER eslabon "
      "del X-Forwarded-For, que es el que escribe el navegador",
      permitidas != "*", permitidas)

# Cliente que entra como entra nginx: desde la red interna de Docker.
proxied = TestClient(ProxyHeadersMiddleware(fastapi_app, trusted_hosts=permitidas),
                     client=("172.18.0.5", 54321))


def firmar_y_leer_ip(headers):
    r = proxied.post(f"{API}/documents/{doc_id}/sign", headers={**H, **headers},
                     json={"approve": True, "comments": "traza"})
    if r.status_code != 200:
        return f"HTTP {r.status_code} {r.text[:120]}"
    tdb = next(get_tenant_db("acme"))
    fila = (tdb.query(DocumentApproval)
            .filter(DocumentApproval.document_id == doc_id)
            .order_by(DocumentApproval.fecha_resolucion.desc()).first())
    ip = fila.ip_address
    tdb.close()
    return ip


# Lo que nginx manda de verdad: un unico valor, ya saneado.
ip = firmar_y_leer_ip({"X-Forwarded-For": "203.0.113.9"})
check("registra la IP que reenvia nginx", ip == "203.0.113.9", f"obtuvo {ip}")

# Red de seguridad por si alguien volviera a appendear la cadena en nginx:
# uvicorn tiene que quedarse con el ultimo eslabon ajeno, no con el primero.
ip = firmar_y_leer_ip({"X-Forwarded-For": "1.2.3.4, 203.0.113.9, 10.0.0.7"})
check("ante una cadena toma el ultimo eslabon ajeno, no el que puso el navegador",
      ip == "203.0.113.9", f"obtuvo {ip}")

print("\n=== 7. nginx no reenvia la cadena que escribe el navegador ===")
sitio = open(os.path.join(RAIZ, "nginx", "sites", "default.conf")).read()
base = open(os.path.join(RAIZ, "nginx", "nginx.conf")).read()
check("ninguna location appendea la cadena del cliente",
      "$proxy_add_x_forwarded_for" not in sitio,
      "volvio proxy_add_x_forwarded_for: el navegador puede imponer su IP")
check("todas las locations mandan X-Forwarded-For $ip_cliente",
      sitio.count("proxy_set_header X-Forwarded-For $ip_cliente;") == sitio.count("    location "),
      f"{sitio.count('proxy_set_header X-Forwarded-For $ip_cliente;')} de "
      f"{sitio.count('    location ')} locations")
check("nginx.conf resuelve $ip_cliente contra un geo de proxies confiables",
      "geo $proxy_de_entrada" in base and "$ip_cliente" in base, "falta el bloque de IP real")

print("\n" + "=" * 62)
if fallos:
    print(f"FALLARON {len(fallos)}: " + "; ".join(fallos))
    sys.exit(1)
print("TODAS LAS COMPROBACIONES PASARON")
