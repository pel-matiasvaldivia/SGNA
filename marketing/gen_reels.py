# -*- coding: utf-8 -*-
"""Genera el paquete de Reels de Auditorías en Línea:

 - guion-reels.md            guion de rodaje de cada reel (para grabar)
 - reels-n8n.csv             la misma tabla, para subir a Google Sheets
 - n8n-workflow-reels.json   workflow importable que los publica solo

Los guiones viven acá y no en el .xlsx a propósito: un reel se cambia en cada
grabación, y tenerlos en texto plano los hace diffeables y regenerables. El
.xlsx sigue siendo la fuente del calendario de posts estáticos.

El reel se publica desde una URL pública del video (la API de Instagram no
acepta subir el archivo en el mismo POST), así que la columna `VideoURL` es la
que hay que completar antes de que el workflow pueda publicar.
"""
import csv
import datetime
import json
import os
import uuid

HERE = os.path.dirname(os.path.abspath(__file__))
MD = os.path.join(HERE, "guion-reels.md")
RM = os.path.join(HERE, "README-reels.md")
CSV_OUT = os.path.join(HERE, "reels-n8n.csv")
WF = os.path.join(HERE, "n8n-workflow-reels.json")

# Lunes, miércoles y viernes: tres reels por semana, cuatro semanas.
INICIO = datetime.date(2026, 10, 12)   # lunes
DIAS_DE_PUBLICACION = (0, 2, 4)        # lun, mié, vie

HASHTAGS_BASE = "#AuditoríasEnLínea #ISO9001 #ISO45001 #SGI #Mendoza"
HASHTAGS_CONSULTOR = "#AuditoríasEnLínea #AuditorLíder #Consultoría #ISO9001 #Mendoza"

CTA_GENERAL = "Probala gratis en auditoriasenlinea.com.ar"
CTA_CONSULTOR = "Si auditás para otros, esto es para vos → auditoriasenlinea.com.ar"

# ---------------------------------------------------------------- los reels
# `gancho` son los primeros 3 segundos: si no frena el scroll, lo demás no
# existe. `planos` es la lista de tomas, en orden. `texto` es lo que va
# sobreimpreso (corto, legible sin audio: la mayoría mira sin sonido).
REELS = [
    {
        "id": "R01",
        "titulo": "Sin señal en planta",
        "audiencia": "Ambos",
        "pilar": "Producto / Función",
        "duracion": 28,
        "gancho": "«Acá adentro no hay señal.» Perfecto. Seguí auditando.",
        "planos": [
            "0-3s · Mano levantando el celular en un depósito, barra de señal en cero. Texto grande: SIN SEÑAL.",
            "3-9s · Primer plano del checklist en pantalla: el auditor toca «No conforme». La app responde normal.",
            "9-15s · Saca una foto del extintor sin etiqueta. La foto queda pegada al punto de control.",
            "15-21s · Sale al patio. Aparece el ícono de sincronización y el contador «3 en cola» baja a cero.",
            "21-28s · Plano de la notebook en la oficina: el hallazgo ya está en el informe. Logo + CTA.",
        ],
        "texto": [
            "SIN SEÑAL",
            "La auditoría sigue",
            "Foto y ubicación quedan en el celular",
            "Volvió el wifi → se sincroniza solo",
            "El informe ya está en la oficina",
        ],
        "voz": (
            "En una planta, un sótano o una obra sobre la ruta, no hay internet. "
            "Y la auditoría igual hay que hacerla. Respondé, sacá la foto, seguí. "
            "Cuando vuelve la señal, se sincroniza solo. No se pierde nada, y no "
            "hay que volver a cargar nada a mano."
        ),
        "copy": (
            "«Acá adentro no hay señal.»\n\n"
            "Es la frase que arruina media jornada de auditoría: el auditor anota en papel, "
            "vuelve a la oficina y pasa todo en limpio. Dos veces el mismo trabajo.\n\n"
            "La app de campo funciona sin conexión. Respuestas, fotos y ubicación quedan en "
            "el dispositivo y se sincronizan solas al reconectar."
        ),
    },
    {
        "id": "R02",
        "titulo": "No necesitás 21 módulos para auditar",
        "audiencia": "Ambos",
        "pilar": "Dolor → Solución",
        "duracion": 25,
        "gancho": "Abrís el software de gestión y te encontrás con esto.",
        "planos": [
            "0-3s · Scroll vertiginoso por un menú larguísimo de 22 ítems. Cara de agobio.",
            "3-8s · Congela. Texto: ¿VAS A USAR LOS 21?",
            "8-14s · Pantalla del asistente de alta: una sola pregunta, dos botones. El dedo toca «Vine a auditar».",
            "14-20s · El menú se achica a cinco secciones. Plano del menú corto, limpio.",
            "20-25s · Texto: Y si después querés todo, lo prendés. Logo + CTA.",
        ],
        "texto": [
            "22 módulos",
            "¿Vas a usar los 21?",
            "Una pregunta: ¿auditar o implementar?",
            "Cinco secciones. Nada más.",
            "Se amplía cuando vos quieras",
        ],
        "voz": (
            "Un sistema de gestión completo tiene veintiún módulos. Si viniste a "
            "hacer auditorías internas, no necesitás ver los otros dieciséis. "
            "Contestás una pregunta al entrar y la plataforma se recorta a lo que "
            "vas a usar. Y si mañana querés todo, lo prendés: no se pierde nada."
        ),
        "copy": (
            "El problema de los sistemas de gestión no es que les falten funciones. Es que "
            "te las muestran todas el primer día.\n\n"
            "Ahora elegís el alcance al crear la cuenta: **Auditorías** (cinco secciones, para "
            "ejecutar auditorías internas en cualquier industria) o **SGI Completo**.\n\n"
            "Pasás de una a la otra cuando quieras. Lo que se apaga es el acceso a las "
            "secciones, nunca la información que cargaste."
        ),
    },
    {
        "id": "R03",
        "titulo": "El auditor en el domicilio equivocado",
        "audiencia": "Consultores",
        "pilar": "Consultor / Partner",
        "duracion": 30,
        "gancho": "Mandaste a tu auditor… a la dirección de tu propia oficina.",
        "planos": [
            "0-4s · Auditor parado en la puerta de una oficina cerrada, mirando el celular. Texto: ACÁ NO ERA.",
            "4-10s · Pantalla: ficha de la empresa auditada con domicilio, actividad y referente.",
            "10-17s · El líder asigna la visita y elige al cliente en el selector. Los campos se completan solos.",
            "17-24s · Celular del auditor: tarjeta con domicilio, horario, «preguntar por Laura» y el botón del mapa.",
            "24-30s · Toca el mapa y se abre el pin exacto. Logo + CTA consultor.",
        ],
        "texto": [
            "ACÁ NO ERA",
            "Tu cartera de clientes, cargada una vez",
            "Elegís el cliente → se completa todo",
            "Domicilio, horario y a quién buscar",
            "El pin exacto, en el celular",
        ],
        "voz": (
            "Si auditás para otros, tus auditorías no son en tu oficina. Cargás cada "
            "empresa una sola vez —domicilio, actividad y referente— y de ahí en más "
            "cada visita sale con los datos del cliente. Tu equipo sabe a dónde ir, "
            "a qué hora y por quién preguntar."
        ),
        "copy": (
            "Durante años los sistemas de gestión asumieron lo mismo: que la empresa audita su "
            "propia casa.\n\n"
            "Para un consultor con quince clientes, eso significa mandar a su equipo al domicilio "
            "de su propio estudio.\n\n"
            "Cargás tu cartera una vez y cada visita sale con el domicilio, la actividad y el "
            "referente del cliente. Con el pin del mapa, para llegar y no dar vueltas."
        ),
    },
    {
        "id": "R04",
        "titulo": "Tu checklist de Excel, en 30 segundos",
        "audiencia": "Consultores",
        "pilar": "Consultor / Partner",
        "duracion": 24,
        "gancho": "Tenés tu checklist en Excel hace diez años. No lo tires.",
        "planos": [
            "0-4s · Planilla de Excel con cláusula y pregunta, scrolleando. Texto: ESTE ES TU CHECKLIST.",
            "4-10s · Arrastre del archivo a «Importar CSV». Aparece la vista previa con las filas reconocidas.",
            "10-16s · Zoom al aviso: «2 filas con problema: fila 7, fila 19». Texto: te dice cuáles, no rechaza todo.",
            "16-20s · Se guarda como plantilla. Aparece en el selector de la asignación.",
            "20-24s · Checklist ya cargado en el celular del auditor. Logo + CTA consultor.",
        ],
        "texto": [
            "Tu checklist de Excel",
            "Arrastrás el archivo",
            "Vista previa antes de guardar",
            "Queda como plantilla, se reutiliza",
            "Y sale al campo",
        ],
        "voz": (
            "Una bodega, una obra y una clínica no se auditan con la misma hoja. Por eso "
            "no te obligamos a usar un checklist ISO. Importás el tuyo desde Excel, lo ves "
            "en pantalla antes de guardar nada, y queda como plantilla para reutilizar."
        ),
        "copy": (
            "Excel en español guarda con punto y coma. Y con BOM. Y a veces sin encabezado.\n\n"
            "El importador reconoce el separador solo, acepta sinónimos de columna con o sin "
            "tildes, y si el archivo tiene dos filas mal armadas importa las otras noventa y "
            "ocho y te dice cuáles fallaron por número de fila.\n\n"
            "Porque rechazar cien filas por dos malas te obliga a adivinar cuáles son."
        ),
    },
    {
        "id": "R05",
        "titulo": "El hallazgo se escribe una sola vez",
        "audiencia": "Ambos",
        "pilar": "Producto / Función",
        "duracion": 29,
        "gancho": "Lo anotaste en el celular. ¿Ahora lo pasás a la planilla?",
        "planos": [
            "0-4s · Split: celular con la observación escrita / planilla de hallazgos vacía. Texto: ¿OTRA VEZ?",
            "4-11s · Celular: el auditor marca «No conforme» y elige «NC mayor».",
            "11-18s · Otro punto, conforme, y elige «Oportunidad de mejora».",
            "18-25s · Notebook: la planilla de Hallazgos / Desvíos ya tiene las dos filas, clasificadas.",
            "25-29s · Texto: solo las no conformidades abren acción correctiva. Logo + CTA.",
        ],
        "texto": [
            "¿Otra vez lo mismo?",
            "NC mayor o menor",
            "Observación · Oportunidad de mejora",
            "La planilla se llena sola",
            "Solo las NC abren acción correctiva",
        ],
        "voz": (
            "Un informe de auditoría no dice «cumple o no cumple». Distingue la no "
            "conformidad mayor de la menor, y las separa de la observación y de la "
            "oportunidad de mejora. El auditor lo califica en el celular y la planilla "
            "del informe se arma sola. Y una oportunidad de mejora no te abre una acción "
            "correctiva, porque no es un incumplimiento."
        ),
        "copy": (
            "El auditor escribe el hallazgo en el celular. Después alguien lo copia a la planilla "
            "de desvíos. Y después alguien lo vuelve a copiar al módulo de no conformidades.\n\n"
            "Tres veces el mismo texto, con tres oportunidades de que se pierda.\n\n"
            "Ahora se califica una vez en sitio —NC mayor, NC menor, observación u oportunidad "
            "de mejora— y el informe se arma solo. Solo los incumplimientos abren acción "
            "correctiva."
        ),
    },
    {
        "id": "R06",
        "titulo": "Firmá y andate",
        "audiencia": "Ambos",
        "pilar": "Dato / Beneficio",
        "duracion": 22,
        "gancho": "La auditoría terminó a las 13. ¿Cuándo sale el informe?",
        "planos": [
            "0-4s · Reloj marcando las 13:00. Texto: AUDITORÍA TERMINADA.",
            "4-9s · El auditor firma con el dedo en la pantalla del celular.",
            "9-15s · Se genera el PDF: resumen, hallazgos clasificados, fotos con fecha y lugar.",
            "15-19s · Comparación: «antes, 3 días» tachado / «ahora, mismo día».",
            "19-22s · Logo + CTA.",
        ],
        "texto": [
            "Terminó a las 13:00",
            "Firma en pantalla",
            "PDF con hallazgos y evidencia",
            "Antes: 3 días. Ahora: hoy.",
            "",
        ],
        "voz": (
            "El auditor firma en la pantalla y la auditoría se cierra. El informe sale "
            "ahí mismo, con los hallazgos clasificados y la evidencia fotográfica. "
            "No hay que volver a la oficina a pasar notas en limpio."
        ),
        "copy": (
            "El trabajo que más cuesta de una auditoría no es auditar. Es lo que viene después: "
            "pasar las notas, buscar las fotos, armar el informe.\n\n"
            "Firmás en pantalla al cerrar y el PDF sale solo, con los hallazgos y la evidencia. "
            "Listo para el legajo el mismo día."
        ),
    },
    {
        "id": "R07",
        "titulo": "¿Y ahora qué hago?",
        "audiencia": "Empresas",
        "pilar": "Producto / Función",
        "duracion": 23,
        "gancho": "Contrataste el sistema. Entrás. ¿Y ahora qué?",
        "planos": [
            "0-4s · Pantalla de inicio genérica de cualquier software, llena de widgets vacíos. Cara de duda.",
            "4-10s · Corte a nuestro Inicio: bloque «Requiere tu atención» con tres renglones concretos.",
            "10-16s · Bloque «Puesta en marcha»: los pasos que faltan, en orden.",
            "16-20s · Toca un renglón y entra directo al módulo donde se resuelve.",
            "20-23s · Logo + CTA.",
        ],
        "texto": [
            "¿Y ahora qué?",
            "Requiere tu atención",
            "Puesta en marcha: lo que falta",
            "Tocás y vas directo",
            "",
        ],
        "voz": (
            "La primera pantalla de la mayoría de los sistemas te explica el sistema. "
            "La nuestra te dice qué hacer: qué requiere tu atención hoy y qué paso te "
            "falta para terminar la puesta en marcha. Y si no hay nada pendiente, no "
            "inventa tarjetas vacías."
        ),
        "copy": (
            "Casi todos los sistemas de gestión arrancan explicándote el sistema.\n\n"
            "El Inicio de Auditorías en Línea mira el estado real de tu organización y arma dos "
            "listas: lo que requiere tu atención hoy y lo que falta para la puesta en marcha.\n\n"
            "Si las dos están vacías, estás al día. Eso también es una respuesta."
        ),
    },
    {
        "id": "R08",
        "titulo": "No conformidad, observación y oportunidad",
        "audiencia": "Ambos",
        "pilar": "Educativo / Norma",
        "duracion": 32,
        "gancho": "Tres cosas que todos mezclan en una auditoría.",
        "planos": [
            "0-4s · Tres tarjetas cayendo en pantalla, en rojo, ámbar y celeste.",
            "4-12s · Tarjeta roja: NO CONFORMIDAD. Texto: incumple un requisito. Ejemplo corto en pantalla.",
            "12-20s · Tarjeta ámbar: OBSERVACIÓN. Texto: todavía cumple, pero va camino a no cumplir.",
            "20-28s · Tarjeta celeste: OPORTUNIDAD DE MEJORA. Texto: cumple. Se puede hacer mejor.",
            "28-32s · Texto: solo la primera abre acción correctiva. Logo.",
        ],
        "texto": [
            "No conformidad ≠ observación ≠ OM",
            "NC: incumple un requisito",
            "Observación: cumple, pero con riesgo",
            "OM: cumple. Se puede hacer mejor.",
            "Solo la NC abre acción correctiva",
        ],
        "voz": (
            "No conformidad es incumplir un requisito: hay que corregirla y buscar la "
            "causa. Observación es algo que todavía cumple pero va camino a no cumplir. "
            "Oportunidad de mejora es algo que cumple y se puede hacer mejor. "
            "Mezclarlas infla el tablero de no conformidades con cosas que no lo son."
        ),
        "copy": (
            "Las tres salen de la misma auditoría y no significan lo mismo:\n\n"
            "🔴 **No conformidad** — incumple un requisito. Se corrige y se busca la causa.\n"
            "🟡 **Observación** — todavía cumple, pero va camino a no cumplir.\n"
            "🔵 **Oportunidad de mejora** — cumple. Se puede hacer mejor.\n\n"
            "Si las tratás a todas como no conformidades, tu tablero deja de decirte dónde está "
            "el problema real."
        ),
    },
    {
        "id": "R09",
        "titulo": "La carpeta que nadie encuentra",
        "audiencia": "Empresas",
        "pilar": "Dolor → Solución",
        "duracion": 26,
        "gancho": "El auditor externo pide una evidencia de hace ocho meses.",
        "planos": [
            "0-5s · Manos revolviendo una biblioteca de biblioratos. Texto: ¿DÓNDE ESTABA?",
            "5-10s · Corte a una carpeta compartida con 300 archivos llamados «final_v3_ok_FINAL».",
            "10-17s · Corte a la plataforma: buscador, un resultado, foto con fecha y ubicación.",
            "17-22s · Zoom a la versión vigente del documento y quién la aprobó.",
            "22-26s · Logo + CTA.",
        ],
        "texto": [
            "¿Dónde estaba?",
            "final_v3_ok_FINAL.pdf",
            "Buscás y aparece",
            "Con fecha, lugar y quién la aprobó",
            "",
        ],
        "voz": (
            "La evidencia no sirve si no aparece el día que la piden. Foto, fecha, lugar, "
            "quién respondió y qué versión del documento estaba vigente. Todo junto y "
            "buscable, el día de la auditoría externa."
        ),
        "copy": (
            "La pregunta más incómoda de una auditoría externa no es técnica. Es «¿me mostrás "
            "el registro de marzo?».\n\n"
            "Si la respuesta tarda veinte minutos, el problema no es el registro: es dónde vive.\n\n"
            "Cada evidencia queda con su fecha, su lugar, quién la cargó y qué versión del "
            "documento estaba vigente en ese momento."
        ),
    },
    {
        "id": "R10",
        "titulo": "Un auditor, quince clientes",
        "audiencia": "Consultores",
        "pilar": "Consultor / Partner",
        "duracion": 27,
        "gancho": "No hace falta ser una consultora grande para trabajar como una.",
        "planos": [
            "0-5s · Un auditor solo, en su escritorio, con el celular y una notebook.",
            "5-12s · Pantalla: lista de empresas auditadas, quince filas con su actividad.",
            "12-18s · Asigna tres visitas de la semana a dos auditores de su equipo.",
            "18-23s · Los tres informes saliendo, uno por cliente, con el nombre de cada empresa.",
            "23-27s · Texto: sin servidores, sin licencias por puesto. Logo + CTA consultor.",
        ],
        "texto": [
            "Un auditor solo",
            "Quince clientes en una cuenta",
            "Asignás a tu equipo",
            "Un informe por cliente",
            "Sin servidores ni licencias por puesto",
        ],
        "voz": (
            "Tu cartera entera vive en tu cuenta. Cargás los clientes, asignás las visitas "
            "a tu equipo y cada informe sale con el nombre de la empresa auditada. Sin "
            "instalar nada, sin una instalación por cliente y sin licencias por puesto."
        ),
        "copy": (
            "Un estudio de tres personas puede llevar quince clientes acá, cualquiera sea su "
            "actividad.\n\n"
            "Cartera de empresas auditadas, checklists propios importados de Excel, app de campo "
            "para tu equipo e informe firmado el mismo día.\n\n"
            "Nada que instalar, nada que mantener."
        ),
    },
    {
        "id": "R11",
        "titulo": "La foto que prueba algo",
        "audiencia": "Ambos",
        "pilar": "Dato / Beneficio",
        "duracion": 21,
        "gancho": "Una foto en el celular del auditor no prueba nada.",
        "planos": [
            "0-5s · Galería del celular con 200 fotos sueltas, sin contexto. Texto: ¿DE CUÁL AUDITORÍA ERA?",
            "5-12s · Corte: la foto tomada desde el punto de control. Queda pegada a la pregunta.",
            "12-17s · Zoom: fecha, hora y ubicación junto a la imagen.",
            "17-21s · La misma foto dentro del informe PDF. Logo + CTA.",
        ],
        "texto": [
            "¿De cuál auditoría era?",
            "La foto va pegada al punto de control",
            "Con fecha, hora y ubicación",
            "Y entra sola al informe",
            "",
        ],
        "voz": (
            "La diferencia entre una foto y una evidencia es el contexto. Acá la foto se "
            "toma desde el punto de control, queda pegada a la pregunta que responde, con "
            "fecha y ubicación, y entra sola al informe."
        ),
        "copy": (
            "Doscientas fotos sueltas en la galería del celular no son evidencia. Son doscientas "
            "fotos.\n\n"
            "Cada imagen se toma desde el punto de control que responde y queda con su fecha, su "
            "hora y su ubicación. El día que alguien pregunte, no hay que reconstruir nada."
        ),
    },
    {
        "id": "R12",
        "titulo": "Invitá a tu consultor adentro",
        "audiencia": "Empresas",
        "pilar": "Consultor / Partner",
        "duracion": 25,
        "gancho": "Tu consultor te manda el informe por mail. ¿Y en un año?",
        "planos": [
            "0-5s · Bandeja de entrada con un adjunto «informe_auditoria_final.pdf» perdido entre correos.",
            "5-11s · Pantalla: invitar usuario, elegir perfil acotado, enviar.",
            "11-17s · El consultor entrando y trabajando dentro del sistema del cliente.",
            "17-21s · El informe quedando en el módulo, al lado de la evidencia.",
            "21-25s · Texto: termina el contrato, desactivás el usuario, el trabajo se queda. Logo.",
        ],
        "texto": [
            "¿Dónde está el informe del año pasado?",
            "Invitalo con un perfil acotado",
            "Audita adentro de tu sistema",
            "El informe queda con tu evidencia",
            "Se va el consultor, queda el trabajo",
        ],
        "voz": (
            "Si contratás un consultor, invitalo a tu cuenta con un perfil acotado a lo que "
            "tiene que ver. Audita adentro de tu sistema y el informe queda donde vive tu "
            "evidencia. Cuando el contrato termina, desactivás el usuario y el trabajo hecho "
            "se queda con vos."
        ),
        "copy": (
            "El informe del consultor casi siempre termina igual: un PDF adjunto en un correo que "
            "nadie encuentra el año que viene.\n\n"
            "Invitalo a tu cuenta con un perfil acotado. Audita adentro de tu sistema, el informe "
            "queda junto a la evidencia, y cuando el contrato termina desactivás el usuario y el "
            "trabajo hecho se queda."
        ),
    },
]


def fechas(n):
    """Las primeras n fechas de publicación: lunes, miércoles y viernes."""
    salida, d = [], INICIO
    while len(salida) < n:
        if d.weekday() in DIAS_DE_PUBLICACION:
            salida.append(d)
        d += datetime.timedelta(days=1)
    return salida


DIAS_ES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
CAL = fechas(len(REELS))

# --------------------------------------------------------------- 1) guion .md
lineas = [
    "# Reels — Auditorías en Línea",
    "",
    f"Doce reels verticales (9:16, 1080×1920), de {min(r['duracion'] for r in REELS)} a "
    f"{max(r['duracion'] for r in REELS)} segundos, para Instagram, Facebook y TikTok.",
    "",
    "Tres por semana —lunes, miércoles y viernes— durante cuatro semanas. La tabla "
    "equivalente para automatizar está en `reels-n8n.csv`, y el workflow que los publica "
    "en `n8n-workflow-reels.json`.",
    "",
    "## Cómo grabarlos",
    "",
    "- **Los primeros 3 segundos son todo.** Si el gancho no frena el scroll, el resto no "
    "se ve. Arrancá por la imagen más incómoda, no por el logo.",
    "- **Se mira sin sonido.** Todo lo que importa va también como texto en pantalla. La "
    "voz en off es un refuerzo, no el canal principal.",
    "- **Grabá vertical y en el lugar real.** Una planta, un depósito, una obra. Una "
    "captura de pantalla sirve, pero el plano de contexto es lo que da credibilidad.",
    "- **Subtitulá siempre**, con el texto de la columna «voz en off».",
    "- **El CTA va hablado y escrito**, en los últimos 3 segundos.",
    "",
    "## Los doce reels",
    "",
]

for reel, fecha in zip(REELS, CAL):
    cta = CTA_CONSULTOR if reel["audiencia"] == "Consultores" else CTA_GENERAL
    lineas += [
        f"### {reel['id']} · {reel['titulo']}",
        "",
        f"**{fecha.strftime('%d/%m/%Y')} ({DIAS_ES[fecha.weekday()]}) · "
        f"{reel['duracion']}s · {reel['audiencia']} · {reel['pilar']}**",
        "",
        f"> **Gancho (0-3s):** {reel['gancho']}",
        "",
        "**Plano a plano**",
        "",
    ]
    lineas += [f"{i + 1}. {p}" for i, p in enumerate(reel["planos"])]
    lineas += ["", "**Texto en pantalla**", ""]
    lineas += [f"- {t}" for t in reel["texto"] if t]
    lineas += [
        "",
        "**Voz en off**",
        "",
        f"> {reel['voz']}",
        "",
        "**Copy de la publicación**",
        "",
        "```",
        reel["copy"],
        "",
        cta,
        "",
        HASHTAGS_CONSULTOR if reel["audiencia"] == "Consultores" else HASHTAGS_BASE,
        "```",
        "",
        "---",
        "",
    ]

with open(MD, "w", encoding="utf-8") as fh:
    fh.write("\n".join(lineas))
print("OK guion ->", MD)

# ---------------------------------------------------------------- 2) CSV
COLUMNAS = ["Id", "Fecha", "DiaSemana", "Titulo", "Audiencia", "Pilar", "DuracionSeg",
            "Gancho", "Guion", "TextoEnPantalla", "VozEnOff", "Copy", "CTA",
            "Hashtags", "Redes", "VideoURL", "Estado", "FechaPublicacion"]

with open(CSV_OUT, "w", newline="", encoding="utf-8") as fh:
    w = csv.writer(fh)
    w.writerow(COLUMNAS)
    for reel, fecha in zip(REELS, CAL):
        consultor = reel["audiencia"] == "Consultores"
        w.writerow([
            reel["id"],
            fecha.strftime("%d/%m/%Y"),
            DIAS_ES[fecha.weekday()],
            reel["titulo"],
            reel["audiencia"],
            reel["pilar"],
            reel["duracion"],
            reel["gancho"],
            "\n".join(reel["planos"]),
            " · ".join(t for t in reel["texto"] if t),
            reel["voz"],
            reel["copy"],
            CTA_CONSULTOR if consultor else CTA_GENERAL,
            HASHTAGS_CONSULTOR if consultor else HASHTAGS_BASE,
            "Instagram · Facebook · TikTok",
            "",   # VideoURL — se completa al subir el video grabado
            "",   # Estado
            "",   # FechaPublicacion
        ])
print("OK csv   ->", CSV_OUT)


# ------------------------------------------------------------- 3) workflow
def nid():
    return uuid.uuid4().hex[:16]


n_trig, n_read, n_pick, n_if = nid(), nid(), nid(), nid()
n_cont, n_wait, n_stat, n_ready = nid(), nid(), nid(), nid()
n_pub, n_mark, n_mail, n_err = nid(), nid(), nid(), nid()
n_note1, n_note2 = nid(), nid()

CODE_PICK = r"""// Elige el reel de HOY y arma el pie de la publicación.
//
// Un reel sin VideoURL todavía no está grabado: no se publica y no se marca,
// así que queda para cuando el archivo esté subido. Publicar un reel vacío es
// peor que no publicar nada.
const filas = $input.all();
const hoy = new Date().toLocaleDateString('es-AR', {
  day: '2-digit', month: '2-digit', year: 'numeric',
  timeZone: 'America/Argentina/Mendoza',
});

const pendiente = filas.find(f =>
  String(f.json.Fecha).trim() === hoy &&
  String(f.json.Estado || '').toLowerCase() !== 'publicado' &&
  String(f.json.VideoURL || '').trim() !== ''
);

if (!pendiente) { return []; }

const j = pendiente.json;
const caption = `${j.Copy}\n\n${j.CTA}\n\n${j.Hashtags}`;

return [{
  json: {
    ...j,
    caption,
    hoy,
    rowNumber: j.row_number,
  },
}];
"""

workflow = {
    "name": "Auditorías en Línea — Reels (Instagram)",
    "nodes": [
        {
            "parameters": {
                "rule": {"interval": [{"field": "cronExpression",
                                      "expression": "30 9 * * 1,3,5"}]}
            },
            "id": n_trig,
            "name": "Cada día 09:30 (lun/mié/vie)",
            "type": "n8n-nodes-base.scheduleTrigger",
            "typeVersion": 1.2,
            "position": [-460, 300],
        },
        {
            "parameters": {
                "operation": "read",
                "documentId": {"__rl": True, "value": "TU_GOOGLE_SHEET_ID", "mode": "id"},
                "sheetName": {"__rl": True, "value": "Reels", "mode": "name"},
                "options": {},
            },
            "id": n_read,
            "name": "Leer reels (Sheets)",
            "type": "n8n-nodes-base.googleSheets",
            "typeVersion": 4.5,
            "position": [-240, 300],
        },
        {
            "parameters": {"jsCode": CODE_PICK},
            "id": n_pick,
            "name": "Elegir reel de hoy",
            "type": "n8n-nodes-base.code",
            "typeVersion": 2,
            "position": [-20, 300],
        },
        {
            "parameters": {
                "conditions": {
                    "options": {"caseSensitive": True, "typeValidation": "loose"},
                    "conditions": [{
                        "id": nid(),
                        "leftValue": "={{ $json.VideoURL }}",
                        "rightValue": "",
                        "operator": {"type": "string", "operation": "notEmpty",
                                     "singleValue": True},
                    }],
                    "combinator": "and",
                },
                "options": {},
            },
            "id": n_if,
            "name": "¿Hay reel grabado?",
            "type": "n8n-nodes-base.if",
            "typeVersion": 2.2,
            "position": [200, 300],
        },
        {
            "parameters": {
                "method": "POST",
                "url": "=https://graph.facebook.com/v21.0/{{ $vars.IG_USER_ID }}/media",
                "sendQuery": True,
                "queryParameters": {"parameters": [
                    {"name": "media_type", "value": "REELS"},
                    {"name": "video_url", "value": "={{ $json.VideoURL }}"},
                    {"name": "caption", "value": "={{ $json.caption }}"},
                    {"name": "share_to_feed", "value": "true"},
                    {"name": "access_token", "value": "={{ $vars.IG_ACCESS_TOKEN }}"},
                ]},
                "options": {},
            },
            "id": n_cont,
            "name": "Crear contenedor (IG)",
            "type": "n8n-nodes-base.httpRequest",
            "typeVersion": 4.2,
            "position": [420, 220],
        },
        {
            "parameters": {"amount": 30, "unit": "seconds"},
            "id": n_wait,
            "name": "Esperar 30 s",
            "type": "n8n-nodes-base.wait",
            "typeVersion": 1.1,
            "position": [640, 220],
            "webhookId": nid(),
        },
        {
            "parameters": {
                "url": "=https://graph.facebook.com/v21.0/{{ $('Crear contenedor (IG)').item.json.id }}",
                "sendQuery": True,
                "queryParameters": {"parameters": [
                    {"name": "fields", "value": "status_code"},
                    {"name": "access_token", "value": "={{ $vars.IG_ACCESS_TOKEN }}"},
                ]},
                "options": {},
            },
            "id": n_stat,
            "name": "¿Terminó de procesar?",
            "type": "n8n-nodes-base.httpRequest",
            "typeVersion": 4.2,
            "position": [860, 220],
        },
        {
            # Instagram procesa el video de forma asíncrona, así que el estado
            # tiene tres desenlaces y no dos: listo, falló, o todavía no. Un IF
            # no alcanza —con ERROR quedaría girando para siempre—, por eso un
            # Switch con salida de respaldo que vuelve a esperar.
            "parameters": {
                "rules": {"values": [
                    {"conditions": {
                        "options": {"caseSensitive": True, "typeValidation": "loose"},
                        "combinator": "and",
                        "conditions": [{
                            "id": nid(),
                            "leftValue": "={{ $json.status_code }}",
                            "rightValue": "FINISHED",
                            "operator": {"type": "string", "operation": "equals"},
                        }],
                     },
                     "outputKey": "listo"},
                    {"conditions": {
                        "options": {"caseSensitive": True, "typeValidation": "loose"},
                        "combinator": "and",
                        "conditions": [{
                            "id": nid(),
                            "leftValue": "={{ $json.status_code }}",
                            "rightValue": "ERROR",
                            "operator": {"type": "string", "operation": "equals"},
                        }],
                     },
                     "outputKey": "error"},
                ]},
                "options": {"fallbackOutput": "extra", "renameFallbackOutput": "procesando"},
            },
            "id": n_ready,
            "name": "Estado del video",
            "type": "n8n-nodes-base.switch",
            "typeVersion": 3.2,
            "position": [1080, 220],
        },
        {
            "parameters": {
                "sendTo": "marketing@auditoriasenlinea.com.ar",
                "subject": "=Falló el procesado del reel {{ $('Elegir reel de hoy').item.json.Id }}",
                "emailType": "text",
                "message": ("=Instagram rechazó el video de "
                            "{{ $('Elegir reel de hoy').item.json.Titulo }}.\n\n"
                            "La fila NO se marcó como publicada, así que el reel sigue "
                            "pendiente. Revisá que el video sea MP4 (H.264/AAC), vertical "
                            "9:16, de menos de 90 segundos, y que la URL sea pública."),
                "options": {},
            },
            "id": n_err,
            "name": "Avisar que falló",
            "type": "n8n-nodes-base.gmail",
            "typeVersion": 2.1,
            "position": [1300, 320],
        },
        {
            "parameters": {
                "method": "POST",
                "url": "=https://graph.facebook.com/v21.0/{{ $vars.IG_USER_ID }}/media_publish",
                "sendQuery": True,
                "queryParameters": {"parameters": [
                    {"name": "creation_id",
                     "value": "={{ $('Crear contenedor (IG)').item.json.id }}"},
                    {"name": "access_token", "value": "={{ $vars.IG_ACCESS_TOKEN }}"},
                ]},
                "options": {},
            },
            "id": n_pub,
            "name": "Publicar reel",
            "type": "n8n-nodes-base.httpRequest",
            "typeVersion": 4.2,
            "position": [1300, 140],
        },
        {
            "parameters": {
                "operation": "update",
                "documentId": {"__rl": True, "value": "TU_GOOGLE_SHEET_ID", "mode": "id"},
                "sheetName": {"__rl": True, "value": "Reels", "mode": "name"},
                "columns": {
                    "mappingMode": "defineBelow",
                    "value": {
                        "row_number": "={{ $('Elegir reel de hoy').item.json.rowNumber }}",
                        "Estado": "Publicado",
                        "FechaPublicacion": "={{ $now.format('dd/MM/yyyy HH:mm') }}",
                    },
                    "matchingColumns": ["row_number"],
                },
                "options": {},
            },
            "id": n_mark,
            "name": "Marcar como Publicado",
            "type": "n8n-nodes-base.googleSheets",
            "typeVersion": 4.5,
            "position": [1520, 140],
        },
        {
            "parameters": {
                "sendTo": "marketing@auditoriasenlinea.com.ar",
                "subject": "=Reel publicado: {{ $('Elegir reel de hoy').item.json.Titulo }}",
                "emailType": "text",
                "message": "={{ $('Elegir reel de hoy').item.json.caption }}",
                "options": {},
            },
            "id": n_mail,
            "name": "Avisar al equipo",
            "type": "n8n-nodes-base.gmail",
            "typeVersion": 2.1,
            "position": [1740, 140],
        },
        {
            "parameters": {
                "width": 420, "height": 260,
                "content": (
                    "## Antes de activarlo\n\n"
                    "1. Subí `reels-n8n.csv` a Google Sheets, pestaña **Reels**.\n"
                    "2. Reemplazá `TU_GOOGLE_SHEET_ID` en los dos nodos de Sheets.\n"
                    "3. Variables: `IG_USER_ID` y `IG_ACCESS_TOKEN`.\n"
                    "4. Completá la columna **VideoURL** con el enlace público\n"
                    "   del video de cada reel: sin eso no se publica."
                ),
            },
            "id": n_note1,
            "name": "Nota — instalación",
            "type": "n8n-nodes-base.stickyNote",
            "typeVersion": 1,
            "position": [-460, -40],
        },
        {
            "parameters": {
                "width": 420, "height": 220,
                "content": (
                    "## El video se procesa aparte\n\n"
                    "Instagram no publica el reel en el mismo pedido: crea un\n"
                    "contenedor, lo procesa y recién ahí se publica. Por eso el\n"
                    "ciclo **esperar → consultar estado**: si todavía no está\n"
                    "`FINISHED`, vuelve a esperar. Si da `ERROR`, el flujo corta\n"
                    "y la fila NO se marca como publicada."
                ),
            },
            "id": n_note2,
            "name": "Nota — por qué el ciclo",
            "type": "n8n-nodes-base.stickyNote",
            "typeVersion": 1,
            "position": [640, -40],
        },
    ],
    "connections": {
        "Cada día 09:30 (lun/mié/vie)": {"main": [[{"node": "Leer reels (Sheets)", "type": "main", "index": 0}]]},
        "Leer reels (Sheets)": {"main": [[{"node": "Elegir reel de hoy", "type": "main", "index": 0}]]},
        "Elegir reel de hoy": {"main": [[{"node": "¿Hay reel grabado?", "type": "main", "index": 0}]]},
        "¿Hay reel grabado?": {"main": [
            [{"node": "Crear contenedor (IG)", "type": "main", "index": 0}],
            [],
        ]},
        "Crear contenedor (IG)": {"main": [[{"node": "Esperar 30 s", "type": "main", "index": 0}]]},
        "Esperar 30 s": {"main": [[{"node": "¿Terminó de procesar?", "type": "main", "index": 0}]]},
        "¿Terminó de procesar?": {"main": [[{"node": "Estado del video", "type": "main", "index": 0}]]},
        # Tres salidas: listo publica, error avisa y corta, y cualquier otra
        # cosa vuelve a esperar. Ese tercer camino es el ciclo de espera.
        "Estado del video": {"main": [
            [{"node": "Publicar reel", "type": "main", "index": 0}],
            [{"node": "Avisar que falló", "type": "main", "index": 0}],
            [{"node": "Esperar 30 s", "type": "main", "index": 0}],
        ]},
        "Publicar reel": {"main": [[{"node": "Marcar como Publicado", "type": "main", "index": 0}]]},
        "Marcar como Publicado": {"main": [[{"node": "Avisar al equipo", "type": "main", "index": 0}]]},
    },
    "active": False,
    "settings": {"executionOrder": "v1", "timezone": "America/Argentina/Mendoza"},
    "pinData": {},
    "meta": {"instanceId": "auditorias-en-linea-reels"},
}

with open(WF, "w", encoding="utf-8") as fh:
    json.dump(workflow, fh, ensure_ascii=False, indent=2)
print("OK n8n   ->", WF)


# ---------------------------------------------------------------- 4) README
readme = f"""# Reels — guion y publicación automática

Doce reels verticales para Instagram, Facebook y TikTok, con su guion de rodaje
y un workflow de n8n que los publica solos.

## Archivos
- `guion-reels.md` — el guion de cada reel: gancho, plano a plano, texto en
  pantalla, voz en off y copy de la publicación. Es lo que se lleva a grabar.
- `reels-n8n.csv` — la misma tabla, para subir a Google Sheets.
- `n8n-workflow-reels.json` — workflow importable en n8n.
- `gen_reels.py` — genera los tres. **Los guiones se editan acá**, no en los
  archivos de salida: si los tocás a mano, el próximo `python gen_reels.py` los
  pisa.

## Lo que hay que hacer a mano

El workflow publica, no graba. Falta un paso humano en el medio:

1. **Grabar los doce reels** siguiendo `guion-reels.md`. Vertical 9:16
   (1080×1920), MP4 con video H.264 y audio AAC, menos de 90 segundos.
2. **Subirlos a una URL pública** (un bucket, el propio servidor, Drive con
   enlace directo). La API de Instagram descarga el archivo desde esa URL: no
   acepta que se lo subas en el mismo pedido.
3. **Pegar cada enlace** en la columna `VideoURL` de la hoja.

Un reel sin `VideoURL` no se publica y **tampoco se marca como publicado**, así
que queda esperando a que el archivo esté. Publicar un reel vacío es peor que
no publicar nada.

## Instalación en n8n

1. **Google Sheets** — subí `reels-n8n.csv` a una hoja nueva y renombrá la
   pestaña a **Reels** (así la busca el workflow). Copiá el ID de la hoja: está
   en la URL, entre `/d/` y `/edit`.
2. **Importar** — en n8n: *Workflows → Import from File* → el `.json`.
3. **Pegar el ID** — en los nodos *Leer reels (Sheets)* y *Marcar como
   Publicado*, reemplazá `TU_GOOGLE_SHEET_ID`.
4. **Credenciales** — Google Sheets (OAuth2) y Gmail (o cambialo por SMTP).
5. **Variables** (*Settings → Variables*):
   - `IG_USER_ID` — el ID de la cuenta de Instagram **profesional** vinculada a
     tu página de Facebook.
   - `IG_ACCESS_TOKEN` — token de larga duración con `instagram_basic`,
     `instagram_content_publish` y `pages_read_engagement`.
6. **Probar** con *Execute Workflow* sobre una fila con `VideoURL` cargada, y
   recién después activarlo.

## Cómo funciona

```
Lun/mié/vie 09:30  →  Leer reels (Sheets)  →  Elegir el de hoy
   →  ¿Tiene video?  →  Crear contenedor en Instagram
   →  Esperar 30 s  →  ¿Terminó de procesar?
        ├─ FINISHED  →  Publicar  →  Marcar fila  →  Avisar al equipo
        ├─ ERROR     →  Avisar que falló (la fila NO se marca)
        └─ otro      →  volver a esperar
```

Ese ciclo no es un rodeo: Instagram no publica el reel en el mismo pedido.
Primero crea un contenedor, lo procesa por su cuenta y recién cuando está
`FINISHED` se puede publicar. Por eso el flujo consulta el estado hasta que
termina, y corta si da `ERROR` en vez de reintentar para siempre.

## Límites conocidos

- **Solo Instagram.** Los reels de Facebook usan otra API (`/video_reels`, con
  subida en tres pasos) y TikTok exige su propia app aprobada. Para esas dos
  redes, por ahora, la publicación es manual.
- **Instagram limita a 50 publicaciones por día** por cuenta vía API. Con tres
  reels por semana sobra, pero conviene saberlo si se suman las piezas
  estáticas al mismo token.
- **El workflow no graba ni edita video.** Si más adelante querés automatizar
  también el armado, el lugar donde entra es entre *Elegir reel de hoy* y
  *Crear contenedor*: un nodo HTTP contra el servicio de render que uses,
  devolviendo la URL del MP4.
- **Zona horaria**: el workflow viene con `America/Argentina/Mendoza`. Si tu
  instancia de n8n corre en UTC, verificá que el disparador caiga a las 09:30
  locales.
"""
with open(RM, "w", encoding="utf-8") as fh:
    fh.write(readme)
print("OK readme ->", RM)
