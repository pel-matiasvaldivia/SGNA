# -*- coding: utf-8 -*-
"""
Identificador corto y estable de una organización.

El slug no es decorativo: con él se arman el schema de Postgres
(`tenant_{slug}`) y el bucket de archivos (`tenant-{slug}`). Un slug que
parece inofensivo pero termina en guion, se pasa de largo o queda vacío no
rompe en el alta —se guarda igual— sino después, cuando alguien intenta subir
el primer archivo y el almacenamiento rechaza el nombre del bucket con un
error que no menciona de dónde salió.
"""
import re
import unicodedata

LARGO_MAXIMO = 48  # deja lugar para "tenant-" y para el sufijo de desempate


def generar_slug(nombre: str, largo_maximo: int = LARGO_MAXIMO) -> str:
    """
    Convierte el nombre de una organización en un slug utilizable.

    Las tildes se transliteran en vez de borrarse: «Viñedos» da «vinedos» y no
    «viedos», que no se parece a nada. El resultado siempre empieza y termina
    en letra o dígito, no supera `largo_maximo`, y si el nombre no deja ni un
    carácter aprovechable (por ejemplo, escrito en otro alfabeto) devuelve
    cadena vacía para que quien llama decida: acá no se inventa un nombre.
    """
    base = unicodedata.normalize("NFKD", nombre or "")
    base = base.replace("ñ", "n").replace("Ñ", "N")
    base = "".join(c for c in base if not unicodedata.combining(c))
    base = base.lower()
    base = re.sub(r"[^a-z0-9]+", "-", base)
    base = re.sub(r"-{2,}", "-", base).strip("-")
    if len(base) > largo_maximo:
        base = base[:largo_maximo].rstrip("-")
    return base


def slug_disponible(base: str, existe, largo_maximo: int = LARGO_MAXIMO) -> str:
    """
    Primer slug libre a partir de `base`, probando `base-2`, `base-3`, …

    `existe` es una función que dice si un slug ya está tomado. El intento
    anterior agregaba «-1» una sola vez, así que la tercera organización con
    el mismo nombre reventaba con un error de clave única en medio del alta.
    """
    if not base:
        raise ValueError("El nombre de la organización no deja ningún carácter utilizable.")
    if not existe(base):
        return base
    for n in range(2, 1000):
        sufijo = f"-{n}"
        candidato = base[: largo_maximo - len(sufijo)].rstrip("-") + sufijo
        if not existe(candidato):
            return candidato
    raise ValueError("No se pudo derivar un identificador libre para esa organización.")
