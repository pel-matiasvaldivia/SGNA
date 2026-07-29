# -*- coding: utf-8 -*-
"""Genera las piezas gráficas (1080x1080) de los 30 posts del plan de marketing,
en el estilo de marca de Auditorías en Línea.
Salida: marketing/piezas/pieza-XX.png  +  PDF con todas."""
import os, math
from reportlab.lib.colors import HexColor, white
from reportlab.pdfgen import canvas as canvaslib

NAVY   = HexColor("#003F87")
NAVY_D = HexColor("#002A5C")
BLUE   = HexColor("#007BFF")
GREEN  = HexColor("#2E7D32")
GREEN_D= HexColor("#1B5E20")
AMBER_D= HexColor("#B45309")
VIOLET = HexColor("#5B21B6")
VIOLET2= HexColor("#7C3AED")
INK    = HexColor("#0F2036")
GREY   = HexColor("#5B6B7F")
SKY    = HexColor("#CFE2FA")
LIGHT  = HexColor("#F4F8FD")
LINE   = HexColor("#D6E1F0")

HERE   = os.path.dirname(os.path.abspath(__file__))
LOGO   = os.path.join(os.path.dirname(HERE), "frontend", "public", "logo-auditorias.png")
OUTDIR = os.path.join(HERE, "piezas")
os.makedirs(OUTDIR, exist_ok=True)
OUT_PDF= os.path.join(HERE, "piezas-auditorias-en-linea.pdf")

S = 1080.0
M = 90

# pilar -> (estilo, color acento, color fondo[solid], color texto sobre acento)
THEME = {
    "Educativo / Norma":   ("light", NAVY,    LIGHT),
    "Dato / Beneficio":    ("light", GREEN,   HexColor("#F1F8F2")),
    "Producto / Función":  ("solid", BLUE,    NAVY),
    "Dolor → Solución":    ("solid", HexColor("#F59E0B"), AMBER_D),
    "Comunidad / Cultura": ("solid", HexColor("#A78BFA"), VIOLET),
}

c = canvaslib.Canvas(OUT_PDF, pagesize=(S, S))

def wrap_lines(text, max_w, font, size):
    words = text.split(); lines=[]; line=""
    for w_ in words:
        test=(line+" "+w_).strip()
        if c.stringWidth(test, font, size) <= max_w: line=test
        else: lines.append(line); line=w_
    if line: lines.append(line)
    return lines

def fit_headline(text, max_w, font, start, min_size):
    size=start
    while size>min_size:
        lines=wrap_lines(text, max_w, font, size)
        if len(lines)<=4: return size, lines
        size-=2
    return min_size, wrap_lines(text, max_w, font, min_size)

def logo_chip(x, y, w=248, h=64):
    c.setFillColor(white); c.roundRect(x, y, w, h, 12, fill=1, stroke=0)
    try: c.drawImage(LOGO, x+14, y+12, width=w-28, height=h-24, preserveAspectRatio=True, mask='auto')
    except Exception: pass

def logo_plain(x, y, w=210, h=54):
    try: c.drawImage(LOGO, x, y, width=w, height=h, preserveAspectRatio=True, mask='auto')
    except Exception: pass

def accent_mark(cx, cy, color, kind):
    c.saveState()
    if kind=="signal":
        bw,gap=13,9; hs=[16,26,36,48]; x=cx-(4*bw+3*gap)/2
        for h in hs: c.setFillColor(color); c.roundRect(x, cy-22, bw, h, 3, fill=1, stroke=0); x+=bw+gap
    elif kind=="spark":
        pts=[]
        for i in range(8):
            ang=math.radians(i*45); rr=34 if i%2==0 else 12
            pts.append((cx+rr*math.cos(ang), cy+rr*math.sin(ang)))
        p=c.beginPath(); p.moveTo(*pts[0])
        for pt in pts[1:]: p.lineTo(*pt)
        p.close(); c.setFillColor(color); c.drawPath(p, fill=1, stroke=0)
    elif kind=="target":
        c.setStrokeColor(color); c.setLineWidth(6)
        c.circle(cx,cy,32,fill=0,stroke=1); c.circle(cx,cy,18,fill=0,stroke=1)
        c.setFillColor(color); c.circle(cx,cy,7,fill=1,stroke=0)
    elif kind=="book":       # educativo
        c.setFillColor(color); c.roundRect(cx-34,cy-24,68,48,6,fill=1,stroke=0)
        c.setStrokeColor(white); c.setLineWidth(4); c.line(cx,cy-22,cx,cy+22)
    elif kind=="chart":      # dato
        c.setFillColor(color)
        for i,h in enumerate([20,34,50]): c.roundRect(cx-30+i*24,cy-24,16,h,3,fill=1,stroke=0)
    elif kind=="warn":       # dolor
        p=c.beginPath(); p.moveTo(cx,cy+30); p.lineTo(cx+32,cy-26); p.lineTo(cx-32,cy-26); p.close()
        c.setFillColor(color); c.drawPath(p,fill=1,stroke=0)
        c.setFillColor(white if False else NAVY_D)
    elif kind=="chat":       # comunidad
        c.setFillColor(color); c.roundRect(cx-34,cy-20,68,44,10,fill=1,stroke=0)
        p=c.beginPath(); p.moveTo(cx-14,cy-20); p.lineTo(cx-24,cy-34); p.lineTo(cx-2,cy-20); p.close()
        c.drawPath(p,fill=1,stroke=0)
    c.restoreState()

PILLAR_ICON = {
    "Educativo / Norma":"book", "Dato / Beneficio":"chart",
    "Producto / Función":"spark", "Dolor → Solución":"warn",
    "Comunidad / Cultura":"chat",
}

def piece(idx, pilar, fmt, headline, subhead, tagline_cta="auditoriasenlinea.com.ar"):
    estilo, accent, bg = THEME[pilar]
    is_quote = "Cita" in fmt
    is_poll  = "Encuesta" in fmt
    icon = PILLAR_ICON[pilar]

    if estilo=="solid":
        c.setFillColor(bg); c.rect(0,0,S,S,fill=1,stroke=0)
        # textura circular sutil
        c.setFillColor(white); c.setFillAlpha(0.06)
        c.circle(S-90, S-90, 240, fill=1, stroke=0); c.setFillAlpha(1)
        c.setFillColor(NAVY_D if bg==NAVY else bg);
        txt_head=white; txt_sub=SKY if bg==NAVY else HexColor("#F3ECFF") if bg==VIOLET else HexColor("#FDECD3")
        kicker_col=HexColor("#DCE9FB") if bg==NAVY else HexColor("#EADCFB") if bg==VIOLET else HexColor("#FBE7C6")
        # ícono en burbuja blanca
        c.setFillColor(white); c.circle(M+52, S-M-30, 56, fill=1, stroke=0)
        accent_mark(M+52, S-M-30, accent, "spark" if icon=="spark" else icon)
        logo_chip(S-M-248, S-M-64)
        c.setFillColor(kicker_col); c.setFont("Helvetica-Bold", 21)
        c.drawString(M, S-M-150, pilar.upper())
    else:
        c.setFillColor(bg); c.rect(0,0,S,S,fill=1,stroke=0)
        c.setFillColor(accent); c.rect(0, 0, S, 20, fill=1, stroke=0)   # barra inferior
        c.setFillColor(accent); c.rect(0, S-20, S, 20, fill=1, stroke=0) # barra superior
        txt_head=NAVY; txt_sub=GREY; kicker_col=accent
        c.setFillColor(accent); c.setFillAlpha(0.10)
        c.circle(S-100, S-120, 210, fill=1, stroke=0); c.setFillAlpha(1)
        c.setFillColor(accent); c.circle(M+52, S-M-30, 54, fill=1, stroke=0)
        accent_mark(M+52, S-M-30, white, icon)
        logo_plain(S-M-210, S-M-56)
        c.setFillColor(kicker_col); c.setFont("Helvetica-Bold", 21)
        c.drawString(M, S-M-150, pilar.upper())

    # ------- cuerpo
    if is_quote:
        c.setFillColor(txt_head if estilo=="solid" else accent)
        c.setFont("Helvetica-Bold", 200); c.drawString(M-8, S/2+40, "“")
        size, lines = fit_headline(headline, S-2*M, "Helvetica-Bold", 62, 40)
        y=S/2+20
        c.setFillColor(txt_head); c.setFont("Helvetica-Bold", size)
        for ln in lines: c.drawString(M, y, ln); y-=size*1.14
        c.setFillColor(txt_sub); c.setFont("Helvetica-Oblique", 30)
        c.drawString(M, y-10, subhead)
    else:
        max_w=S-2*M
        size, lines = fit_headline(headline, max_w, "Helvetica-Bold", 74, 44)
        block_h=len(lines)*size*1.12
        y=S/2 + block_h/2 + 40
        c.setFillColor(txt_head); c.setFont("Helvetica-Bold", size)
        for ln in lines: c.drawString(M, y, ln); y-=size*1.12
        y-=10
        # subhead / opciones
        if is_poll and "·" in subhead:
            opts=[o.strip() for o in subhead.split("·")]
            c.setFont("Helvetica-Bold", 26)
            oy=y-6
            for o in opts:
                w=c.stringWidth(o,"Helvetica-Bold",26)+44
                if estilo=="solid":
                    c.setFillColor(white); c.setFillAlpha(0.16); c.roundRect(M,oy-14,w,44,22,fill=1,stroke=0); c.setFillAlpha(1)
                    c.setFillColor(white)
                else:
                    c.setFillColor(accent); c.setFillAlpha(0.12); c.roundRect(M,oy-14,w,44,22,fill=1,stroke=0); c.setFillAlpha(1)
                    c.setFillColor(accent)
                c.drawString(M+22, oy, o); oy-=58
        else:
            c.setFillColor(txt_sub);
            for ln in wrap_lines(subhead, S-2*M, "Helvetica", 30)[:2]:
                c.setFont("Helvetica", 30); c.drawString(M, y, ln); y-=40

    # ------- pie
    if estilo=="solid":
        c.setFillColor(SKY if bg==NAVY else HexColor("#F3ECFF") if bg==VIOLET else HexColor("#FDECD3"))
    else:
        c.setFillColor(GREY)
    c.setFont("Helvetica-Bold", 24)
    c.drawString(M, 70, tagline_cta)
    c.showPage()

# --------------------------------------------------- datos (headline + subhead)
DATA = [
 ("Dolor → Solución","Carrusel","¿Tu SGI vive en 40 planillas de Excel?","Calidad, ambiente y seguridad en una sola plataforma."),
 ("Producto / Función","Reel","Auditá en sitio, aunque no haya señal","App de campo offline: foto, GPS y sincronización automática."),
 ("Educativo / Norma","Imagen","¿Qué es un Sistema de Gestión Integrado?","ISO 9001 + 14001 + 45001, en un solo sistema."),
 ("Dato / Beneficio","Imagen","El tiempo se va buscando evidencia","Con un repositorio central, aparece en segundos."),
 ("Producto / Función","Carrusel","Inteligencia sobre TUS datos","El Auditor de IA razona sobre tu propio sistema."),
 ("Comunidad / Cultura","Cita","La calidad no es un acto, es un hábito.","— Aristóteles"),
 ("Comunidad / Cultura","Reflexión","La certificación no es la meta","Es el punto de partida de la mejora continua."),
 ("Educativo / Norma","Imagen","3 preguntas para el análisis de causa raíz","Qué pasó, por qué pasó y cómo evitar que se repita."),
 ("Producto / Función","Carrusel","De hallazgo a acción, sin que se pierda nada","El ciclo CAPA completo, trazable y con recordatorios."),
 ("Dolor → Solución","Imagen","Cuando la auditoría cae y la evidencia no aparece","Centralizá y encontrá cualquier registro en segundos."),
 ("Dato / Beneficio","Imagen","Menos papel = menos costo y menos riesgo","Y un aporte directo a tu ISO 14001."),
 ("Producto / Función","Carrusel","Del objetivo al indicador, sin planillas sueltas","KPIs con meta, tendencia y semáforo."),
 ("Comunidad / Cultura","Encuesta","¿Dónde vive hoy tu SGI?","Excel · Papel · Software · Un poco de todo"),
 ("Comunidad / Cultura","Detrás","Hecho por auditores, para auditores","Pensado para la realidad de las pymes de la región."),
 ("Educativo / Norma","Imagen","Contexto de la organización (Cláusula 4)","FODA, partes interesadas, alcance y requisitos legales."),
 ("Producto / Función","Carrusel","Diagnóstico de brechas: sabé dónde estás parado","GAP analysis con % de cumplimiento por norma."),
 ("Dolor → Solución","Imagen","Tres sistemas, tres auditorías, tres dolores","Integrá y eliminá la duplicación de trabajo."),
 ("Dato / Beneficio","Imagen","La trazabilidad es la que te salva en la auditoría","Quién, cuándo y sobre qué versión."),
 ("Producto / Función","Reel","Revisión por la Dirección, sin armar el PPT a último momento","Entradas consolidadas; decisiones con datos reales."),
 ("Comunidad / Cultura","Cita","Sin datos, sos otra persona con una opinión.","— W. E. Deming"),
 ("Comunidad / Cultura","Reflexión","Menos papel, más control","Un SGI vivo que te deja dormir tranquilo."),
 ("Educativo / Norma","Imagen","Riesgos y oportunidades (Cláusula 6)","No es burocracia: es anticiparte a lo que puede fallar."),
 ("Producto / Función","Carrusel","Proveedores bajo control","Evaluación periódica, reclamos y planes de mejora."),
 ("Dolor → Solución","Imagen","Cuando el equipo de campo trabaja en papel","El dato nace digital, sin transcripción ni errores."),
 ("Dato / Beneficio","Imagen","Certificar también abre puertas comerciales","Cada vez más clientes y licitaciones lo exigen."),
 ("Producto / Función","Carrusel","Huella de carbono: medí para poder reducir","Emisiones por alcance y CO2 equivalente."),
 ("Comunidad / Cultura","Encuesta","¿Cuál es tu mayor dolor en la gestión?","Evidencia · Doble carga · Indicadores · Acciones"),
 ("Comunidad / Cultura","Reflexión","La calidad es responsabilidad de todos","Plataforma colaborativa y multiempresa."),
 ("Educativo / Norma","Imagen","Auditoría interna: 4 claves para que sirva","Si la interna es exigente, la externa es tranquila."),
 ("Producto / Función","Carrusel","Toda la plataforma en un vistazo","21 módulos, un solo flujo de mejora continua."),
]
assert len(DATA)==30

for i,(pilar,fmt,h,s) in enumerate(DATA, start=1):
    piece(i, pilar, fmt, h, s)

c.save()
print("OK PDF ->", OUT_PDF)

# export PNG por página (2x => 2160px)
import fitz
doc=fitz.open(OUT_PDF)
for i,page in enumerate(doc):
    pix=page.get_pixmap(matrix=fitz.Matrix(2,2))
    pix.save(os.path.join(OUTDIR, "pieza-%02d.png"%(i+1)))
print("OK PNG -> %s (%d piezas, %dx%d)"%(OUTDIR, doc.page_count, pix.width, pix.height))
