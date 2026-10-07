"""
Recuperación de contraseña.

Hasta ahora, el auditor de campo que olvidaba la clave dependía de que un
administrador se la cambiara a mano: en una auditoría en planta, eso es quedar
afuera del trabajo del día. El flujo nuevo manda un enlace de un solo uso al
correo de la cuenta.

Un flujo de recuperación es, por definición, una puerta para entrar sin saber
la contraseña, así que lo que se verifica acá es sobre todo que esa puerta no
se abra de más: que el formulario no sirva para averiguar qué correos están
registrados, que el token no se pueda leer desde la base, que no se pueda
reusar, que venza, que un enlace nuevo apague el anterior, y que no se pueda
usar el formulario para inundar una casilla ajena.

Necesita un Postgres real: lo que se prueba son restricciones de unicidad,
cascadas y comparaciones de fecha del lado del motor.

    export TEST_DATABASE_URL="postgresql+psycopg2://usuario:clave@localhost:5432/basedeprueba"
    python tests/test_recuperacion_password.py

BORRA Y RECREA el schema `public`. Apuntala a una base descartable.
"""
import os
import re
import sys
import uuid
from datetime import datetime, timedelta, timezone

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
from app.models.password_reset import PasswordResetToken
from app.models.tenant import Tenant
from app.models.user import User
from app.models.user_tenant import UserTenant
from app.core.config import settings
from app.core.security import get_password_hash, hash_token_recuperacion, verify_password
from app.services import notifications
from app.api.v1.auth import _email_parcial
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


# Los correos no salen: se capturan para poder leer el enlace que recibiría la
# persona. Se intercepta `_send` y no la función del aviso, así el cuerpo que se
# inspecciona es el real y no uno armado por la prueba.
enviados = []
_send_real = notifications._send


def _capturar(to, subject, text_body, html_body):
    enviados.append({"to": to, "subject": subject, "text": text_body, "html": html_body})
    return True


notifications._send = _capturar


def token_del_ultimo_correo():
    """Extrae el token del enlace, como lo haría la persona al hacer clic."""
    if not enviados:
        return None
    m = re.search(r"/restablecer\?token=([A-Za-z0-9_\-%]+)", enviados[-1]["text"])
    return m.group(1) if m else None


with ENGINE.begin() as c:
    c.execute(text("DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;"))
Base.metadata.create_all(
    ENGINE, tables=[t for t in Base.metadata.sorted_tables if t.schema == "public"])

CLAVE_VIEJA = "Secreta123"
CLAVE_NUEVA = "OtraClave456"


def crear_usuario(email, nombre="Marisol Seco", activo=True, tenant_id=None):
    with Session() as db:
        if tenant_id is None:
            t = Tenant(id=uuid.uuid4(), slug=f"org{uuid.uuid4().hex[:8]}",
                       name="OLCA S.A.", two_factor_enabled=False)
            db.add(t)
            db.flush()
            tenant_id = t.id
        u = User(id=uuid.uuid4(), tenant_id=tenant_id, email=email, full_name=nombre,
                 role="auditor", password_hash=get_password_hash(CLAVE_VIEJA), active=activo)
        db.add(u)
        db.flush()
        db.add(UserTenant(id=uuid.uuid4(), user_id=u.id, tenant_id=tenant_id,
                          role="auditor", active=True))
        db.commit()
        return u.id


def pedir(email):
    return client.post(f"{API}/auth/recuperar-password", json={"email": email})


def puede_entrar(email, clave):
    r = client.post(f"{API}/auth/login", json={"email": email, "password": clave})
    return r.status_code == 200


def envejecer_pedido(user_id, segundos):
    """Mueve el último pedido hacia atrás en el tiempo, para no esperar de verdad."""
    with Session() as db:
        fila = db.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == user_id
        ).order_by(PasswordResetToken.created_at.desc()).first()
        fila.created_at = datetime.now(timezone.utc) - timedelta(seconds=segundos)
        db.commit()


AUDITOR = "auditor.campo@olca.com"
crear_usuario(AUDITOR)

# Cuenta que no participa de ningún canje: sirve para comprobar al final que
# cambiar una contraseña no tocó las demás.
TESTIGO = "testigo@olca.com"
uid_testigo = crear_usuario(TESTIGO, "Ana Testigo")
with Session() as db:
    hash_testigo_inicial = db.query(User).filter(User.email == TESTIGO).first().password_hash

print("\n=== 1. El formulario no revela qué correos existen ===")
enviados.clear()
r_existe = pedir(AUDITOR)
correos_tras_existente = len(enviados)
r_no_existe = pedir("nadie.de.aca@ejemplo.com")
check("pedir para una cuenta real responde 200", r_existe.status_code == 200,
      f"{r_existe.status_code} {r_existe.text[:160]}")
check("pedir para un correo inexistente responde 200 igual", r_no_existe.status_code == 200,
      f"{r_no_existe.status_code} {r_no_existe.text[:160]}")
check("y el mensaje es idéntico en los dos casos",
      r_existe.json().get("message") == r_no_existe.json().get("message"),
      f"{r_existe.json()} vs {r_no_existe.json()}")
check("a la cuenta real le salió un correo", correos_tras_existente == 1, str(correos_tras_existente))
check("al correo inexistente no le salió ninguno", len(enviados) == 1, str(len(enviados)))

print("\n=== 2. El enlace no se puede reconstruir desde la base ===")
token = token_del_ultimo_correo()
check("el correo trae un enlace con token", bool(token), str(enviados[-1]["text"])[:200])
with Session() as db:
    filas = db.query(PasswordResetToken).all()
    check("se guardó un solo vale", len(filas) == 1, str(len(filas)))
    guardado = filas[0].token_hash if filas else ""
    check("lo guardado es el SHA-256 del token, no el token",
          guardado == hash_token_recuperacion(token) and guardado != token,
          f"guardado={guardado[:16]}… token={str(token)[:16]}…")
    check("la huella mide 64 caracteres hexadecimales",
          len(guardado) == 64 and all(c in "0123456789abcdef" for c in guardado), guardado)
    check("el token en claro no aparece en ninguna columna de la fila",
          token not in str({c.name: getattr(filas[0], c.name) for c in filas[0].__table__.columns}),
          "el token quedó legible en la tabla")
    check("queda registrada la IP del pedido", filas[0].ip_solicitud is not None,
          str(filas[0].ip_solicitud))
    check("el vale nace sin usar", filas[0].used_at is None, str(filas[0].used_at))

print("\n=== 3. El enlace se puede consultar antes de usarlo ===")
r = client.get(f"{API}/auth/restablecer-password", params={"token": token})
check("GET del enlace responde 200", r.status_code == 200, f"{r.status_code} {r.text[:160]}")
estado = r.json() if r.status_code == 200 else {}
check("dice que es válido", estado.get("valido") is True, str(estado))
check("muestra el correo tapado y no completo",
      estado.get("email_parcial") and estado["email_parcial"] != AUDITOR,
      str(estado.get("email_parcial")))
check("el correo tapado conserva el dominio",
      (estado.get("email_parcial") or "").endswith("@olca.com"), str(estado.get("email_parcial")))
check("y oculta el medio del nombre de usuario",
      "ditor.cam" not in (estado.get("email_parcial") or ""), str(estado.get("email_parcial")))

r = client.get(f"{API}/auth/restablecer-password", params={"token": "inventado-por-mi"})
check("un token inventado se informa inválido, sin error 500",
      r.status_code == 200 and r.json().get("valido") is False, f"{r.status_code} {r.text[:160]}")

print("\n=== 4. El canje cambia la contraseña ===")
check("antes del canje entra con la clave vieja", puede_entrar(AUDITOR, CLAVE_VIEJA))
enviados.clear()
r = client.post(f"{API}/auth/restablecer-password", json={"token": token, "password": CLAVE_NUEVA})
check("POST del canje responde 200", r.status_code == 200, f"{r.status_code} {r.text[:200]}")
check("entra con la clave nueva", puede_entrar(AUDITOR, CLAVE_NUEVA))
check("la clave vieja dejó de servir", not puede_entrar(AUDITOR, CLAVE_VIEJA))
check("sale el aviso de que la contraseña cambió",
      any("contraseña cambió" in e["subject"].lower() for e in enviados),
      str([e["subject"] for e in enviados]))
check("el aviso va a la cuenta afectada",
      enviados and enviados[-1]["to"] == AUDITOR, str(enviados[-1]["to"] if enviados else None))
check("el aviso no incluye la contraseña nueva",
      all(CLAVE_NUEVA not in e["text"] and CLAVE_NUEVA not in (e["html"] or "") for e in enviados),
      "la contraseña viajó en el correo")

print("\n=== 5. El enlace sirve una sola vez ===")
r = client.post(f"{API}/auth/restablecer-password", json={"token": token, "password": "TerceraClave789"})
check("reusar el mismo enlace se rechaza con 400", r.status_code == 400,
      f"{r.status_code} {r.text[:160]}")
check("la contraseña del segundo intento no quedó", not puede_entrar(AUDITOR, "TerceraClave789"))
check("sigue valiendo la del canje legítimo", puede_entrar(AUDITOR, CLAVE_NUEVA))
with Session() as db:
    fila = db.query(PasswordResetToken).first()
    check("el vale quedó sellado como usado", fila.used_at is not None, str(fila.used_at))

print("\n=== 6. Un enlace nuevo apaga el anterior ===")
OTRO = "jefe.planta@olca.com"
uid_otro = crear_usuario(OTRO, "Ramiro Ponce")
enviados.clear()
pedir(OTRO)
primer_token = token_del_ultimo_correo()
envejecer_pedido(uid_otro, settings.PASSWORD_RESET_THROTTLE_SECONDS + 10)
pedir(OTRO)
segundo_token = token_del_ultimo_correo()
check("el segundo pedido genera un token distinto", primer_token != segundo_token,
      "los dos pedidos dieron el mismo token")

r = client.get(f"{API}/auth/restablecer-password", params={"token": primer_token})
check("el primer enlace ya no es válido", r.json().get("valido") is False, str(r.json()))
r = client.post(f"{API}/auth/restablecer-password", json={"token": primer_token, "password": "ClaveVieja000"})
check("y canjearlo se rechaza", r.status_code == 400, f"{r.status_code} {r.text[:160]}")
r = client.post(f"{API}/auth/restablecer-password", json={"token": segundo_token, "password": CLAVE_NUEVA})
check("el último enlace enviado sí funciona", r.status_code == 200, f"{r.status_code} {r.text[:160]}")

print("\n=== 7. El enlace vence ===")
VENCE = "deposito@olca.com"
uid_vence = crear_usuario(VENCE, "Nadia Robledo")
enviados.clear()
pedir(VENCE)
token_vencido = token_del_ultimo_correo()
with Session() as db:
    fila = db.query(PasswordResetToken).filter(
        PasswordResetToken.token_hash == hash_token_recuperacion(token_vencido)).first()
    fila.expires_at = datetime.now(timezone.utc) - timedelta(minutes=1)
    db.commit()
r = client.get(f"{API}/auth/restablecer-password", params={"token": token_vencido})
check("un enlace vencido se informa inválido", r.json().get("valido") is False, str(r.json()))
r = client.post(f"{API}/auth/restablecer-password",
                json={"token": token_vencido, "password": "ClaveTardia999"})
check("y no se puede canjear", r.status_code == 400, f"{r.status_code} {r.text[:160]}")
check("la contraseña siguió siendo la original", puede_entrar(VENCE, CLAVE_VIEJA))

print("\n=== 8. No se puede usar el formulario para inundar una casilla ===")
RAFAGA = "calidad@olca.com"
uid_rafaga = crear_usuario(RAFAGA, "Valeria Cruz")
enviados.clear()
pedir(RAFAGA)
tras_el_primero = len(enviados)
r_segundo = pedir(RAFAGA)
check("el primer pedido manda el correo", tras_el_primero == 1, str(tras_el_primero))
check("el segundo pedido inmediato no manda otro", len(enviados) == 1, str(len(enviados)))
check("pero responde 200 igual, sin delatar que la cuenta existe",
      r_segundo.status_code == 200, f"{r_segundo.status_code} {r_segundo.text[:160]}")
with Session() as db:
    vigentes = db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == uid_rafaga,
        PasswordResetToken.used_at.is_(None)).count()
    check("quedó un solo vale vigente para esa cuenta", vigentes == 1, str(vigentes))

envejecer_pedido(uid_rafaga, settings.PASSWORD_RESET_THROTTLE_SECONDS + 10)
pedir(RAFAGA)
check("pasada la espera, vuelve a mandar", len(enviados) == 2, str(len(enviados)))

print("\n=== 9. Una cuenta desactivada no se puede recuperar ===")
BAJA = "exempleado@olca.com"
crear_usuario(BAJA, "Hugo Vera", activo=False)
enviados.clear()
r = pedir(BAJA)
check("responde 200 como con cualquier otro correo", r.status_code == 200, str(r.status_code))
check("no se le manda ningún enlace", len(enviados) == 0, str(len(enviados)))
with Session() as db:
    u = db.query(User).filter(User.email == BAJA).first()
    emitidos = db.query(PasswordResetToken).filter(PasswordResetToken.user_id == u.id).count()
    check("ni se emite un vale", emitidos == 0, str(emitidos))

print("\n=== 10. La contraseña nueva tiene un mínimo ===")
CORTA = "mantenimiento@olca.com"
uid_corta = crear_usuario(CORTA, "Lucía Paz")
enviados.clear()
pedir(CORTA)
tok_corta = token_del_ultimo_correo()
r = client.post(f"{API}/auth/restablecer-password", json={"token": tok_corta, "password": "corta1"})
check("una contraseña de 6 caracteres se rechaza con 422", r.status_code == 422,
      f"{r.status_code} {r.text[:160]}")
check("el vale sigue sirviendo después del rechazo",
      client.get(f"{API}/auth/restablecer-password", params={"token": tok_corta}).json().get("valido") is True)
r = client.post(f"{API}/auth/restablecer-password", json={"token": tok_corta, "password": "OchoChar"})
check("una de 8 se acepta", r.status_code == 200, f"{r.status_code} {r.text[:160]}")

print("\n=== 11. Un canje toca una sola cuenta ===")
# Después de todos los canjes de arriba, la cuenta que nunca pidió nada tiene
# que haber quedado exactamente igual: mismo hash, y sin vales emitidos.
with Session() as db:
    testigo = db.query(User).filter(User.email == TESTIGO).first()
    check("la cuenta que no pidió nada conserva su hash intacto",
          testigo.password_hash == hash_testigo_inicial,
          "el hash de un tercero cambió durante los canjes")
    check("y sigue entrando con su contraseña original",
          verify_password(CLAVE_VIEJA, testigo.password_hash))
    check("nunca se le emitió un vale",
          db.query(PasswordResetToken).filter(
              PasswordResetToken.user_id == uid_testigo).count() == 0)

print("\n=== 12. Borrar la cuenta se lleva sus vales ===")
with Session() as db:
    u = db.query(User).filter(User.email == CORTA).first()
    db.query(UserTenant).filter(UserTenant.user_id == u.id).delete()
    db.delete(u)
    db.commit()
    huerfanos = db.query(PasswordResetToken).filter(PasswordResetToken.user_id == uid_corta).count()
    check("no quedan vales huérfanos (ON DELETE CASCADE)", huerfanos == 0, str(huerfanos))

print("\n=== 13. El tapado del correo no filtra el nombre de usuario ===")
for crudo, esperado_dominio in [("a@b.com", "b.com"), ("ab@b.com", "b.com"),
                                ("auditor@empresa.com.ar", "empresa.com.ar")]:
    tapado = _email_parcial(crudo)
    usuario = crudo.split("@")[0]
    check(f"«{crudo}» queda tapado como «{tapado}»",
          tapado.endswith("@" + esperado_dominio) and (len(usuario) <= 4 or usuario not in tapado),
          tapado)
check("un valor sin arroba no explota", _email_parcial("sin-arroba") == "***",
      _email_parcial("sin-arroba"))

notifications._send = _send_real

print()
if fallos:
    print(f"FALLARON {len(fallos)} comprobaciones:")
    for f in fallos:
        print(f"  - {f}")
    sys.exit(1)
print("Todas las comprobaciones pasaron")
