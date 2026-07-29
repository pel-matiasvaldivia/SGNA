# -*- coding: utf-8 -*-
"""Genera un Brochure comercial (2 páginas A4) de Auditorías en Línea.
Corto y preciso, orientado a empresas que van a implementar un Sistema de
Gestión Integrado (SGI) o que ya lo tienen y quieren digitalizarlo."""
import datetime, os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, white
from reportlab.pdfgen import canvas as canvaslib

PRIMARY   = HexColor("#003F87")
SECONDARY = HexColor("#007BFF")
GREEN     = HexColor("#2E7D32")
VIOLET    = HexColor("#7C3AED")
AMBER     = HexColor("#F59E0B")
INK       = HexColor("#0F2036")
GREY      = HexColor("#5B6B7F")
LIGHT     = HexColor("#EAF2FC")
LINE      = HexColor("#D6E1F0")

_PUBLIC = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public")
LOGO = os.path.join(_PUBLIC, "logo-auditorias.png")
OUT  = os.path.join(_PUBLIC, "brochure-auditorias-en-linea.pdf")
TODAY = datetime.date.today().strftime("%d/%m/%Y")

W, H = A4

# ------------------------------------------------------------------ helpers
def wrap(c, text, x, y, max_w, font, size, leading, color):
    c.setFont(font, size); c.setFillColor(color)
    words = text.split(); line = ""
    for w_ in words:
        test = (line + " " + w_).strip()
        if c.stringWidth(test, font, size) <= max_w:
            line = test
        else:
            c.drawString(x, y, line); y -= leading; line = w_
    if line:
        c.drawString(x, y, line); y -= leading
    return y

def chip(c, x, y, label, fill, txt=white):
    w_ = c.stringWidth(label, "Helvetica-Bold", 8) + 12
    c.setFillColor(fill); c.roundRect(x, y, w_, 13, 6.5, fill=1, stroke=0)
    c.setFillColor(txt); c.setFont("Helvetica-Bold", 8)
    c.drawString(x + 6, y + 3.6, label)
    return x + w_ + 5

def feature(c, x, y, box_w, title, body, accent):
    # tarjeta con barra de color a la izquierda
    box_h = 30*mm
    c.setFillColor(white); c.setStrokeColor(LINE); c.setLineWidth(0.7)
    c.roundRect(x, y - box_h, box_w, box_h, 3*mm, fill=1, stroke=1)
    c.setFillColor(accent); c.roundRect(x, y - box_h, 2.4*mm, box_h, 1.2*mm, fill=1, stroke=0)
    tx = x + 7*mm
    c.setFillColor(accent); c.circle(tx + 2.2*mm, y - 6.5*mm, 2.2*mm, fill=1, stroke=0)
    c.setFillColor(INK); c.setFont("Helvetica-Bold", 10.5)
    c.drawString(tx + 6.5*mm, y - 7.6*mm, title)
    wrap(c, body, tx, y - 13*mm, box_w - (tx - x) - 5*mm, "Helvetica", 8.4, 11, GREY)

# ================================================================== PÁGINA 1
c = canvaslib.Canvas(OUT, pagesize=A4)
c.setTitle("Brochure — Auditorías en Línea")
c.setAuthor("Auditorías en Línea")

# --- banda superior
c.setFillColor(PRIMARY); c.rect(0, H-62*mm, W, 62*mm, fill=1, stroke=0)
c.setFillColor(SECONDARY); c.rect(0, H-62*mm, W, 5*mm, fill=1, stroke=0)
# logo sobre banda blanca
c.setFillColor(white); c.roundRect(18*mm, H-24*mm, 58*mm, 15*mm, 3*mm, fill=1, stroke=0)
try:
    c.drawImage(LOGO, 21*mm, H-22*mm, width=52*mm, height=11*mm, preserveAspectRatio=True, mask='auto')
except Exception:
    pass
# claim
c.setFillColor(white); c.setFont("Helvetica-Bold", 25)
c.drawString(18*mm, H-40*mm, "Tu Sistema de Gestión,")
c.drawString(18*mm, H-49.5*mm, "en una sola plataforma.")
c.setFillColor(HexColor("#CFE2FA")); c.setFont("Helvetica", 11)
c.drawString(18*mm, H-57*mm, "ISO 9001 · ISO 14001 · ISO 45001  —  del diagnóstico a la certificación.")

# --- para quién (dos públicos)
y = H-74*mm
c.setFillColor(PRIMARY); c.setFont("Helvetica-Bold", 12)
c.drawString(18*mm, y, "Pensada para dos momentos:")
y -= 8*mm
col_w = (W - 36*mm - 6*mm) / 2
# card A
c.setFillColor(LIGHT); c.roundRect(18*mm, y-24*mm, col_w, 24*mm, 3*mm, fill=1, stroke=0)
c.setFillColor(PRIMARY); c.setFont("Helvetica-Bold", 10)
c.drawString(23*mm, y-7*mm, "Vas a implementar tu SGI")
wrap(c, "Te guía paso a paso con el ciclo PDCA: diagnóstico de brechas, contexto, "
        "objetivos, procesos y documentación lista para certificar.",
     23*mm, y-13*mm, col_w-10*mm, "Helvetica", 8.4, 11, INK)
# card B
x2 = 18*mm + col_w + 6*mm
c.setFillColor(HexColor("#EAF7EE")); c.roundRect(x2, y-24*mm, col_w, 24*mm, 3*mm, fill=1, stroke=0)
c.setFillColor(GREEN); c.setFont("Helvetica-Bold", 10)
c.drawString(x2+5*mm, y-7*mm, "Ya tenés tu SGI andando")
wrap(c, "Digitalizá y centralizá lo que hoy vive en Excel y papel: auditorías, "
        "no conformidades, indicadores y evidencia siempre a mano.",
     x2+5*mm, y-13*mm, col_w-10*mm, "Helvetica", 8.4, 11, INK)

# --- diferenciales (4 features)
y -= 33*mm
c.setFillColor(PRIMARY); c.setFont("Helvetica-Bold", 12)
c.drawString(18*mm, y, "Lo que nos hace diferentes")
y -= 6*mm
fb_w = (W - 36*mm - 6*mm) / 2
feature(c, 18*mm, y, fb_w, "Auditor en Campo (offline)",
        "App móvil que ejecuta los controles en sitio sin internet, con foto y GPS, y sincroniza sola al reconectar.", AMBER)
feature(c, 18*mm + fb_w + 6*mm, y, fb_w, "Auditor de IA integrado",
        "Asistentes que razonan sobre TUS datos: causa raíz, mitigación de riesgos y resúmenes de dirección.", VIOLET)
y -= 33*mm
feature(c, 18*mm, y, fb_w, "3 normas, un solo sistema",
        "Gestión Integrada real: calidad, ambiente y seguridad comparten evidencia, procesos y auditorías.", PRIMARY)
feature(c, 18*mm + fb_w + 6*mm, y, fb_w, "Multiempresa y seguro",
        "Cada organización en un espacio aislado en la nube, con control de versiones y trazabilidad total.", SECONDARY)

# --- en marcha en 3 pasos
y -= 41*mm
c.setFillColor(PRIMARY); c.setFont("Helvetica-Bold", 12)
c.drawString(18*mm, y, "En marcha en 3 pasos")
y -= 7*mm
steps = [
    ("1", "Diagnosticá", "Medí tus brechas contra la norma y obtené tu punto de partida."),
    ("2", "Implementá", "Cargá procesos, documentos, objetivos y auditá — en la oficina o en campo."),
    ("3", "Certificá", "Llegá a la auditoría externa con toda la evidencia consolidada y trazable."),
]
sw3 = (W - 36*mm - 2*6*mm) / 3
sx = 18*mm
for num, tit, body in steps:
    c.setFillColor(white); c.setStrokeColor(LINE); c.setLineWidth(0.7)
    c.roundRect(sx, y-30*mm, sw3, 30*mm, 3*mm, fill=1, stroke=1)
    c.setFillColor(SECONDARY); c.circle(sx+8*mm, y-9*mm, 5*mm, fill=1, stroke=0)
    c.setFillColor(white); c.setFont("Helvetica-Bold", 13)
    c.drawCentredString(sx+8*mm, y-11.2*mm, num)
    c.setFillColor(INK); c.setFont("Helvetica-Bold", 11)
    c.drawString(sx+16*mm, y-10*mm, tit)
    wrap(c, body, sx+5*mm, y-19*mm, sw3-9*mm, "Helvetica", 8.4, 11, GREY)
    sx += sw3 + 6*mm

# --- franja de resultados
y -= 38*mm
c.setFillColor(GREEN); c.roundRect(18*mm, y-18*mm, W-36*mm, 18*mm, 3*mm, fill=1, stroke=0)
c.setFillColor(white); c.setFont("Helvetica-Bold", 11)
c.drawString(24*mm, y-8*mm, "Reemplazá planillas y carpetas por un sistema vivo, auditado y siempre listo.")
c.setFillColor(HexColor("#D7F0DE")); c.setFont("Helvetica", 8.6)
c.drawString(24*mm, y-14*mm, "Sin instalar nada · Acceso web y móvil · Soporte en español · Pensado para pymes y grandes empresas")

# --- pie página 1
c.setFillColor(GREY); c.setFont("Helvetica", 8)
c.drawString(18*mm, 12*mm, "auditoriasenlinea.com.ar")
c.drawCentredString(W/2, 12*mm, "ventas@auditoriasenlinea.com.ar")
c.drawRightString(W-18*mm, 12*mm, "WhatsApp +54 261 570-8516")
c.setStrokeColor(LINE); c.setLineWidth(0.6); c.line(18*mm, 16*mm, W-18*mm, 16*mm)
c.showPage()

# ================================================================== PÁGINA 2
# --- encabezado fino
c.setFillColor(PRIMARY); c.rect(0, H-13*mm, W, 13*mm, fill=1, stroke=0)
c.setFillColor(white); c.setFont("Helvetica-Bold", 10)
c.drawString(18*mm, H-8.6*mm, "Todo lo que incluye la plataforma")
c.setFillColor(HexColor("#BBD3EE")); c.setFont("Helvetica", 8.5)
c.drawRightString(W-18*mm, H-8.6*mm, "Un módulo para cada requisito de la norma")

# --- workflow PDCA en 4 etapas
y = H-22*mm
c.setFillColor(PRIMARY); c.setFont("Helvetica-Bold", 12)
c.drawString(18*mm, y, "Un recorrido completo de mejora continua")
y -= 7*mm
stages = [
    ("PLANIFICAR", PRIMARY, "Diagnóstico de brechas · Contexto (FODA/PESTEL) · Objetivos, riesgos y oportunidades · Mapa de procesos"),
    ("HACER", HexColor("#0F766E"), "Gestión documental y aprobaciones · Capacitación y competencias · Proveedores · Equipos y calibración"),
    ("VERIFICAR", AMBER, "Auditorías internas y de campo · No conformidades (CAPA) · KPIs · Satisfacción de clientes · Huella de carbono"),
    ("ACTUAR", VIOLET, "Revisión por la Dirección · Control de cambios · Reportes consolidados · Asistentes de IA"),
]
sw = (W - 36*mm - 3*6*mm) / 4
sx = 18*mm
for name, col, body in stages:
    c.setFillColor(col); c.roundRect(sx, y-40*mm, sw, 40*mm, 2.5*mm, fill=1, stroke=0)
    c.setFillColor(white); c.setFont("Helvetica-Bold", 10)
    c.drawString(sx+4*mm, y-8*mm, name)
    c.setStrokeColor(white); c.setLineWidth(0.5); c.line(sx+4*mm, y-10*mm, sx+sw-4*mm, y-10*mm)
    wrap(c, body, sx+4*mm, y-15*mm, sw-8*mm, "Helvetica", 7.6, 10, white)
    sx += sw + 6*mm

# --- módulos en columnas (lista compacta)
y -= 49*mm
c.setFillColor(PRIMARY); c.setFont("Helvetica-Bold", 12)
c.drawString(18*mm, y, "21 módulos, integrados entre sí")
y -= 7*mm
modules = [
    "Diagnóstico y Brechas", "Contexto Organizacional", "Planificación (objetivos y riesgos)",
    "Gestión de Procesos (BPM)", "Gestión Documental (DMS)", "Aprobaciones y firma",
    "Auditorías Internas", "Auditor en Campo (app móvil offline)", "No Conformidades (CAPA)",
    "Control de Cambios", "Equipos y Calibración", "Planes y Competencias",
    "Satisfacción de Clientes (NPS/CSAT)", "Gestión de Proveedores", "Huella de Carbono (CO2e)",
    "KPIs e Indicadores", "Revisión por la Dirección", "Reportes SGI consolidados",
    "Auditor de IA (asistentes MCP)", "Seguridad y Salud – SST (ISO 45001)", "Mantenimiento (CMMS)",
]
cols = 3
cw = (W - 36*mm) / cols
rows = (len(modules) + cols - 1) // cols
c.setFont("Helvetica", 8.6)
for i, m in enumerate(modules):
    col = i // rows
    row = i % rows
    mx = 18*mm + col * cw
    my = y - row * 5.6*mm
    c.setFillColor(SECONDARY)
    c.circle(mx + 1.3*mm, my - 1.1*mm, 1.1*mm, fill=1, stroke=0)
    c.setFillColor(INK); c.setFont("Helvetica", 8.6)
    c.drawString(mx + 4*mm, my - 2*mm, m)

# --- franja de beneficios / cierre
y = y - rows*5.6*mm - 8*mm
c.setFillColor(PRIMARY); c.roundRect(18*mm, y-30*mm, W-36*mm, 30*mm, 3*mm, fill=1, stroke=0)
c.setFillColor(white); c.setFont("Helvetica-Bold", 12)
c.drawString(24*mm, y-9*mm, "Menos papel, más control. Certificá con evidencia, no con carpetas.")
# chips de beneficios
bx = 24*mm; by = y-19*mm
for label, col in [("Sin instalar nada", SECONDARY), ("Listo para auditar", GREEN),
                   ("Trazabilidad total", AMBER), ("Datos aislados por empresa", VIOLET),
                   ("Soporte en español", SECONDARY)]:
    if bx > W-60*mm:
        bx = 24*mm; by -= 15
    bx = chip(c, bx, by, label, col)
# CTA
c.setFillColor(HexColor("#CFE2FA")); c.setFont("Helvetica", 9)
c.drawString(24*mm, y-27*mm, "Pedí tu demo:  ventas@auditoriasenlinea.com.ar   ·   WhatsApp +54 261 570-8516")

# --- pie página 2
c.setStrokeColor(LINE); c.setLineWidth(0.6); c.line(18*mm, 15*mm, W-18*mm, 15*mm)
c.setFillColor(GREY); c.setFont("Helvetica", 8)
c.drawString(18*mm, 10.5*mm, "© %s Auditorías en Línea — Plataforma de Gestión Integrada" % datetime.date.today().year)
c.drawRightString(W-18*mm, 10.5*mm, "Actualizado %s · v1.0" % TODAY)
c.showPage()
c.save()
print("OK ->", OUT)
