# -*- coding: utf-8 -*-
"""Genera un carrusel cuadrado (1:1) para publicar en LinkedIn:
 - PDF deslizable (document post): public/brochure-linkedin.pdf
 - PNG 1080x1080 por slide:        public/linkedin/slide-XX.png
Contenido comercial de Auditorías en Línea, corto y preciso."""
import os, datetime
from reportlab.lib.colors import HexColor, white
from reportlab.pdfgen import canvas as canvaslib

PRIMARY   = HexColor("#003F87")
PRIMARY_D = HexColor("#002A5C")
SECONDARY = HexColor("#007BFF")
GREEN     = HexColor("#2E7D32")
TEAL      = HexColor("#0F766E")
VIOLET    = HexColor("#7C3AED")
AMBER     = HexColor("#F59E0B")
INK       = HexColor("#0F2036")
GREY      = HexColor("#5B6B7F")
LIGHT     = HexColor("#EAF2FC")
LINE      = HexColor("#D6E1F0")
SKY       = HexColor("#CFE2FA")

_PUBLIC = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public")
LOGO    = os.path.join(_PUBLIC, "logo-auditorias.png")
OUT_PDF = os.path.join(_PUBLIC, "brochure-linkedin.pdf")
PNG_DIR = os.path.join(_PUBLIC, "linkedin")
os.makedirs(PNG_DIR, exist_ok=True)
YEAR = datetime.date.today().year

S = 1080.0  # lienzo cuadrado (pt == px a 72 dpi)
M = 80      # margen

c = canvaslib.Canvas(OUT_PDF, pagesize=(S, S))
c.setTitle("Auditorías en Línea — Sistema de Gestión Integrado")
c.setAuthor("Auditorías en Línea")

# ------------------------------------------------------------------ helpers
def wrap(text, x, y, max_w, font, size, leading, color, center=False):
    c.setFont(font, size); c.setFillColor(color)
    words = text.split(); line = ""
    for w_ in words:
        test = (line + " " + w_).strip()
        if c.stringWidth(test, font, size) <= max_w:
            line = test
        else:
            (c.drawCentredString(x, y, line) if center else c.drawString(x, y, line))
            y -= leading; line = w_
    if line:
        (c.drawCentredString(x, y, line) if center else c.drawString(x, y, line))
        y -= leading
    return y

def dots(active, total=8):
    """indicador de progreso del carrusel, abajo al centro"""
    r = 5; gap = 20; total_w = (total-1)*gap
    x0 = S/2 - total_w/2; yb = 46
    for i in range(total):
        c.setFillColor(white if i == active else HexColor("#7FA8D8"))
        c.circle(x0 + i*gap, yb, r if i == active else 4, fill=1, stroke=0)

def brand_footer(dark=True):
    col = SKY if dark else GREY
    c.setFillColor(col); c.setFont("Helvetica-Bold", 15)
    c.drawString(M, 42, "auditoriasenlinea.com.ar")

def swipe_hint():
    c.setFillColor(white); c.setFont("Helvetica-Bold", 16)
    c.drawRightString(S-M, 44, "Deslizá  →")

def logo_chip(x, y, w=250, h=66):
    c.setFillColor(white); c.roundRect(x, y, w, h, 12, fill=1, stroke=0)
    try:
        c.drawImage(LOGO, x+16, y+13, width=w-32, height=h-26,
                    preserveAspectRatio=True, mask='auto')
    except Exception:
        pass

def iso_badges(x, y, color=SKY):
    c.setFont("Helvetica-Bold", 17); c.setFillColor(color)
    c.drawString(x, y, "ISO 9001   ·   ISO 14001   ·   ISO 45001")

def icon_tile(cx, cy, color, glyph):
    c.setFillColor(color); c.circle(cx, cy, 46, fill=1, stroke=0)
    c.setFillColor(white); c.setFont("Helvetica-Bold", 40)
    c.drawCentredString(cx, cy-14, glyph)

def draw_icon(cx, cy, color, kind):
    """Íconos vectoriales (sin depender de glifos de fuente)."""
    c.saveState()
    if kind == "signal":            # barras de señal ascendentes
        bw, gap = 12, 8; hs = [16, 26, 36, 48]
        x = cx - (4*bw + 3*gap)/2
        for h in hs:
            c.setFillColor(color); c.roundRect(x, cy-22, bw, h, 3, fill=1, stroke=0)
            x += bw + gap
    elif kind == "spark":           # destello de 4 puntas
        import math
        pts = []
        for i in range(8):
            ang = math.radians(i*45)
            rr = 34 if i % 2 == 0 else 12
            pts.append((cx + rr*math.cos(ang), cy + rr*math.sin(ang)))
        p = c.beginPath(); p.moveTo(*pts[0])
        for pt in pts[1:]:
            p.lineTo(*pt)
        p.close(); c.setFillColor(color); c.drawPath(p, fill=1, stroke=0)
    elif kind == "target":          # diana (círculos concéntricos)
        c.setStrokeColor(color); c.setLineWidth(6)
        c.circle(cx, cy, 34, fill=0, stroke=1)
        c.circle(cx, cy, 20, fill=0, stroke=1)
        c.setFillColor(color); c.circle(cx, cy, 8, fill=1, stroke=0)
    c.restoreState()

def title(x, y, text, color=white, size=54):
    c.setFillColor(color); c.setFont("Helvetica-Bold", size)
    c.drawString(x, y, text)

# ============================================================ SLIDE 1 · portada
c.setFillColor(PRIMARY); c.rect(0, 0, S, S, fill=1, stroke=0)
c.setFillColor(PRIMARY_D); c.rect(0, 0, S, 300, fill=1, stroke=0)
c.setFillColor(SECONDARY); c.rect(0, 300, S, 6, fill=1, stroke=0)
logo_chip(M, S-M-70)
c.setFillColor(white); c.setFont("Helvetica-Bold", 62)
c.drawString(M, S-330, "Tu Sistema")
c.drawString(M, S-400, "de Gestión,")
c.setFillColor(SECONDARY); c.setFont("Helvetica-Bold", 62)
c.drawString(M, S-470, "en una sola")
c.drawString(M, S-540, "plataforma.")
iso_badges(M, S-600)
wrap("Calidad, ambiente y seguridad integrados — del diagnóstico a la certificación.",
     M, S-655, S-2*M-40, "Helvetica", 24, 32, SKY)
swipe_hint(); dots(0)
c.showPage()

# ============================================================ SLIDE 2 · dos momentos
c.setFillColor(white); c.rect(0, 0, S, S, fill=1, stroke=0)
c.setFillColor(PRIMARY); c.rect(0, S-150, S, 150, fill=1, stroke=0)
c.setFillColor(white); c.setFont("Helvetica-Bold", 42)
c.drawString(M, S-95, "¿En qué momento estás?")
# card A
cy = 560; ch = 300; cw = S-2*M
c.setFillColor(LIGHT); c.roundRect(M, cy, cw, ch, 20, fill=1, stroke=0)
c.setFillColor(PRIMARY); c.roundRect(M, cy, 12, ch, 6, fill=1, stroke=0)
icon_tile(M+90, cy+ch-70, PRIMARY, "1")
c.setFillColor(PRIMARY); c.setFont("Helvetica-Bold", 34)
c.drawString(M+160, cy+ch-80, "Vas a implementar tu SGI")
wrap("Te guía paso a paso con el ciclo PDCA: diagnóstico de brechas, contexto, "
     "objetivos, procesos y documentación lista para certificar.",
     M+160, cy+ch-130, cw-260, "Helvetica", 24, 33, INK)
# card B
cy2 = 190
c.setFillColor(HexColor("#EAF7EE")); c.roundRect(M, cy2, cw, ch, 20, fill=1, stroke=0)
c.setFillColor(GREEN); c.roundRect(M, cy2, 12, ch, 6, fill=1, stroke=0)
icon_tile(M+90, cy2+ch-70, GREEN, "2")
c.setFillColor(GREEN); c.setFont("Helvetica-Bold", 34)
c.drawString(M+160, cy2+ch-80, "Ya tenés tu SGI andando")
wrap("Digitalizá y centralizá lo que hoy vive en Excel y papel: auditorías, no "
     "conformidades, indicadores y evidencia siempre a mano.",
     M+160, cy2+ch-130, cw-260, "Helvetica", 24, 33, INK)
brand_footer(dark=False); c.setFillColor(GREY); dots_dark = True
# dots oscuros sobre fondo claro
r=5; gap=20; total=8; x0=S/2-(total-1)*gap/2
for i in range(total):
    c.setFillColor(PRIMARY if i==1 else HexColor("#C6D5E8"))
    c.circle(x0+i*gap, 46, 5 if i==1 else 4, fill=1, stroke=0)
c.showPage()

# ------------------------------------------ helper: slide de diferencial (fondo color)
def feature_slide(idx, bg, accent, kind, kicker, headline_lines, body, bullets):
    c.setFillColor(bg); c.rect(0, 0, S, S, fill=1, stroke=0)
    c.setFillColor(HexColor("#FFFFFF")); c.setFillAlpha(0.10)
    c.circle(S-120, S-120, 220, fill=1, stroke=0); c.setFillAlpha(1)
    # icono
    c.setFillColor(white); c.circle(M+60, S-M-40, 60, fill=1, stroke=0)
    draw_icon(M+60, S-M-40, accent, kind)
    c.setFillColor(HexColor("#DCE9FB")); c.setFont("Helvetica-Bold", 22)
    c.drawString(M, S-260, kicker.upper())
    y = S-320
    c.setFillColor(white); c.setFont("Helvetica-Bold", 58)
    for ln in headline_lines:
        c.drawString(M, y, ln); y -= 66
    y -= 10
    y = wrap(body, M, y, S-2*M-20, "Helvetica", 26, 36, HexColor("#EAF1FB"))
    y -= 24
    c.setFont("Helvetica-Bold", 25)
    for b in bullets:
        c.setFillColor(white); c.circle(M+8, y+8, 6, fill=1, stroke=0)
        c.setFillColor(HexColor("#F2F7FE")); c.setFont("Helvetica", 25)
        c.drawString(M+30, y, b); y -= 44
    swipe_hint(); dots(idx)
    c.showPage()

# ============================================================ SLIDE 3 · app de campo
feature_slide(2, HexColor("#B45309"), AMBER, "signal", "App de campo",
    ["Auditá en sitio,", "aunque no", "haya señal."],
    "El auditor ejecuta los controles desde el celular. Sin conexión, "
    "todo se guarda y sincroniza solo al reconectar.",
    ["Foto y ubicación GPS por hallazgo", "Firma digital y reporte automático",
     "Los «no conforme» abren una NC sola"])

# ============================================================ SLIDE 4 · auditor IA
feature_slide(3, HexColor("#5B21B6"), VIOLET, "spark", "Auditor de IA",
    ["Inteligencia", "sobre TUS", "propios datos."],
    "Asistentes que razonan sobre la información real de tu sistema, "
    "no respuestas genéricas.",
    ["Causa raíz de no conformidades", "Mitigación de riesgos priorizada",
     "Resúmenes ejecutivos para dirección"])

# ============================================================ SLIDE 5 · integrado
feature_slide(4, PRIMARY, SECONDARY, "target", "Todo integrado",
    ["3 normas,", "un solo", "sistema."],
    "Calidad, ambiente y seguridad comparten procesos, evidencia y "
    "auditorías. Cada empresa en un espacio aislado y seguro.",
    ["21 módulos conectados entre sí", "Multiempresa (multi-tenant)",
     "Control de versiones y trazabilidad"])

# ============================================================ SLIDE 6 · 3 pasos
c.setFillColor(white); c.rect(0, 0, S, S, fill=1, stroke=0)
c.setFillColor(PRIMARY); c.rect(0, S-150, S, 150, fill=1, stroke=0)
c.setFillColor(white); c.setFont("Helvetica-Bold", 42)
c.drawString(M, S-95, "En marcha en 3 pasos")
steps = [
    (SECONDARY, "1", "Diagnosticá", "Medí tus brechas contra la norma y obtené tu punto de partida."),
    (TEAL,      "2", "Implementá", "Cargá procesos, documentos, objetivos y auditá — en oficina o en campo."),
    (GREEN,     "3", "Certificá",  "Llegá a la auditoría externa con toda la evidencia consolidada."),
]
sy = S-320; sh = 190
for col, num, tit, body in steps:
    c.setFillColor(HexColor("#F4F8FD")); c.setStrokeColor(LINE); c.setLineWidth(1)
    c.roundRect(M, sy, S-2*M, sh, 18, fill=1, stroke=1)
    c.setFillColor(col); c.circle(M+70, sy+sh/2, 42, fill=1, stroke=0)
    c.setFillColor(white); c.setFont("Helvetica-Bold", 42)
    c.drawCentredString(M+70, sy+sh/2-15, num)
    c.setFillColor(INK); c.setFont("Helvetica-Bold", 36)
    c.drawString(M+140, sy+sh-62, tit)
    wrap(body, M+140, sy+sh-105, S-2*M-180, "Helvetica", 24, 31, GREY)
    sy -= sh + 24
# dots oscuros
r=5; gap=20; total=8; x0=S/2-(total-1)*gap/2
for i in range(total):
    c.setFillColor(PRIMARY if i==5 else HexColor("#C6D5E8"))
    c.circle(x0+i*gap, 46, 5 if i==5 else 4, fill=1, stroke=0)
brand_footer(dark=False)
c.showPage()

# ============================================================ SLIDE 7 · módulos PDCA
c.setFillColor(PRIMARY); c.rect(0, 0, S, S, fill=1, stroke=0)
c.setFillColor(white); c.setFont("Helvetica-Bold", 42)
c.drawString(M, S-130, "21 módulos, un solo flujo")
c.setFillColor(SKY); c.setFont("Helvetica", 24)
c.drawString(M, S-172, "Ciclo de mejora continua: Planificar · Hacer · Verificar · Actuar")
cols = [
    (PRIMARY, "PLANIFICAR", ["Diagnóstico y brechas", "Contexto (FODA/PESTEL)", "Objetivos y riesgos", "Mapa de procesos"]),
    (TEAL, "HACER", ["Gestión documental (DMS)", "Aprobaciones y firma", "Capacitación", "Proveedores · Equipos"]),
    (AMBER, "VERIFICAR", ["Auditorías int. y de campo", "No conformidades (CAPA)", "KPIs · Satisfacción", "Huella de carbono"]),
    (VIOLET, "ACTUAR", ["Revisión por la Dirección", "Control de cambios", "Reportes consolidados", "Asistentes de IA"]),
]
gap = 24
cw = (S-2*M-gap)/2
chh = 280
positions = [(M, S-490), (M+cw+gap, S-490), (M, S-490-chh-gap), (M+cw+gap, S-490-chh-gap)]
for (col, head, items), (px, py) in zip(cols, positions):
    c.setFillColor(HexColor("#0A2E5E")); c.roundRect(px, py, cw, chh, 16, fill=1, stroke=0)
    c.setFillColor(col); c.roundRect(px, py+chh-46, cw, 46, 16, fill=1, stroke=0)
    c.setFillColor(col); c.rect(px, py+chh-46, cw, 20, fill=1, stroke=0)
    c.setFillColor(white); c.setFont("Helvetica-Bold", 24)
    c.drawString(px+22, py+chh-32, head)
    yy = py+chh-80
    c.setFont("Helvetica", 21)
    for it in items:
        c.setFillColor(col); c.circle(px+26, yy+7, 5, fill=1, stroke=0)
        c.setFillColor(HexColor("#E7F0FB")); c.setFont("Helvetica", 21)
        c.drawString(px+42, yy, it); yy -= 40
swipe_hint(); dots(6)
c.showPage()

# ============================================================ SLIDE 8 · CTA
c.setFillColor(PRIMARY); c.rect(0, 0, S, S, fill=1, stroke=0)
c.setFillColor(PRIMARY_D); c.rect(0, 0, S, 260, fill=1, stroke=0)
logo_chip(S/2-125, S-300, w=250, h=66)
c.setFillColor(white); c.setFont("Helvetica-Bold", 54)
c.drawCentredString(S/2, S-430, "Menos papel.")
c.drawCentredString(S/2, S-495, "Más control.")
wrap("Reemplazá planillas y carpetas por un sistema vivo, auditado y siempre "
     "listo para certificar.", S/2, S-565, S-2*M-40, "Helvetica", 26, 36, SKY, center=True)
# botón
bw, bh = 520, 84; bx = S/2-bw/2; by = 340
c.setFillColor(SECONDARY); c.roundRect(bx, by, bw, bh, 42, fill=1, stroke=0)
c.setFillColor(white); c.setFont("Helvetica-Bold", 30)
c.drawCentredString(S/2, by+29, "Pedí tu demo gratuita")
# contacto
c.setFillColor(SKY); c.setFont("Helvetica-Bold", 26)
c.drawCentredString(S/2, 210, "ventas@auditoriasenlinea.com.ar")
c.drawCentredString(S/2, 168, "WhatsApp  +54 261 570-8516")
c.setFillColor(HexColor("#9FC0E8")); c.setFont("Helvetica", 22)
c.drawCentredString(S/2, 110, "auditoriasenlinea.com.ar")
dots(7)
c.showPage()

c.save()
print("OK PDF ->", OUT_PDF)

# ------------------------------------------------- exportar PNG 1080x1080 por slide
try:
    import fitz
    doc = fitz.open(OUT_PDF)
    for i, page in enumerate(doc):
        # página = 1080pt; escala x2 => 2160px nítido (LinkedIn reescala)
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
        pix.save(os.path.join(PNG_DIR, "slide-%02d.png" % (i+1)))
    print("OK PNG -> %s (%d slides, %dx%d px)" % (PNG_DIR, doc.page_count, pix.width, pix.height))
except Exception as e:
    print("PNG export skipped:", e)
