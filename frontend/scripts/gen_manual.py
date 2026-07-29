# -*- coding: utf-8 -*-
"""Genera el Manual de Uso de Auditorías en Línea en PDF, desde el contenido del
Centro de Ayuda de la plataforma."""
import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, white
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, Table, TableStyle,
    PageBreak, Image, ListFlowable, ListItem, KeepTogether, FrameBreak,
)
from reportlab.pdfgen import canvas as canvaslib

PRIMARY = HexColor("#003F87")
SECONDARY = HexColor("#007BFF")
GREEN = HexColor("#2E7D32")
INK = HexColor("#0F2036")
GREY = HexColor("#5B6B7F")
LIGHT = HexColor("#EAF2FC")
LINE = HexColor("#D6E1F0")

import os
_PUBLIC = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public")
LOGO = os.path.join(_PUBLIC, "logo-auditorias.png")
OUT = os.path.join(_PUBLIC, "manual-auditorias-en-linea.pdf")

# ------------------------- Contenido (del Centro de Ayuda) -------------------------
MODULES = {
  "diagnosticos": {"name":"Diagnóstico y Brechas","clause":"GAP analysis inicial","tagline":"Medí cuán lejos estás de cumplir la norma.","description":"Evaluación inicial (GAP analysis) que compara tu organización contra cada cláusula de la norma elegida y calcula el porcentaje de cumplimiento.","howTo":["Creá un diagnóstico con «Nuevo Diagnóstico» y seleccioná las normas a incluir (ISO 9001/14001/45001).","Recorré cada ítem del checklist y marcá el estado: cumple, cumple parcialmente, no cumple o no aplica.","Adjuntá evidencia documental y observaciones en los puntos relevantes.","Revisá el resumen de brechas para priorizar el plan de acción."],"recommendations":["Hacé el primer diagnóstico apenas empezás: es la línea base de todo el sistema.","Repetilo cada 6-12 meses para medir avance real.","Convertí cada «no cumple» en un objetivo o una acción en Planificación."]},
  "contexto": {"name":"Contexto Organizacional","clause":"ISO 9001 · Cláusula 4","tagline":"Definí el terreno donde opera tu SGI.","description":"Registra las cuestiones internas y externas (FODA/PESTEL), las partes interesadas, el alcance del sistema y los requisitos legales aplicables.","howTo":["En «Análisis FODA/PESTEL» cargá fortalezas, debilidades, oportunidades y amenazas.","En «Partes Interesadas» listá clientes, proveedores, organismos y sus expectativas.","Redactá el «Alcance del SGI» indicando procesos, sitios y exclusiones justificadas.","Cargá los «Requisitos Legales» que debe cumplir la organización."],"recommendations":["El alcance debe ser realista: no incluyas procesos que aún no vas a auditar.","Revisá el contexto en cada Revisión por la Dirección.","Vinculá amenazas y expectativas con riesgos en Planificación."]},
  "planificacion": {"name":"Planificación SGI","clause":"ISO 9001 · Cláusula 6","tagline":"Fijá objetivos y gestioná riesgos y oportunidades.","description":"Define los objetivos del sistema de gestión y administra los riesgos y oportunidades con su evaluación inicial y residual.","howTo":["Cargá objetivos SMART con responsable, meta y fecha.","Registrá riesgos y oportunidades con probabilidad e impacto.","Definí controles y volvé a valorar el riesgo residual.","Asociá cada riesgo a un proceso y a su evidencia."],"recommendations":["Un objetivo sin indicador no se puede medir: conectalo con KPIs.","Prioridad a los riesgos de nivel alto antes de la auditoría.","Releé los riesgos cuando cambie el contexto o haya una no conformidad."]},
  "procesos": {"name":"Gestión de Procesos","clause":"ISO 9001 · Cláusula 4.4","tagline":"Mapeá cómo funciona realmente tu organización.","description":"Modela el mapa de procesos (BPM): entradas, salidas, responsables e interacciones entre procesos.","howTo":["Creá cada proceso con su tipo (estratégico, operativo, de apoyo).","Definí entradas, salidas, responsable e indicadores asociados.","Relacioná los procesos con riesgos, documentos y objetivos."],"recommendations":["Empezá por los procesos operativos que generan valor al cliente.","Cada proceso debería tener al menos un indicador en KPIs.","Mantené el mapa simple: pocos procesos bien definidos es mejor que muchos difusos."]},
  "documents": {"name":"Gestión Documental (DMS)","clause":"ISO 9001 · Cláusula 7.5","tagline":"Tu información documentada, versionada y controlada.","description":"Repositorio central de manuales, procedimientos, registros y evidencias, con control de versiones y almacenamiento aislado por tenant.","howTo":["Subí un documento con «Cargar» indicando tipo y descripción.","Cada nueva carga genera una versión; la anterior queda en el historial.","Descargá con enlaces temporales y seguros.","Referenciá documentos como evidencia en otros módulos."],"recommendations":["Nombrá los documentos con un código consistente (ej. PR-CAL-01).","No borres versiones: la trazabilidad es parte del cumplimiento.","Enviá a aprobación los documentos críticos antes de publicarlos."]},
  "approvals": {"name":"Aprobaciones de Calidad","clause":"ISO 9001 · Cláusula 7.5","tagline":"Firmá y aprobá documentos de forma controlada.","description":"Flujo de revisión y firma electrónica de los documentos que requieren aprobación formal antes de entrar en vigencia.","howTo":["Revisá la lista de documentos pendientes de aprobación.","Abrí el documento, verificá su contenido y firmá o rechazá.","El documento aprobado queda como vigente y trazable."],"recommendations":["Definí quién aprueba cada tipo de documento antes de operar.","Aprobá siempre sobre la última versión.","Un rechazo debería incluir el motivo para que se corrija."]},
  "auditorias": {"name":"Auditorías Internas","clause":"ISO 9001 · Cláusula 9.2","tagline":"Planificá auditorías y registrá hallazgos.","description":"Gestiona el programa anual de auditorías internas y el registro de hallazgos o desvíos detectados.","howTo":["Creá un programa de auditoría con objetivo, alcance y fechas.","Durante la auditoría, cargá los hallazgos encontrados.","Derivá los hallazgos que sean no conformidades al módulo ISO 9001."],"recommendations":["Auditá contra el alcance declarado en Contexto.","Programá al menos una auditoría interna antes de la certificación.","Un hallazgo objetivo cita la cláusula y la evidencia."]},
  "iso9001": {"name":"No Conformidades (ISO 9001)","clause":"ISO 9001 · Cláusula 10.2","tagline":"Desviaciones, causa raíz y acción correctiva (CAPA).","description":"Ciclo completo de no conformidades: registro, análisis de causa raíz, acción correctiva y verificación de eficacia.","howTo":["Declará la desviación indicando origen y descripción.","Ejecutá el análisis de causa raíz (Ishikawa / 5 Porqués).","Definí la acción correctiva con responsable y fecha límite.","Verificá la eficacia y cerrá la no conformidad."],"recommendations":["No cierres una NC sin verificar que la causa fue eliminada.","Usá el Auditor de IA para acelerar la causa raíz.","Las NC recurrentes indican un problema de proceso, no de personas."]},
  "cambios": {"name":"Control de Cambios","clause":"ISO 9001 · Cláusula 6.3","tagline":"Planificá los cambios sin perder el control.","description":"Gestiona los cambios del sistema de gestión de forma planificada, con acciones e impacto asociados.","howTo":["Registrá el cambio con su código y descripción.","Cargá las acciones necesarias y sus responsables.","Actualizá el estado a medida que se implementan."],"recommendations":["Evaluá el impacto del cambio antes de ejecutarlo.","Vinculá cambios significativos con riesgos y documentos.","Registrá también los cambios de contexto y de estructura."]},
  "equipos": {"name":"Equipos y Calibración","clause":"ISO 9001 · Cláusula 7.1.5","tagline":"Instrumentos calibrados y trazables.","description":"Inventario de equipos de seguimiento y medición con su historial de calibraciones y certificados.","howTo":["Cargá cada equipo con su identificación y frecuencia de calibración.","Registrá cada calibración con fecha, resultado y certificado.","Adjuntá el certificado desde la Gestión Documental."],"recommendations":["Configurá la frecuencia para anticipar vencimientos.","Un equipo fuera de calibración invalida las mediciones que hizo.","Guardá los certificados en el DMS para tenerlos trazables."]},
  "capacitacion": {"name":"Planes y Competencias","clause":"ISO 9001 · Cláusula 7.2","tagline":"Personas competentes para cada tarea.","description":"Administra planes de capacitación, asistentes y la matriz de competencias del personal.","howTo":["Creá un plan de capacitación con tema, fecha y asistentes.","Registrá asistencia y evaluá la eficacia de la formación.","Mantené la matriz de competencias por colaborador."],"recommendations":["Detectá brechas de competencia a partir del diagnóstico.","Evaluá la eficacia, no solo la asistencia.","La competencia se demuestra con evidencia (título, evaluación, práctica)."]},
  "satisfaccion": {"name":"Satisfacción de Clientes","clause":"ISO 9001 · Cláusula 9.1.2","tagline":"Escuchá la voz del cliente (NPS / CSAT).","description":"Diseña y ejecuta encuestas de satisfacción y analiza los resultados de NPS y CSAT.","howTo":["Creá una encuesta con sus preguntas.","Compartila o simulá respuestas para cargar resultados.","Analizá los indicadores de satisfacción resultantes."],"recommendations":["Medí de forma periódica para ver tendencias, no puntos aislados.","Convertí una insatisfacción en una no conformidad o mejora.","Cruzá satisfacción con reclamos de proveedores y KPIs."]},
  "proveedores": {"name":"Gestión de Proveedores","clause":"ISO 9001 · Cláusula 8.4","tagline":"Controlá tu cadena de suministro.","description":"Registra proveedores, los evalúa periódicamente y gestiona reclamos hacia ellos.","howTo":["Dá de alta el proveedor con sus datos y criticidad.","Realizá evaluaciones periódicas de desempeño.","Registrá reclamos y su resolución."],"recommendations":["Definí criterios de evaluación antes de calificar.","Enfocá el control en los proveedores críticos.","Un proveedor mal evaluado debería tener un plan de mejora."]},
  "huella": {"name":"Huella de Carbono","clause":"GHG Protocol / ISO 14064","tagline":"Medí tus emisiones de CO2 (Alcance 1, 2 y 3).","description":"Calcula la huella de carbono organizacional cargando las fuentes de emisión por alcance y categoría.","howTo":["Cargá cada fuente de emisión con su cantidad y unidad.","Clasificá por alcance (1 directas, 2 energía, 3 indirectas).","Revisá el CO2 equivalente calculado y adjuntá evidencia."],"recommendations":["Empezá por Alcance 1 y 2, que son los más fáciles de medir.","Guardá las facturas/soportes como evidencia de cada carga.","Fijá una meta de reducción y seguila con un KPI."]},
  "kpis": {"name":"KPIs e Indicadores","clause":"ISO 9001 · Cláusula 9.1","tagline":"Medí el desempeño con datos.","description":"Define indicadores clave, cargá mediciones y seguí su evolución frente a las metas.","howTo":["Creá un KPI con su fórmula, unidad y meta.","Cargá mediciones periódicas.","Analizá la tendencia y el cumplimiento de la meta."],"recommendations":["Pocos KPIs relevantes valen más que muchos que nadie mira.","Cada objetivo y proceso importante debería tener su indicador.","Un KPI en rojo es un insumo directo para la Revisión por la Dirección."]},
  "direccion": {"name":"Revisión por la Dirección","clause":"ISO 9001 · Cláusula 9.3","tagline":"La dirección revisa y decide.","description":"Registra las revisiones por la dirección con sus entradas, conclusiones y decisiones.","howTo":["Creá una revisión con fecha y participantes.","Consolidá entradas: KPIs, auditorías, NC, satisfacción, riesgos.","Documentá conclusiones, decisiones y recursos asignados; luego cerrala."],"recommendations":["Hacela al menos una vez al año.","Usá los datos reales de los otros módulos como entrada.","Toda decisión debería derivar en objetivos o acciones concretas."]},
  "reportes": {"name":"Reporte SGI","clause":"Salidas consolidadas","tagline":"El estado de tu sistema en un solo lugar.","description":"Genera reportes consolidados del sistema de gestión para auditorías, dirección o clientes.","howTo":["Seleccioná el período y el alcance del reporte.","Generá el reporte con los datos consolidados del SGI.","Compartilo o exportalo según necesites."],"recommendations":["Generá un reporte antes de cada auditoría externa.","Usalo como respaldo de la Revisión por la Dirección."]},
  "ia-auditor": {"name":"Auditor de IA Hub","clause":"Asistentes MCP","tagline":"Asistentes inteligentes para tu SGI.","description":"Herramientas de IA conectables (MCP): consultor de cumplimiento, causa raíz, mitigación de riesgos y resumen ejecutivo de KPIs. Razonan sobre los datos reales de tu sistema.","howTo":["Elegí el asistente según lo que necesites.","Proporcioná el contexto (una NC, un riesgo, un período).","Revisá la propuesta de la IA y ajustala con tu criterio."],"recommendations":["La IA acelera el análisis, pero la decisión final es del responsable.","Ideal para causa raíz y para redactar resúmenes de dirección.","Verificá siempre las recomendaciones contra la evidencia real."]},
  "campo": {"name":"Auditorías de Campo (App móvil offline)","clause":"App móvil · PWA","tagline":"Ejecutá auditorías en sitio, incluso sin internet.","description":"Aplicación móvil para que el auditor de campo ejecute los controles asignados por el auditor líder directamente desde el celular. Funciona sin conexión y sincroniza automáticamente al reconectar.","howTo":["El auditor líder asigna la auditoría y su checklist por norma desde «Auditorías Internas».","El auditor abre «Mis Auditorías (Campo)» en el celular y ejecuta cada control: conforme, no conforme o N/A, con foto y ubicación GPS.","Sin conexión, las respuestas se guardan en el dispositivo; al recuperar señal, se sincronizan solas.","Al terminar, el auditor firma digitalmente y se genera el reporte; los «no conforme» abren una No Conformidad automáticamente."],"recommendations":["Instalá la app desde el navegador del celular (se agrega como ícono, sin App Store).","Sacá la foto de evidencia en cada punto crítico.","Verificá el indicador de sincronización antes de cerrar la jornada."]},
  "sst": {"name":"Seguridad y Salud (SST)","clause":"ISO 45001","tagline":"Cuidá a las personas: incidentes e inspecciones.","description":"Registra incidentes de seguridad y salud ocupacional e inspecciones de SST.","howTo":["Registrá cada incidente con su descripción y gravedad.","Cargá las inspecciones de seguridad realizadas.","Derivá los hallazgos relevantes a no conformidades o acciones."],"recommendations":["Registrá también los casi-incidentes: previenen accidentes.","Cerrá el círculo con acciones correctivas.","Cruzá SST con capacitación y mantenimiento."]},
  "mantenimiento": {"name":"Mantenimiento (CMMS)","clause":"ISO 9001 · Cláusula 7.1.3","tagline":"Infraestructura disponible y confiable.","description":"Gestiona activos de infraestructura y órdenes de trabajo de mantenimiento.","howTo":["Cargá los activos de infraestructura críticos.","Generá órdenes de trabajo de mantenimiento.","Seguí su estado hasta el cierre."],"recommendations":["Priorizá el mantenimiento preventivo sobre el correctivo.","Vinculá los activos con los equipos de medición cuando aplique.","Una falla recurrente puede ser una no conformidad de infraestructura."]},
}

PHASES = [
  ("1 · Diagnóstico y contexto", "Entendé dónde estás parado y definí el terreno de tu sistema de gestión.", ["diagnosticos","contexto"]),
  ("2 · Planificación y procesos", "Fijá objetivos, gestioná riesgos y mapeá cómo trabaja tu organización.", ["planificacion","procesos"]),
  ("3 · Documentación y evidencia", "Centralizá y controlá la información documentada con aprobaciones.", ["documents","approvals"]),
  ("4 · Control operativo", "Auditá, gestioná no conformidades, cambios y equipos de medición.", ["auditorias","iso9001","cambios","equipos"]),
  ("5 · Auditoría en campo", "Ejecutá los controles en sitio desde el celular, incluso sin internet.", ["campo"]),
  ("6 · Personas y partes interesadas", "Competencias del equipo, satisfacción de clientes y proveedores.", ["capacitacion","satisfaccion","proveedores"]),
  ("7 · Desempeño y dirección", "Medí resultados, tu huella de carbono y llevá todo a la dirección.", ["huella","kpis","direccion","reportes"]),
  ("8 · Inteligencia y otros sistemas", "Asistentes de IA, seguridad y salud (SST) y mantenimiento (CMMS).", ["ia-auditor","sst","mantenimiento"]),
]

TODAY = datetime.date.today().strftime("%d/%m/%Y")

# ------------------------------- Estilos -------------------------------
styles = getSampleStyleSheet()
def S(name, **kw):
    kw.setdefault("fontName", "Helvetica")
    return ParagraphStyle(name, parent=styles["Normal"], **kw)

st_body = S("body", fontSize=10, leading=15, textColor=INK, spaceAfter=4)
st_phase = S("phase", fontSize=17, leading=21, textColor=PRIMARY, fontName="Helvetica-Bold", spaceBefore=6, spaceAfter=2)
st_phase_sub = S("phasesub", fontSize=10, leading=14, textColor=GREY, spaceAfter=10)
st_modname = S("modname", fontSize=13, leading=16, textColor=white, fontName="Helvetica-Bold")
st_clause = S("clause", fontSize=8, leading=11, textColor=white, alignment=TA_LEFT)
st_tag = S("tag", fontSize=10, leading=14, textColor=SECONDARY, fontName="Helvetica-Bold", spaceAfter=4)
st_desc = S("desc", fontSize=9.5, leading=14, textColor=INK, spaceAfter=6)
st_h = S("h", fontSize=9, leading=12, textColor=PRIMARY, fontName="Helvetica-Bold", spaceBefore=4, spaceAfter=3)
st_li = S("li", fontSize=9.5, leading=13.5, textColor=INK)
st_li_g = S("lig", fontSize=9.5, leading=13.5, textColor=HexColor("#4A5A6D"))
st_toc = S("toc", fontSize=10, leading=17, textColor=INK)

def module_block(key):
    m = MODULES[key]
    # Header bar (name + clause) as a table with primary background
    hdr = Table([[Paragraph(m["name"], st_modname), Paragraph(m["clause"], st_clause)]],
                colWidths=[112*mm, 50*mm])
    hdr.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,-1),PRIMARY),
        ("VALIGN",(0,0),(-1,-1),"MIDDLE"),
        ("LEFTPADDING",(0,0),(0,0),10),("RIGHTPADDING",(1,0),(1,0),10),
        ("TOPPADDING",(0,0),(-1,-1),7),("BOTTOMPADDING",(0,0),(-1,-1),7),
        ("ALIGN",(1,0),(1,0),"RIGHT"),
        ("ROUNDEDCORNERS",[6,6,0,0]),
    ]))
    howto = ListFlowable(
        [ListItem(Paragraph(s, st_li), leftIndent=6, value=i+1) for i, s in enumerate(m["howTo"])],
        bulletType="1", bulletColor=SECONDARY, bulletFontName="Helvetica-Bold", leftIndent=14, spaceBefore=1)
    recs = ListFlowable(
        [ListItem(Paragraph(r, st_li_g), leftIndent=6) for r in m["recommendations"]],
        bulletType="bullet", bulletColor=HexColor("#F59E0B"), start="•", leftIndent=14, spaceBefore=1)
    body = [
        Paragraph(m["tagline"], st_tag),
        Paragraph(m["description"], st_desc),
        Paragraph("CÓMO USARLO", st_h), howto,
        Spacer(1, 4),
        Paragraph("RECOMENDACIONES", st_h), recs,
    ]
    inner = Table([[body]], colWidths=[162*mm])
    inner.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,-1),white),
        ("BOX",(0,0),(-1,-1),0.6,LINE),
        ("LEFTPADDING",(0,0),(-1,-1),12),("RIGHTPADDING",(0,0),(-1,-1),12),
        ("TOPPADDING",(0,0),(-1,-1),8),("BOTTOMPADDING",(0,0),(-1,-1),10),
    ]))
    return KeepTogether([hdr, inner, Spacer(1, 12)])

# ------------------------------- Portada + header/footer -------------------------------
def cover(c, doc):
    w, h = A4
    c.setFillColor(PRIMARY); c.rect(0, h-150*mm, w, 150*mm, fill=1, stroke=0)
    c.setFillColor(SECONDARY); c.rect(0, h-150*mm, w, 6*mm, fill=1, stroke=0)
    # logo sobre banda blanca
    c.setFillColor(white); c.roundRect(28*mm, h-70*mm, 70*mm, 26*mm, 4*mm, fill=1, stroke=0)
    try:
        c.drawImage(LOGO, 32*mm, h-66*mm, width=62*mm, height=18*mm, preserveAspectRatio=True, mask='auto')
    except Exception:
        pass
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 30); c.drawString(28*mm, h-105*mm, "Manual de Uso")
    c.setFont("Helvetica", 15); c.drawString(28*mm, h-116*mm, "Plataforma Auditorías en Línea")
    c.setFont("Helvetica", 10.5)
    c.drawString(28*mm, h-128*mm, "Sistema de Gestión Integrado — ISO 9001 · 14001 · 45001")
    # pie de portada
    c.setFillColor(INK)
    c.setFont("Helvetica", 9)
    c.drawString(28*mm, 24*mm, "Guía completa de módulos, cómo usarlos y recomendaciones.")
    c.setFillColor(GREY)
    c.drawString(28*mm, 18*mm, "Actualizado: %s   ·   Versión 1.0   ·   auditoriasenlinea.com.ar" % TODAY)

def later(c, doc):
    w, h = A4
    # header
    c.setFillColor(PRIMARY); c.rect(0, h-14*mm, w, 14*mm, fill=1, stroke=0)
    c.setFillColor(white); c.setFont("Helvetica-Bold", 9)
    c.drawString(20*mm, h-9.2*mm, "Auditorías en Línea")
    c.setFont("Helvetica", 8.5); c.setFillColor(HexColor("#BBD3EE"))
    c.drawRightString(w-20*mm, h-9.2*mm, "Manual de Uso de la Plataforma")
    # footer
    c.setStrokeColor(LINE); c.setLineWidth(0.6); c.line(20*mm, 14*mm, w-20*mm, 14*mm)
    c.setFillColor(GREY); c.setFont("Helvetica", 8)
    c.drawString(20*mm, 9*mm, "© %s Auditorías en Línea" % datetime.date.today().year)
    c.drawRightString(w-20*mm, 9*mm, "Página %d" % doc.page)

# ------------------------------- Documento -------------------------------
doc = BaseDocTemplate(OUT, pagesize=A4,
    leftMargin=20*mm, rightMargin=20*mm, topMargin=22*mm, bottomMargin=20*mm,
    title="Manual de Uso — Auditorías en Línea", author="Auditorías en Línea")
frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="main")
doc.addPageTemplates([
    PageTemplate(id="cover", frames=[frame], onPage=cover),
    PageTemplate(id="content", frames=[frame], onPage=later),
])

story = []
# pág 1 = portada (vacía de flowables salvo salto)
story.append(PageBreak())
story.append(Paragraph("content-start", S("hidden", fontSize=0.1, textColor=white)))

# Intro
story.append(Paragraph("Bienvenido/a", st_phase))
story.append(Paragraph(
    "Auditorías en Línea es una plataforma en la nube para gestionar tu Sistema de Gestión Integrado "
    "(ISO 9001, 14001 y 45001) de punta a punta: del diagnóstico inicial a la revisión por la dirección. "
    "Cada empresa trabaja en un espacio aislado y seguro. Este manual explica, módulo por módulo, para qué "
    "sirve, cómo usarlo y qué recomendaciones seguir para sacarle el máximo provecho.", st_body))
story.append(Spacer(1, 6))
story.append(Paragraph("Cómo está organizada la plataforma", st_h))
toc_rows = []
for i,(title, summary, keys) in enumerate(PHASES):
    toc_rows.append([Paragraph("<b>%s</b>" % title, st_toc), Paragraph(summary, st_toc)])
toc = Table(toc_rows, colWidths=[54*mm, 108*mm])
toc.setStyle(TableStyle([
    ("VALIGN",(0,0),(-1,-1),"TOP"),
    ("LINEBELOW",(0,0),(-1,-2),0.4,LINE),
    ("TOPPADDING",(0,0),(-1,-1),5),("BOTTOMPADDING",(0,0),(-1,-1),5),
]))
story.append(toc)
story.append(Paragraph(
    "<br/>La plataforma sigue el ciclo de mejora continua (Planificar → Hacer → Verificar → Actuar). "
    "Podés recorrer los módulos en este orden o entrar directo al que necesites.", st_body))
story.append(PageBreak())

# Fases y módulos
for title, summary, keys in PHASES:
    story.append(Paragraph(title, st_phase))
    story.append(Paragraph(summary, st_phase_sub))
    for k in keys:
        story.append(module_block(k))
    story.append(Spacer(1, 4))

# Cierre
story.append(Paragraph("Soporte", st_phase))
story.append(Paragraph(
    "¿Dudas o querés una demostración? Escribinos a <b>ventas@auditoriasenlinea.com.ar</b> o por WhatsApp "
    "al <b>+54 261 570-8516</b>. También podés reejecutar el «Tour de bienvenida» desde el Centro de Ayuda "
    "de la plataforma en cualquier momento.", st_body))

# Construcción: primera página usa plantilla 'cover', el resto 'content'
def on_first(c, d): pass
story2 = story
# Cambiamos de plantilla luego de la portada
from reportlab.platypus import NextPageTemplate
final = [NextPageTemplate("content")] + story2
doc.build(final)
print("OK ->", OUT)
