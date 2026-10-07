"""
Contenido base del Plan de Auditoría.

Cuando se crea un programa, el sistema arma el plan solo: código, fechas,
criterios y un cronograma de jornada ya cargado. La idea es que el auditor
líder empiece corrigiendo un borrador —horarios, responsables, procesos
propios de la organización— en vez de armar la grilla desde cero.

El cronograma de ISO 9001 sigue la secuencia habitual de una auditoría
interna de un día: apertura, sistema y documentación, dirección, procesos
operativos, soporte y cierre (ISO 19011, 6.3.2).

Para las demás normas se deja una jornada genérica a propósito. Inventar un
cronograma detallado de ISO 14001 o 45001 sería adivinar los procesos de cada
organización; preferimos cuatro bloques evidentes que el líder completa.
"""

from datetime import date


# Fila: desde, hasta, actividad, detalle, requisitos, responsables.
CRONOGRAMA_ISO_9001 = [
    {
        "desde": "09:00", "hasta": "09:15",
        "actividad": "Reunión de Apertura",
        "detalle": "Presentación del plan, alcance y metodología.",
        "requisitos": "ISO 19011 (6.4.3)",
        "responsables": "Responsable del SGC, Dirección / Gerencia, Auditor Líder.",
    },
    {
        "desde": "09:15", "hasta": "09:30",
        "actividad": "Gestión del SGC y Control Documental",
        "detalle": "Estructura documental y procedimientos de gestión.",
        "requisitos": "Cap. 4, 6, 7.5, 9.2, 10",
        "responsables": "Responsable del SGC, Control Documental.",
    },
    {
        "desde": "09:30", "hasta": "10:15",
        "actividad": "Dirección, Liderazgo y Contexto",
        "detalle": "Estrategia, política, objetivos y revisión por la dirección.",
        "requisitos": "Cap. 4.1, 4.2, 5.1, 5.2, 6.2, 9.3",
        "responsables": "Dirección / Gerencia, Responsable del SGC.",
    },
    {
        "desde": "10:15", "hasta": "11:00",
        "actividad": "Proceso Comercial",
        "detalle": "Requisitos del cliente, contratación y satisfacción.",
        "requisitos": "Cap. 8.2 (Requisitos), 9.1.2 (Satisfacción)",
        "responsables": "Gerencia Comercial.",
    },
    {
        "desde": "11:00", "hasta": "11:45",
        "actividad": "Operaciones",
        "detalle": "Prestación del servicio, equipamiento y mantenimiento.",
        "requisitos": "Cap. 8.1, 8.5 (Prestación), 8.7 (Salidas NC), 7.1.5 (Equipos)",
        "responsables": "Gerencia de Operaciones.",
    },
    {
        "desde": "11:45", "hasta": "12:15",
        "actividad": "Abastecimiento y Compras",
        "detalle": "Evaluación de proveedores e insumos/repuestos.",
        "requisitos": "Cap. 8.4 (Proveedores y Compras)",
        "responsables": "Gerencia de Abastecimiento, Responsable de Compras.",
    },
    {
        "desde": "12:15", "hasta": "12:45",
        "actividad": "Recursos Humanos y Soporte",
        "detalle": "Competencia, capacitaciones y administración.",
        "requisitos": "Cap. 7.1.2, 7.2 (Competencia), 7.3 (Conciencia)",
        "responsables": "Responsable de RRHH, Administración y Finanzas.",
    },
    {
        "desde": "12:45", "hasta": "13:00",
        "actividad": "Reunión de Cierre",
        "detalle": "Informe preliminar de hallazgos y conclusiones.",
        "requisitos": "ISO 19011 (6.4.9)",
        "responsables": "Responsable del SGC, Dirección, Gerencias, Equipo Auditor.",
    },
]

CRONOGRAMA_GENERICO = [
    {
        "desde": "09:00", "hasta": "09:15",
        "actividad": "Reunión de Apertura",
        "detalle": "Presentación del plan, alcance y metodología.",
        "requisitos": "ISO 19011 (6.4.3)",
        "responsables": "Responsable del SGI, Dirección / Gerencia, Auditor Líder.",
    },
    {
        "desde": "09:15", "hasta": "10:00",
        "actividad": "Sistema de gestión y documentación",
        "detalle": "Información documentada, auditorías internas y mejora.",
        "requisitos": "Cap. 4, 7.5, 9.2, 10",
        "responsables": "Responsable del SGI, Control Documental.",
    },
    {
        "desde": "10:00", "hasta": "12:30",
        "actividad": "Procesos operativos",
        "detalle": "Recorrido por los procesos incluidos en el alcance.",
        "requisitos": "Cap. 8",
        "responsables": "Responsables de cada proceso.",
    },
    {
        "desde": "12:30", "hasta": "13:00",
        "actividad": "Reunión de Cierre",
        "detalle": "Informe preliminar de hallazgos y conclusiones.",
        "requisitos": "ISO 19011 (6.4.9)",
        "responsables": "Responsable del SGI, Dirección, Gerencias, Equipo Auditor.",
    },
]

CRITERIOS_POR_NORMA = {
    "ISO 9001": (
        "Norma ISO 9001:2015, Norma ISO 19011: Directrices para la auditoría de "
        "los sistemas de gestión de la calidad, mapa de procesos, información "
        "documentada del SGC y legislación aplicable."
    ),
    "ISO 14001": (
        "Norma ISO 14001:2015, Norma ISO 19011, matriz de aspectos e impactos "
        "ambientales, información documentada del SGA y legislación ambiental "
        "aplicable."
    ),
    "ISO 45001": (
        "Norma ISO 45001:2018, Norma ISO 19011, matriz de identificación de "
        "peligros y evaluación de riesgos, información documentada del SGSST y "
        "legislación de seguridad e higiene aplicable."
    ),
}

# Nombre completo con el año de edición, para el encabezado del documento.
EDICION_NORMA = {
    "ISO 9001": "ISO 9001:2015",
    "ISO 14001": "ISO 14001:2015",
    "ISO 45001": "ISO 45001:2018",
    "ISO 27001": "ISO 27001:2022",
}


def cronograma_base(norma: str | None) -> list[dict]:
    """Cronograma inicial de la jornada según la norma del programa."""
    if (norma or "").startswith("ISO 9001"):
        return [dict(fila) for fila in CRONOGRAMA_ISO_9001]
    return [dict(fila) for fila in CRONOGRAMA_GENERICO]


def criterios_base(norma: str | None) -> str:
    for clave, texto in CRITERIOS_POR_NORMA.items():
        if (norma or "").startswith(clave):
            return texto
    return (
        "Norma de referencia del sistema de gestión, Norma ISO 19011, mapa de "
        "procesos, información documentada del SGI y legislación aplicable."
    )


def edicion_norma(norma: str | None) -> str | None:
    if not norma:
        return None
    for clave, completa in EDICION_NORMA.items():
        if norma.startswith(clave):
            return completa
    return norma


def objetivo_base(organizacion: str | None, norma: str | None) -> str:
    quien = organizacion or "la organización"
    contra = edicion_norma(norma) or "la norma de referencia"
    return (
        f"Determinar la conformidad y eficacia del sistema de gestión de {quien} "
        f"frente a {contra}, verificar su implementación y detectar "
        f"oportunidades de mejora."
    )


def formatear_codigo(anio: int | None, numero: int) -> str:
    """
    Código del plan: PL-AUD-2026-01, -02, …

    El número lo entrega el contador de la organización (CorrelativoPlan), que
    sólo sube. Contar los planes existentes no serviría: al borrarse un programa
    su plan se va con él y el correlativo volvería atrás, reemitiendo un código
    que ya se entregó impreso.
    """
    return f"PL-AUD-{anio or date.today().year}-{numero:02d}"
