"""
Plantillas de checklist de auditoría por norma ISO.

Cada plantilla es una lista de puntos de control representativos que el auditor
líder puede aplicar a una asignación para generar rápidamente su checklist. Los
puntos generados son editables (se pueden agregar o quitar) sobre cada asignación.
"""

CHECKLIST_TEMPLATES = {
    "ISO 9001": [
        {"clausula": "ISO 9001 7.1.5", "pregunta": "¿Los equipos de seguimiento y medición están calibrados y con etiqueta de calibración vigente?"},
        {"clausula": "ISO 9001 7.5.3", "pregunta": "¿La documentación en uso en el puesto está en su última revisión aprobada?"},
        {"clausula": "ISO 9001 8.5.1", "pregunta": "¿Existen instrucciones de trabajo disponibles y se cumplen en los puestos operativos?"},
        {"clausula": "ISO 9001 8.7", "pregunta": "¿Se identifican, registran y segregan las salidas no conformes?"},
        {"clausula": "ISO 9001 9.1.1", "pregunta": "¿Se registran los indicadores del proceso según lo planificado?"},
    ],
    "ISO 14001": [
        {"clausula": "ISO 14001 6.1.2", "pregunta": "¿Están identificados y controlados los aspectos ambientales significativos del área?"},
        {"clausula": "ISO 14001 8.1", "pregunta": "¿Se gestionan y disponen los residuos según su clasificación y normativa aplicable?"},
        {"clausula": "ISO 14001 8.2", "pregunta": "¿El kit antiderrame / medios de contención está completo, señalizado y accesible?"},
        {"clausula": "ISO 14001 7.5", "pregunta": "¿Los registros ambientales del sector están actualizados y disponibles?"},
        {"clausula": "ISO 14001 9.1.1", "pregunta": "¿Se monitorean y registran los consumos relevantes (agua, energía, combustible) del sector?"},
    ],
    "ISO 45001": [
        {"clausula": "ISO 45001 8.1.2", "pregunta": "¿El personal utiliza los elementos de protección personal (EPP) requeridos para la tarea?"},
        {"clausula": "ISO 45001 7.2", "pregunta": "¿Los trabajadores cuentan con capacitación vigente para las tareas críticas del área?"},
        {"clausula": "ISO 45001 8.1.3", "pregunta": "¿Los extintores están señalizados, cargados, vigentes y accesibles?"},
        {"clausula": "ISO 45001 6.1.2", "pregunta": "¿Están identificados y señalizados los peligros y riesgos del área de trabajo?"},
        {"clausula": "ISO 45001 8.2", "pregunta": "¿Las salidas y vías de emergencia están despejadas y correctamente señalizadas?"},
    ],
    "ISO 27001": [
        {"clausula": "ISO 27001 A.9", "pregunta": "¿El acceso a los sistemas está controlado y se aplica el mínimo privilegio?"},
        {"clausula": "ISO 27001 A.8", "pregunta": "¿Los activos de información están inventariados y con responsable asignado?"},
        {"clausula": "ISO 27001 A.12", "pregunta": "¿Existen copias de respaldo y se verifica periódicamente su restauración?"},
        {"clausula": "ISO 27001 A.7", "pregunta": "¿El personal recibió concientización en seguridad de la información?"},
    ],
}


def get_template(norma: str):
    """Devuelve los puntos de control de una norma, o lista vacía si no existe."""
    return CHECKLIST_TEMPLATES.get(norma, [])


def available_normas():
    return list(CHECKLIST_TEMPLATES.keys())
