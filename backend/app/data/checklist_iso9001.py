"""
Checklist completo de auditoría interna ISO 9001:2015.

Recorre la norma por módulos, en el mismo orden en que se recorre la jornada
del plan de auditoría: dirección y contexto, sistema y documentación, comercial,
operaciones, compras y soporte.

Cada punto trae además la EVIDENCIA a solicitar. Es la diferencia entre un
checklist que sirve y una lista de preguntas: el auditor necesita saber qué
registro pedir, no sólo qué preguntar.

Es una plantilla, así que está redactado en términos de cualquier organización.
Donde una organización tenga su propia codificación (procedimientos PG, mapa de
procesos, organigrama), el auditor líder ajusta el punto sobre la asignación:
los puntos generados son editables.
"""

MODULOS_ISO_9001 = [
    {
        "modulo": "1. Dirección, Liderazgo, Contexto y SGC",
        "puntos": [
            {
                "clausula": "ISO 9001 4.1 y 4.2",
                "pregunta": "¿Está analizado el contexto de la organización (cuestiones internas y externas) e identificadas las partes interesadas con sus requisitos aplicables?",
                "evidencia": "Análisis de contexto (FODA u otro) y registro de partes interesadas actualizado.",
            },
            {
                "clausula": "ISO 9001 4.3 y 4.4",
                "pregunta": "¿Está definido el alcance del SGC y la interacción de los procesos según el mapa de procesos?",
                "evidencia": "Alcance documentado, mapa de procesos vigente y caracterización de cada proceso.",
            },
            {
                "clausula": "ISO 9001 5.1 y 5.2",
                "pregunta": "¿Demuestra la alta dirección su compromiso con el SGC y está la Política de Calidad difundida y alineada con la estrategia?",
                "evidencia": "Política de Calidad firmada, registros de difusión y entrevistas a la dirección.",
            },
            {
                "clausula": "ISO 9001 5.3",
                "pregunta": "¿Están asignadas y comunicadas las responsabilidades y autoridades para los roles pertinentes?",
                "evidencia": "Organigrama vigente y perfiles de puesto firmados.",
            },
            {
                "clausula": "ISO 9001 6.1 y 6.2",
                "pregunta": "¿Se gestionan los riesgos y oportunidades y los objetivos de calidad son medibles y tienen plan de acción?",
                "evidencia": "Matriz de riesgos y oportunidades, y cuadro de mando de objetivos de calidad con seguimiento.",
            },
            {
                "clausula": "ISO 9001 9.3",
                "pregunta": "¿Se realiza la revisión por la dirección con la periodicidad definida, cubriendo todas las entradas y salidas requeridas?",
                "evidencia": "Actas de revisión por la dirección con firmantes y seguimiento de las acciones decididas.",
            },
        ],
    },
    {
        "modulo": "2. Gestión del SGC y Control Documental",
        "puntos": [
            {
                "clausula": "ISO 9001 7.5",
                "pregunta": "¿Se controla la información documentada (creación, aprobación, versión, distribución y legibilidad)?",
                "evidencia": "Listado maestro de documentos y registros vigentes.",
            },
            {
                "clausula": "ISO 9001 9.2",
                "pregunta": "¿Existe un programa de auditorías internas, se ejecuta según el procedimiento y los auditores están calificados?",
                "evidencia": "Programa de auditoría, informes de auditorías previas y calificación de auditores.",
            },
            {
                "clausula": "ISO 9001 10.1 a 10.3",
                "pregunta": "¿Se gestionan las no conformidades y acciones correctivas con análisis de causa raíz y verificación de eficacia?",
                "evidencia": "Registro de no conformidades, análisis de causas y evidencias de cierre.",
            },
            {
                "clausula": "ISO 9001 7.4",
                "pregunta": "¿Están definidos los canales de comunicación interna sobre el SGC y se ejecutan?",
                "evidencia": "Minutas de reunión, comunicados internos, boletines o carteleras.",
            },
        ],
    },
    {
        "modulo": "3. Proceso Comercial y Satisfacción del Cliente",
        "puntos": [
            {
                "clausula": "ISO 9001 8.2.1",
                "pregunta": "¿Se gestiona la comunicación con el cliente sobre los productos y servicios ofrecidos?",
                "evidencia": "Cotizaciones enviadas, consultas de clientes y ofertas formales.",
            },
            {
                "clausula": "ISO 9001 8.2.2 y 8.2.3",
                "pregunta": "¿Se determinan y revisan los requisitos antes de comprometerse a suministrar el producto o servicio?",
                "evidencia": "Contratos u órdenes de servicio revisadas y firmadas.",
            },
            {
                "clausula": "ISO 9001 8.2.4",
                "pregunta": "¿Se registran las modificaciones a los requisitos acordados y se comunican a las áreas involucradas?",
                "evidencia": "Registros de cambios en contratos, addendas o correos de confirmación.",
            },
            {
                "clausula": "ISO 9001 9.1.2",
                "pregunta": "¿Se mide la satisfacción del cliente y se tratan los reclamos con indicadores y análisis?",
                "evidencia": "Encuestas de satisfacción completadas, registro de quejas y su análisis.",
            },
        ],
    },
    {
        "modulo": "4. Operaciones y Prestación del Servicio",
        "puntos": [
            {
                "clausula": "ISO 9001 8.1 y 8.5.1",
                "pregunta": "¿Se planifica y controla la producción o prestación del servicio bajo condiciones controladas?",
                "evidencia": "Planillas de control de proceso, checklists de inspección y registros de entrega/recepción.",
            },
            {
                "clausula": "ISO 9001 8.5.2",
                "pregunta": "¿Se identifica el estado de las salidas y se mantiene la trazabilidad cuando es un requisito?",
                "evidencia": "Sistema de gestión, planilla de estado o identificación física de las salidas.",
            },
            {
                "clausula": "ISO 9001 8.5.3",
                "pregunta": "¿Se cuida la propiedad del cliente o de proveedores externos mientras está bajo control de la organización?",
                "evidencia": "Control de inventario de bienes y documentación de terceros, y registro de incidencias.",
            },
            {
                "clausula": "ISO 9001 8.5.4",
                "pregunta": "¿Se preservan las salidas durante el almacenamiento, acondicionamiento y entrega?",
                "evidencia": "Registros de acondicionamiento, limpieza y preparación previa a la entrega.",
            },
            {
                "clausula": "ISO 9001 8.5.1 (Mantenimiento)",
                "pregunta": "¿Se cumple el plan de mantenimiento preventivo y correctivo de la infraestructura y los equipos de producción?",
                "evidencia": "Fichas e historial de mantenimiento por equipo y órdenes de trabajo cerradas.",
            },
            {
                "clausula": "ISO 9001 7.1.5",
                "pregunta": "¿Están controlados y calibrados los equipos de seguimiento y medición utilizados para verificar la conformidad?",
                "evidencia": "Certificados de calibración o verificación vigentes y etiquetado de los equipos.",
            },
            {
                "clausula": "ISO 9001 8.7",
                "pregunta": "¿Se identifican, controlan y tratan las salidas no conformes, impidiendo su uso o entrega no intencionada?",
                "evidencia": "Registros de salidas no conformes, identificación o segregación y acciones tomadas.",
            },
        ],
    },
    {
        "modulo": "5. Abastecimiento y Compras",
        "puntos": [
            {
                "clausula": "ISO 9001 8.4.1",
                "pregunta": "¿Se evalúan, seleccionan, monitorean y reevalúan los proveedores externos según criterios definidos?",
                "evidencia": "Listado de proveedores aprobados y evaluaciones periódicas de desempeño.",
            },
            {
                "clausula": "ISO 9001 8.4.2",
                "pregunta": "¿Se verifica que los productos y servicios comprados cumplan los requisitos antes de su uso?",
                "evidencia": "Remitos y facturas con conformidad de recepción, y protocolos de inspección.",
            },
            {
                "clausula": "ISO 9001 8.4.3",
                "pregunta": "¿La información de compras comunica al proveedor los requisitos de forma completa y clara?",
                "evidencia": "Órdenes de compra emitidas con el detalle de las especificaciones técnicas.",
            },
        ],
    },
    {
        "modulo": "6. Recursos Humanos y Soporte",
        "puntos": [
            {
                "clausula": "ISO 9001 7.1.2 y 7.2",
                "pregunta": "¿El personal que afecta al desempeño del SGC es competente y se evalúa la eficacia de las capacitaciones?",
                "evidencia": "Legajos de personal, habilitaciones vigentes, registros de capacitación y evaluación de eficacia.",
            },
            {
                "clausula": "ISO 9001 7.3",
                "pregunta": "¿El personal toma conciencia de la Política de Calidad, de su contribución al SGC y de las consecuencias de no cumplir los requisitos?",
                "evidencia": "Entrevistas al personal operativo sobre la política y su rol en la calidad.",
            },
            {
                "clausula": "ISO 9001 7.1.3 y 7.1.4",
                "pregunta": "¿Se mantiene la infraestructura y el ambiente necesarios para la operación de los procesos?",
                "evidencia": "Plan de mantenimiento edilicio y de sistemas, y verificación de orden y limpieza en las instalaciones.",
            },
        ],
    },
]

# Leyenda de clasificación de hallazgos, la misma que usa el checklist en papel.
LEYENDA_HALLAZGOS = (
    "C: Conformidad | NC: No Conformidad (incumplimiento de un requisito "
    "normativo o del SGC) | OBS: Observación | OM: Oportunidad de Mejora"
)


def checklist_iso_9001_completo() -> list[dict]:
    """Aplana los módulos a la lista de puntos que consume el checklist."""
    puntos = []
    for bloque in MODULOS_ISO_9001:
        for punto in bloque["puntos"]:
            puntos.append({
                "clausula": punto["clausula"],
                "pregunta": punto["pregunta"],
                "modulo": bloque["modulo"],
                "evidencia": punto["evidencia"],
            })
    return puntos
