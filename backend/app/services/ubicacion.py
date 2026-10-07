# -*- coding: utf-8 -*-
"""
Ubicación de una auditoría de campo: domicilio efectivo y pin de mapa.

El auditor de campo necesita dos cosas antes de salir: la dirección escrita
—para leerla, dictarla por teléfono o anotarla— y un enlace que abra el mapa
del celular en ese punto. Esto resuelve las dos, y resuelve además de dónde
sale cada dato cuando la asignación no lo trae.
"""
from __future__ import annotations

from urllib.parse import quote


def direccion_efectiva(lugar_direccion: str | None, domicilio_tenant: str | None) -> str | None:
    """
    Domicilio donde se audita.

    Manda el de la asignación (una sede, una obra, un depósito); si no está, se
    usa el de la organización, que es el caso habitual: la auditoría se hace en
    la empresa. Un campo cargado con espacios cuenta como vacío, para que una
    tecla suelta no tape el domicilio de la organización.
    """
    de_la_asignacion = (lugar_direccion or "").strip()
    if de_la_asignacion:
        return de_la_asignacion
    del_tenant = (domicilio_tenant or "").strip()
    return del_tenant or None


def url_de_mapa(direccion: str | None, lat: float | None = None,
                lng: float | None = None) -> str | None:
    """
    Enlace que abre el punto en el mapa del dispositivo.

    Se usa la URL universal de Google Maps porque la abren tanto Android como
    iOS —y en la computadora cae en el navegador—, sin depender de que haya una
    app concreta instalada.

    Las coordenadas tienen prioridad sobre el texto: cuando están, el pin cae
    en el punto exacto y no en lo que el buscador haya interpretado del
    domicilio. Sin coordenadas y sin domicilio no hay enlace: antes que mandar
    al auditor a un mapa vacío, la pantalla muestra que falta el dato.
    """
    if lat is not None and lng is not None:
        return f"https://www.google.com/maps/search/?api=1&query={lat},{lng}"
    texto = (direccion or "").strip()
    if not texto:
        return None
    return f"https://www.google.com/maps/search/?api=1&query={quote(texto, safe='')}"


def jornada_legible(hora_inicio: str | None, hora_fin: str | None) -> str | None:
    """
    Horario de la visita como se muestra: "09:00 a 13:00 hs", o sólo "desde las
    09:00 hs" cuando no se acordó la hora de cierre.
    """
    desde = (hora_inicio or "").strip()
    hasta = (hora_fin or "").strip()
    if desde and hasta:
        return f"{desde} a {hasta} hs"
    if desde:
        return f"desde las {desde} hs"
    if hasta:
        return f"hasta las {hasta} hs"
    return None
