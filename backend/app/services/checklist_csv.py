# -*- coding: utf-8 -*-
"""
Importar y exportar plantillas de checklist como CSV.

Por qué existe: hasta acá una plantilla solo podía nacer de una asignación ya
cargada, pregunta por pregunta en el navegador. Un auditor que llega con su
checklist de treinta puntos en una planilla —que es como trabaja la mayoría—
tenía que tipearlo entero, y un checklist de otra actividad que no fuera ISO
9001 no tenía por dónde entrar. Esta es la puerta.

Las decisiones de acá salen de cómo son los archivos reales, no de cómo
deberían ser:

- **El separador se detecta.** Excel en español guarda CSV con punto y coma,
  porque la coma es el separador decimal. Exigir coma habría rechazado el
  archivo que produce el Excel de la mayoría de los usuarios.
- **Se acepta el archivo sin encabezado.** Mucha gente pega dos columnas y
  listo. Si la primera fila no parece un encabezado, se toma como datos.
- **Los nombres de columna tienen sinónimos y se comparan sin acentos.**
  «cláusula», «clausula», «punto» y «requisito» son la misma columna; que un
  archivo se rechace por una tilde sería absurdo.
- **Un archivo con errores importa igual lo que se pueda.** Se devuelven los
  problemas por número de fila, en vez de rechazar las cien filas por dos
  malas. Lo que no tiene pregunta no se puede importar; todo lo demás sí.
- **El export lleva BOM.** Sin él, Excel en Windows abre el UTF-8 como latin-1
  y el archivo aparece con «Ã³» en vez de «ó».
"""
import csv
import io
import unicodedata

# Columnas que entiende el importador. La clave es el nombre canónico; los
# valores son las formas en que la gente las escribe.
_ALIAS = {
    "clausula": ("clausula", "clausulas", "punto", "puntos", "requisito", "requisitos",
                 "codigo", "ref", "referencia", "norma", "item n", "nro", "n"),
    "pregunta": ("pregunta", "preguntas", "consulta", "verificacion", "verificar",
                 "descripcion", "detalle", "item", "items", "texto", "control"),
    "modulo": ("modulo", "modulos", "bloque", "seccion", "area", "proceso", "capitulo"),
    "evidencia": ("evidencia", "evidencias", "evidencia solicitada", "registro",
                  "registros", "soporte", "documento"),
}

# Encabezado del archivo que genera la exportación.
_CABECERA = ["clausula", "pregunta", "modulo", "evidencia"]

MAX_ITEMS = 500
MAX_LARGO_PREGUNTA = 2000


def _sin_acentos(texto: str) -> str:
    base = unicodedata.normalize("NFKD", (texto or "").strip().lower())
    return "".join(c for c in base if not unicodedata.combining(c))


def _canonica(nombre: str):
    """Nombre canónico de una columna, o None si no se reconoce."""
    limpio = _sin_acentos(nombre).strip().strip('"').replace(".", "").replace("_", " ")
    limpio = " ".join(limpio.split())
    for canonica, formas in _ALIAS.items():
        if limpio in formas:
            return canonica
    return None


def _delimitador(texto: str) -> str:
    """
    Separador del archivo. Se mira la primera línea no vacía y gana el que más
    aparezca; con empate o ninguno, la coma, que es el caso estándar.
    """
    for linea in texto.splitlines():
        if linea.strip():
            cuentas = {d: linea.count(d) for d in (";", ",", "\t", "|")}
            mejor = max(cuentas, key=lambda d: cuentas[d])
            return mejor if cuentas[mejor] > 0 else ","
    return ","


def _es_encabezado(fila) -> bool:
    """¿La primera fila nombra columnas, o ya son datos?"""
    reconocidas = sum(1 for celda in fila if _canonica(celda))
    return reconocidas >= 1 and any(_canonica(c) == "pregunta" for c in fila)


def parsear_csv(texto: str):
    """
    Convierte el contenido de un CSV en ítems de plantilla.

    Devuelve `(items, problemas)`. `items` son dicts listos para guardar
    —clausula, pregunta, orden, modulo, evidencia—; `problemas` es una lista de
    textos en castellano, cada uno con el número de fila del archivo, para que
    quien importa sepa exactamente qué revisar.
    """
    problemas = []
    if not (texto or "").strip():
        return [], ["El archivo está vacío."]

    # El BOM que escribe Excel entra como primer carácter y arruinaría el
    # nombre de la primera columna.
    texto = texto.lstrip("﻿")

    delimitador = _delimitador(texto)
    filas = list(csv.reader(io.StringIO(texto), delimiter=delimitador))
    filas = [f for f in filas if any((c or "").strip() for c in f)]
    if not filas:
        return [], ["El archivo no tiene ninguna fila con contenido."]

    if _es_encabezado(filas[0]):
        columnas = [_canonica(c) for c in filas[0]]
        cuerpo = filas[1:]
        desconocidas = [c.strip() for c, k in zip(filas[0], columnas) if c.strip() and k is None]
        if desconocidas:
            problemas.append(
                "Se ignoraron columnas que no se reconocen: " + ", ".join(desconocidas) + ".")
        primera_fila_archivo = 2
    else:
        # Sin encabezado: el orden natural con que la gente arma dos o tres
        # columnas es cláusula, pregunta, módulo, evidencia.
        #
        # Y se avisa. Un archivo de dos columnas sin encabezado es
        # estructuralmente indistinguible de cualquier otra tabla de dos
        # columnas —una lista de contactos entra igual que un checklist—, así
        # que no hay forma de rechazarla sin rechazar también el caso legítimo,
        # que es frecuente. Lo que sí se puede es decir en voz alta qué
        # interpretación se usó, para que quien importa lo vea en la vista
        # previa antes de confirmar.
        columnas = _CABECERA[: len(filas[0])]
        cuerpo = filas
        primera_fila_archivo = 1
        # Con una sola columna no se llega a avisar nada: abajo falta la
        # columna de preguntas y se corta con un mensaje más útil que este.
        problemas.append(
            "El archivo no trae encabezado: se tomó la primera columna como cláusula y la "
            "segunda como pregunta. Si no es así, agregá una fila «clausula;pregunta»."
        )

    if "pregunta" not in [c for c in columnas if c]:
        return [], [
            "No se encontró la columna de preguntas. Poné un encabezado con "
            "«pregunta» (o «clausula;pregunta»), o dejá la pregunta en la segunda columna."
        ]

    items = []
    for i, fila in enumerate(cuerpo):
        nro = primera_fila_archivo + i
        valores = {}
        for columna, celda in zip(columnas, fila):
            if columna:
                valores[columna] = (celda or "").strip()

        pregunta = valores.get("pregunta", "")
        if not pregunta:
            problemas.append(f"Fila {nro}: sin pregunta, no se importó.")
            continue
        if len(pregunta) > MAX_LARGO_PREGUNTA:
            problemas.append(
                f"Fila {nro}: la pregunta supera los {MAX_LARGO_PREGUNTA} caracteres y se recortó.")
            pregunta = pregunta[:MAX_LARGO_PREGUNTA]

        if len(items) >= MAX_ITEMS:
            problemas.append(
                f"El archivo tiene más de {MAX_ITEMS} preguntas; se importaron las primeras "
                f"{MAX_ITEMS} y el resto quedó afuera.")
            break

        items.append({
            "clausula": valores.get("clausula", "")[:100],
            "pregunta": pregunta,
            "orden": len(items) + 1,
            "modulo": (valores.get("modulo") or None),
            "evidencia": (valores.get("evidencia") or None),
        })

    if not items:
        problemas.append("No se pudo importar ninguna pregunta.")
    return items, problemas


def a_csv(items) -> str:
    """
    Serializa los ítems de una plantilla a CSV, con BOM para que Excel lo abra
    con los acentos correctos y con el mismo encabezado que acepta el
    importador: lo que sale se puede volver a entrar sin tocar nada.
    """
    salida = io.StringIO()
    escritor = csv.writer(salida, delimiter=";", lineterminator="\r\n")
    escritor.writerow(_CABECERA)
    for it in items or []:
        escritor.writerow([
            (it.get("clausula") or ""),
            (it.get("pregunta") or ""),
            (it.get("modulo") or ""),
            (it.get("evidencia") or ""),
        ])
    return "﻿" + salida.getvalue()
