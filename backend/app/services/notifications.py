# -*- coding: utf-8 -*-
"""
Sistema de notificaciones transaccionales de AuditoríasEnLínea.

Todos los correos salen desde ``settings.NOTIFICATIONS_FROM_EMAIL``
(por defecto ``notificaciones@auditoriasenlinea.com.ar``).

Se distinguen dos familias de avisos:

1. **Inmediatos** — se disparan en el momento de la acción desde el endpoint
   correspondiente (alta de tenant, invitación de miembro, auditoría
   planificada, auditoría asignada a un auditor de campo). Son funciones
   síncronas que nunca lanzan excepción, para no romper la operación de negocio
   si el correo falla.

2. **Preventivos** — dependen del tiempo (algo "está por vencer"). Los produce
   :func:`run_preventive_sweep`, que recorre todos los tenants activos y revisa
   calibraciones, órdenes de mantenimiento y acciones/objetivos con fecha
   límite próxima. Lo ejecuta el scheduler interno a diario y/o el endpoint
   ``POST /cron/notificaciones``.
"""
from __future__ import annotations

import logging
from collections import defaultdict
from datetime import datetime, date, timedelta

from sqlalchemy import text

from app.core.config import settings
from app.db.session import SessionLocal
from app.services.email_service import send_email_sync

logger = logging.getLogger(__name__)

PRIMARY = "#003F87"
INK = "#0F2036"
GREY = "#5B6B7F"
AMBER = "#B45309"
RED = "#B91C1C"


# --------------------------------------------------------------------------- #
#  Plantilla HTML                                                             #
# --------------------------------------------------------------------------- #
def _wrap(titulo: str, cuerpo_html: str, cta_label: str | None = None,
          cta_url: str | None = None) -> str:
    """Envuelve el contenido en la plantilla de marca (HTML de correo simple)."""
    cta = ""
    if cta_label and cta_url:
        cta = (
            f'<tr><td style="padding:8px 0 4px;">'
            f'<a href="{cta_url}" style="display:inline-block;background:{PRIMARY};'
            f'color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;'
            f'padding:12px 22px;border-radius:8px;">{cta_label}</a></td></tr>'
        )
    return f"""\
<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F4F8FD;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"
       style="background:#F4F8FD;padding:24px 12px;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0"
           style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;
                  overflow:hidden;font-family:Arial,Helvetica,sans-serif;
                  box-shadow:0 1px 4px rgba(15,32,54,.08);">
      <tr><td style="background:{PRIMARY};padding:18px 28px;">
        <span style="color:#ffffff;font-size:18px;font-weight:700;">
          Auditorías en Línea</span>
      </td></tr>
      <tr><td style="padding:28px;">
        <h1 style="margin:0 0 14px;color:{INK};font-size:20px;">{titulo}</h1>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
               style="color:{INK};font-size:15px;line-height:1.55;">
          <tr><td>{cuerpo_html}</td></tr>
          {cta}
        </table>
      </td></tr>
      <tr><td style="padding:18px 28px;background:#F4F8FD;color:{GREY};
                     font-size:12px;line-height:1.5;">
        Este es un mensaje automático de la plataforma
        <strong>Auditorías en Línea</strong>.<br>
        No respondas a este correo — la casilla no está monitoreada.
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>"""


def _send(to: str, subject: str, text_body: str, html_body: str) -> bool:
    """Envía siempre desde la casilla de notificaciones. Nunca lanza."""
    if not settings.NOTIFICATIONS_ENABLED:
        logger.info("Notificaciones deshabilitadas (NOTIFICATIONS_ENABLED=False). Omitido: %s", subject)
        return False
    if not to:
        return False
    try:
        return send_email_sync(
            email_to=to,
            subject=subject,
            body_text=text_body,
            from_email=settings.NOTIFICATIONS_FROM_EMAIL,
            from_name="Auditorías en Línea",
            html_body=html_body,
        )
    except Exception as e:  # noqa: BLE001 — un aviso jamás debe romper el flujo
        logger.error("Fallo enviando notificación a %s (%s): %s", to, subject, e)
        return False


# --------------------------------------------------------------------------- #
#  1) Avisos inmediatos                                                        #
# --------------------------------------------------------------------------- #
def notify_tenant_created(admin_email: str, empresa: str, slug: str,
                          admin_name: str | None = None) -> bool:
    """Alta de tenant: bienvenida al administrador con el enlace de acceso."""
    login_url = f"{settings.APP_BASE_URL}/login?tenant={slug}"
    saludo = f"Hola {admin_name}," if admin_name else "Hola,"
    cuerpo = (
        f"{saludo}<br><br>"
        f"La cuenta de <strong>{empresa}</strong> ya está activa en Auditorías en Línea. "
        f"Desde hoy podés empezar a implementar y auditar tu Sistema de Gestión.<br><br>"
        f"<strong>Primeros pasos sugeridos:</strong><br>"
        f"1. Completá el contexto de la organización.<br>"
        f"2. Invitá a tu equipo desde <em>Configuración → Usuarios</em>.<br>"
        f"3. Cargá tus procesos y planificá tu primera auditoría."
    )
    text_body = (
        f"{saludo}\n\nLa cuenta de {empresa} ya está activa en Auditorías en Línea.\n"
        f"Ingresá en: {login_url}\n\n"
        f"Primeros pasos: completar contexto, invitar al equipo y planificar la primera auditoría."
    )
    return _send(
        admin_email, f"Bienvenido a Auditorías en Línea — {empresa}",
        text_body, _wrap("Tu cuenta ya está activa 🎉", cuerpo, "Ingresar a la plataforma", login_url),
    )


def notify_user_invited(email: str, full_name: str | None, empresa: str,
                        temp_password: str, role: str, slug: str | None = None) -> bool:
    """Invitación de miembro: acceso y contraseña temporal."""
    login_url = f"{settings.APP_BASE_URL}/login" + (f"?tenant={slug}" if slug else "")
    saludo = f"Hola {full_name}," if full_name else "Hola,"
    cuerpo = (
        f"{saludo}<br><br>"
        f"Te invitaron a colaborar en <strong>{empresa}</strong> dentro de "
        f"Auditorías en Línea con el rol de <strong>{role}</strong>.<br><br>"
        f"<strong>Tus datos de acceso:</strong><br>"
        f"Usuario: {email}<br>"
        f"Contraseña temporal: "
        f"<code style='background:#F4F8FD;padding:2px 6px;border-radius:4px;'>{temp_password}</code>"
        f"<br><br>Por seguridad, cambiala en tu primer ingreso desde "
        f"<em>Mi perfil → Contraseña</em>."
    )
    text_body = (
        f"{saludo}\n\nTe invitaron a colaborar en {empresa} con el rol de {role}.\n"
        f"Usuario: {email}\nContraseña temporal: {temp_password}\n"
        f"Ingresá en: {login_url}\nCambiá tu contraseña en el primer ingreso."
    )
    return _send(
        email, f"Te invitaron a Auditorías en Línea — {empresa}",
        text_body, _wrap("Fuiste invitado a colaborar", cuerpo, "Ingresar", login_url),
    )


def notify_audit_planned(destinatarios: list[str], programa_titulo: str,
                         fecha_inicio, fecha_fin, empresa: str | None = None) -> int:
    """Auditoría planificada: aviso al/los responsable(s) de Calidad/SGI."""
    rango = ""
    if fecha_inicio:
        rango = f"del {_fmt(fecha_inicio)}"
        if fecha_fin:
            rango += f" al {_fmt(fecha_fin)}"
    cuerpo = (
        f"Se planificó un nuevo programa de auditoría"
        + (f" en <strong>{empresa}</strong>" if empresa else "") + ":<br><br>"
        f"<strong>{programa_titulo}</strong><br>"
        + (f"Período: {rango}<br>" if rango else "")
        + "<br>Revisá el alcance y asigná los auditores responsables de cada área."
    )
    text_body = (
        f"Se planificó un nuevo programa de auditoría: {programa_titulo}.\n"
        + (f"Período: {rango}\n" if rango else "")
        + "Revisá el alcance y asigná los auditores."
    )
    url = f"{settings.APP_BASE_URL}/dashboard/auditorias"
    html = _wrap("Nueva auditoría planificada", cuerpo, "Ver auditorías", url)
    enviados = 0
    for d in {e for e in destinatarios if e}:
        if _send(d, f"Auditoría planificada: {programa_titulo}", text_body, html):
            enviados += 1
    return enviados


def notify_audit_assigned(auditor_email: str, auditor_nombre: str | None, area: str | None,
                          norma: str | None, fecha_programada, programa_titulo: str | None) -> bool:
    """Auditoría asignada: aviso al auditor de campo."""
    saludo = f"Hola {auditor_nombre}," if auditor_nombre else "Hola,"
    detalle = ""
    if programa_titulo:
        detalle += f"Programa: <strong>{programa_titulo}</strong><br>"
    if area:
        detalle += f"Área: {area}<br>"
    if norma:
        detalle += f"Norma: {norma}<br>"
    if fecha_programada:
        detalle += f"Fecha programada: {_fmt(fecha_programada)}<br>"
    cuerpo = (
        f"{saludo}<br><br>"
        f"Te asignaron una auditoría de campo. Ya tenés disponible el checklist "
        f"para completar desde la app.<br><br>{detalle}"
    )
    text_body = (
        f"{saludo}\n\nTe asignaron una auditoría de campo.\n"
        + (f"Programa: {programa_titulo}\n" if programa_titulo else "")
        + (f"Área: {area}\n" if area else "")
        + (f"Norma: {norma}\n" if norma else "")
        + (f"Fecha programada: {_fmt(fecha_programada)}\n" if fecha_programada else "")
    )
    url = f"{settings.APP_BASE_URL}/dashboard/auditorias/campo"
    return _send(
        auditor_email, f"Te asignaron una auditoría{f': {area}' if area else ''}",
        text_body, _wrap("Nueva auditoría asignada", cuerpo, "Abrir mi checklist", url),
    )


# --------------------------------------------------------------------------- #
#  2) Barrido preventivo (avisos "por vencer")                                #
# --------------------------------------------------------------------------- #
def _fmt(d) -> str:
    if isinstance(d, datetime):
        return d.strftime("%d/%m/%Y")
    if isinstance(d, date):
        return d.strftime("%d/%m/%Y")
    return str(d)


def _as_date(d):
    return d.date() if isinstance(d, datetime) else d


def _admin_emails(db, tenant_id) -> list[str]:
    """Administradores activos del tenant (destino de respaldo)."""
    from app.models.user import User
    rows = db.query(User.email).filter(
        User.tenant_id == tenant_id, User.role == "admin", User.active == True  # noqa: E712
    ).all()
    return [r[0] for r in rows if r[0]]


def _resolve_recipient(db, responsable_id, admins: list[str]) -> tuple[str | None, str | None]:
    """Devuelve (email, nombre) del responsable; si no hay, el primer admin."""
    from app.models.user import User
    if responsable_id:
        u = db.query(User).filter(User.id == responsable_id, User.active == True).first()  # noqa: E712
        if u and u.email:
            return u.email, (u.full_name or u.email)
    if admins:
        return admins[0], "Responsable"
    return None, None


def _dias_label(dias: int) -> str:
    if dias < 0:
        return f"vencida hace {abs(dias)} día(s)"
    if dias == 0:
        return "vence hoy"
    return f"vence en {dias} día(s)"


def run_preventive_sweep(now: datetime | None = None) -> dict:
    """
    Recorre todos los tenants activos y envía a cada responsable un resumen de
    lo que requiere atención (calibraciones, mantenimientos y acciones por
    vencer). Marca como ``vencido`` los equipos cuya calibración ya pasó.

    Devuelve un resumen con los conteos. No lanza: los errores por tenant se
    registran y el barrido continúa con el siguiente.
    """
    if not settings.NOTIFICATIONS_ENABLED:
        return {"enabled": False, "message": "NOTIFICATIONS_ENABLED=False"}

    from app.models.tenant import Tenant
    from app.models.equipo import EquipoMedicion
    from app.models.mantenimiento import OrdenTrabajoMantenimiento
    from app.models.planificacion import ObjetivoSGI

    hoy = (now or datetime.utcnow()).date()
    lim_cal = hoy + timedelta(days=settings.NOTIF_CALIBRACION_DIAS)
    lim_man = hoy + timedelta(days=settings.NOTIF_MANTENIMIENTO_DIAS)
    lim_acc = hoy + timedelta(days=settings.NOTIF_APROBACION_DIAS)

    summary = {"enabled": True, "tenants": 0, "calibraciones": 0, "mantenimientos": 0,
               "acciones": 0, "equipos_vencidos_marcados": 0, "emails_enviados": 0, "errores": 0}

    db = SessionLocal()
    try:
        tenants = db.query(Tenant).filter(Tenant.active == True).all()  # noqa: E712
        for t in tenants:
            summary["tenants"] += 1
            admins = _admin_emails(db, t.id)
            # buckets: email -> {"nombre", "cal": [...], "man": [...], "acc": [...]}
            buckets: dict[str, dict] = defaultdict(
                lambda: {"nombre": None, "cal": [], "man": [], "acc": []}
            )
            try:
                db.execute(text(f'SET search_path TO "tenant_{t.slug}", public'))

                # -- Calibraciones por vencer / vencidas --
                equipos = db.query(EquipoMedicion).filter(
                    EquipoMedicion.fecha_proxima_calibracion.isnot(None),
                    EquipoMedicion.estado != "fuera_servicio",
                ).all()
                for e in equipos:
                    fecha = _as_date(e.fecha_proxima_calibracion)
                    if fecha and fecha <= lim_cal:
                        if fecha < hoy and e.estado != "vencido":
                            e.estado = "vencido"
                            summary["equipos_vencidos_marcados"] += 1
                        email, nombre = _resolve_recipient(db, e.responsable_id, admins)
                        if email:
                            b = buckets[email]
                            b["nombre"] = b["nombre"] or nombre
                            b["cal"].append({"codigo": e.codigo, "nombre": e.nombre,
                                             "fecha": fecha, "dias": (fecha - hoy).days})
                            summary["calibraciones"] += 1

                # -- Mantenimientos programados por vencer --
                ordenes = db.query(OrdenTrabajoMantenimiento).filter(
                    OrdenTrabajoMantenimiento.fecha_programada.isnot(None),
                    OrdenTrabajoMantenimiento.estado.in_(["pendiente", "en_progreso"]),
                ).all()
                for o in ordenes:
                    fecha = _as_date(o.fecha_programada)
                    if fecha and fecha <= lim_man:
                        email, nombre = _resolve_recipient(db, o.responsable_id, admins)
                        if email:
                            b = buckets[email]
                            b["nombre"] = b["nombre"] or nombre
                            b["man"].append({"tipo": o.tipo_mantenimiento,
                                             "desc": (o.descripcion_falla or "")[:80],
                                             "fecha": fecha, "dias": (fecha - hoy).days})
                            summary["mantenimientos"] += 1

                # -- Acciones / objetivos con fecha límite (aprobación por vencer) --
                objetivos = db.query(ObjetivoSGI).filter(
                    ObjetivoSGI.fecha_limite.isnot(None),
                    ObjetivoSGI.progreso < 100,
                ).all()
                for ob in objetivos:
                    fecha = _as_date(ob.fecha_limite)
                    if fecha and fecha <= lim_acc:
                        email, nombre = _resolve_recipient(db, ob.responsable_id, admins)
                        if email:
                            b = buckets[email]
                            b["nombre"] = b["nombre"] or nombre
                            b["acc"].append({"nombre": ob.nombre, "progreso": ob.progreso,
                                             "fecha": fecha, "dias": (fecha - hoy).days})
                            summary["acciones"] += 1

                db.commit()  # persiste los estados "vencido"
            except Exception as e:  # noqa: BLE001
                summary["errores"] += 1
                logger.error("Barrido preventivo falló para tenant %s: %s", t.slug, e)
                db.rollback()
                continue
            finally:
                db.execute(text("SET search_path TO public"))
                db.commit()

            # -- Enviar un digest por destinatario --
            for email, data in buckets.items():
                if not (data["cal"] or data["man"] or data["acc"]):
                    continue
                subject, text_body, html = _render_digest(t.name, data["nombre"], data)
                if _send(email, subject, text_body, html):
                    summary["emails_enviados"] += 1
    finally:
        try:
            db.execute(text("SET search_path TO public"))
        except Exception:
            pass
        db.close()

    logger.info("Barrido preventivo completado: %s", summary)
    return summary


def _render_digest(empresa: str, nombre: str | None, data: dict) -> tuple[str, str, str]:
    """Construye (asunto, texto, html) del resumen de pendientes de un destinatario."""
    total = len(data["cal"]) + len(data["man"]) + len(data["acc"])
    saludo = f"Hola {nombre}," if nombre else "Hola,"

    def _seccion(titulo: str, items: list, render) -> tuple[str, str]:
        if not items:
            return "", ""
        html = f'<p style="margin:18px 0 6px;font-weight:700;color:{INK};">{titulo}</p><ul style="margin:0;padding-left:18px;">'
        txt = f"\n{titulo}\n"
        for it in items:
            linea = render(it)
            color = RED if it["dias"] < 0 else (AMBER if it["dias"] <= 3 else GREY)
            html += f'<li style="margin:4px 0;color:{INK};">{linea} <span style="color:{color};">({_dias_label(it["dias"])})</span></li>'
            txt += f"  - {linea} ({_dias_label(it['dias'])})\n"
        html += "</ul>"
        return html, txt

    cal_h, cal_t = _seccion(
        "🔧 Calibraciones", data["cal"],
        lambda it: f'{it["codigo"]} · {it["nombre"]} — próxima: {_fmt(it["fecha"])}')
    man_h, man_t = _seccion(
        "🛠️ Mantenimientos programados", data["man"],
        lambda it: f'{it["tipo"].capitalize()}: {it["desc"]} — programado: {_fmt(it["fecha"])}')
    acc_h, acc_t = _seccion(
        "🎯 Acciones / objetivos con fecha límite", data["acc"],
        lambda it: f'{it["nombre"]} ({it["progreso"]:.0f}%) — límite: {_fmt(it["fecha"])}')

    cuerpo = (
        f"{saludo}<br><br>Tenés <strong>{total}</strong> ítem(s) que requieren tu "
        f"atención en <strong>{empresa}</strong>:{cal_h}{man_h}{acc_h}"
    )
    text_body = (
        f"{saludo}\n\nTenés {total} ítem(s) que requieren tu atención en {empresa}:\n"
        f"{cal_t}{man_t}{acc_t}"
    )
    url = f"{settings.APP_BASE_URL}/dashboard"
    html = _wrap("Pendientes que requieren tu atención", cuerpo, "Ir a la plataforma", url)
    subject = f"⏰ {total} pendiente(s) por vencer — {empresa}"
    return subject, text_body, html
