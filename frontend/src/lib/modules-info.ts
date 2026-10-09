import {
  ClipboardCheck, Globe, Target, Workflow, FolderClosed, CheckSquare, FileSearch,
  AlertOctagon, Shuffle, Sliders, GraduationCap, HeartHandshake, Truck, Leaf,
  Activity, FileSignature, Presentation, Sparkles, HardHat, Wrench, Shield, LucideIcon,
  Compass, ToggleRight, Briefcase, ListChecks,
} from "lucide-react";

export interface ModuleInfo {
  key: string;
  name: string;
  path: string;
  icon: LucideIcon;
  clause: string;      // ISO clause / standard reference
  tagline: string;     // one-line purpose
  description: string; // 1-2 sentences
  howTo: string[];     // step-by-step usage
  recommendations: string[];
}

/** Thematic phases used by the onboarding tour to explain how the platform is organized. */
export interface Phase {
  title: string;
  summary: string;
  moduleKeys: string[];
}

export const MODULES: ModuleInfo[] = [
  {
    key: "inicio",
    name: "Inicio — qué sigue",
    path: "/dashboard",
    icon: Compass,
    clause: "Primeros pasos",
    tagline: "La pantalla que te dice qué hacer ahora.",
    description:
      "El Inicio no es un tablero decorativo: mira el estado real de tu sistema y arma dos listas — lo que requiere tu atención hoy y lo que falta para terminar la puesta en marcha. Si no hay nada pendiente, no inventa tarjetas vacías.",
    howTo: [
      "Entrá a «Inicio» (es la primera opción del menú y la pantalla a la que caés al iniciar sesión).",
      "Mirá el bloque «Requiere tu atención»: no conformidades abiertas, auditorías asignadas sin ejecutar y documentos esperando aprobación.",
      "Mirá el bloque «Puesta en marcha»: los pasos de configuración que todavía no hiciste, en el orden en que conviene hacerlos.",
      "Tocá cualquier renglón para ir directo al módulo donde se resuelve.",
    ],
    recommendations: [
      "Si los dos bloques están vacíos, el sistema está al día: eso es la respuesta, no una pantalla rota.",
      "El bloque de puesta en marcha se apaga solo a medida que completás los pasos; no hace falta marcarlos a mano.",
      "Cargá primero el domicilio y el contacto en «Configuración → Organización»: de ahí salen los datos que reciben tus auditores de campo.",
    ],
  },
  {
    key: "ediciones",
    name: "Alcance de la Plataforma",
    path: "/dashboard/settings",
    icon: ToggleRight,
    clause: "Ediciones · Auditorías / SGI Completo",
    tagline: "Mostrá solo los módulos que tu organización va a usar.",
    description:
      "La plataforma se usa en dos alcances. «Auditorías» deja a la vista lo necesario para ejecutar auditorías internas en cualquier industria; «SGI Completo» habilita además todo lo que hace falta para implementar y mantener un sistema de gestión. El recorte se aplica en el menú y también en el servidor.",
    howTo: [
      "La primera vez que entra un administrador, la plataforma hace una sola pregunta: a qué vino. Con esa respuesta queda elegida la edición.",
      "Para cambiarla después, entrá a «Configuración → Alcance de la Plataforma» y elegí la otra opción.",
      "El menú se reacomoda al recargar; no hace falta que nadie vuelva a iniciar sesión.",
      "Si querés afinar más, en «Permisos y Perfiles» recortás además por perfil: cada persona ve la intersección de las dos cosas.",
    ],
    recommendations: [
      "Empezá por «Auditorías» si lo primero que vas a hacer es auditar: siempre podés ampliar.",
      "Cambiar de edición no borra nada. Lo que se apaga es el acceso a las secciones, no la información que cargaste; si volvés, los datos están donde los dejaste.",
      "La edición también limita a los administradores: no es un permiso de usuario, es el alcance de lo que la organización contrató.",
      "Un perfil personalizado al que le otorgaste módulos fuera de la edición solo verá los que estén dentro: gana el más restrictivo, no el más permisivo.",
    ],
  },
  {
    key: "diagnosticos",
    name: "Diagnóstico y Brechas",
    path: "/dashboard/diagnosticos",
    icon: ClipboardCheck,
    clause: "GAP analysis inicial",
    tagline: "Medí cuán lejos estás de cumplir la norma.",
    description:
      "Evaluación inicial (GAP analysis) que compara tu organización contra cada cláusula de la norma elegida y calcula el porcentaje de cumplimiento.",
    howTo: [
      "Creá un diagnóstico con «Nuevo Diagnóstico» y seleccioná las normas a incluir (ISO 9001/14001/45001).",
      "Recorré cada ítem del checklist y marcá el estado: cumple, cumple parcialmente, no cumple o no aplica.",
      "Adjuntá evidencia documental y observaciones en los puntos relevantes.",
      "Revisá el resumen de brechas para priorizar el plan de acción.",
    ],
    recommendations: [
      "Hacé el primer diagnóstico apenas empezás: es la línea base de todo el sistema.",
      "Repetilo cada 6-12 meses para medir avance real.",
      "Convertí cada «no cumple» en un objetivo o una acción en Planificación.",
    ],
  },
  {
    key: "contexto",
    name: "Contexto Organizacional",
    path: "/dashboard/contexto",
    icon: Globe,
    clause: "ISO 9001 · Cláusula 4",
    tagline: "Definí el terreno donde opera tu SGI.",
    description:
      "Registra las cuestiones internas y externas (FODA/PESTEL), las partes interesadas, el alcance del sistema y los requisitos legales aplicables.",
    howTo: [
      "En «Análisis FODA/PESTEL» cargá fortalezas, debilidades, oportunidades y amenazas.",
      "En «Partes Interesadas» listá clientes, proveedores, organismos y sus expectativas.",
      "Redactá el «Alcance del SGI» indicando procesos, sitios y exclusiones justificadas.",
      "Cargá los «Requisitos Legales» que debe cumplir la organización.",
    ],
    recommendations: [
      "El alcance debe ser realista: no incluyas procesos que aún no vas a auditar.",
      "Revisá el contexto en cada Revisión por la Dirección.",
      "Vinculá amenazas y expectativas con riesgos en Planificación.",
    ],
  },
  {
    key: "planificacion",
    name: "Planificación SGI",
    path: "/dashboard/planificacion",
    icon: Target,
    clause: "ISO 9001 · Cláusula 6",
    tagline: "Fijá objetivos y gestioná riesgos y oportunidades.",
    description:
      "Define los objetivos del sistema de gestión y administra los riesgos y oportunidades con su evaluación inicial y residual.",
    howTo: [
      "Cargá objetivos SMART con responsable, meta y fecha.",
      "Registrá riesgos y oportunidades con probabilidad e impacto.",
      "Definí controles y volvé a valorar el riesgo residual.",
      "Asociá cada riesgo a un proceso y a su evidencia.",
    ],
    recommendations: [
      "Un objetivo sin indicador no se puede medir: conectalo con KPIs.",
      "Prioridad a los riesgos de nivel alto antes de la auditoría.",
      "Releé los riesgos cuando cambie el contexto o haya una no conformidad.",
    ],
  },
  {
    key: "procesos",
    name: "Gestión de Procesos",
    path: "/dashboard/procesos",
    icon: Workflow,
    clause: "ISO 9001 · Cláusula 4.4",
    tagline: "Mapeá cómo funciona realmente tu organización.",
    description:
      "Modela el mapa de procesos (BPM): entradas, salidas, responsables e interacciones entre procesos.",
    howTo: [
      "Creá cada proceso con su tipo (estratégico, operativo, de apoyo).",
      "Definí entradas, salidas, responsable e indicadores asociados.",
      "Relacioná los procesos con riesgos, documentos y objetivos.",
    ],
    recommendations: [
      "Empezá por los procesos operativos que generan valor al cliente.",
      "Cada proceso debería tener al menos un indicador en KPIs.",
      "Mantené el mapa simple: pocos procesos bien definidos es mejor que muchos difusos.",
    ],
  },
  {
    key: "documents",
    name: "Gestión Documental (DMS)",
    path: "/dashboard/documents",
    icon: FolderClosed,
    clause: "ISO 9001 · Cláusula 7.5",
    tagline: "Tu información documentada, versionada y controlada.",
    description:
      "Repositorio central de manuales, procedimientos, registros y evidencias, con control de versiones y almacenamiento aislado por tenant.",
    howTo: [
      "Subí un documento con «Cargar» indicando tipo y descripción.",
      "Cada nueva carga genera una versión; la anterior queda en el historial.",
      "Descargá con enlaces temporales y seguros.",
      "Referenciá documentos como evidencia en otros módulos.",
    ],
    recommendations: [
      "Nombrá los documentos con un código consistente (ej. PR-CAL-01).",
      "No borres versiones: la trazabilidad es parte del cumplimiento.",
      "Enviá a aprobación los documentos críticos antes de publicarlos.",
    ],
  },
  {
    key: "approvals",
    name: "Aprobaciones de Calidad",
    path: "/dashboard/approvals",
    icon: CheckSquare,
    clause: "ISO 9001 · Cláusula 7.5",
    tagline: "Firmá y aprobá documentos de forma controlada.",
    description:
      "Flujo de revisión y firma electrónica de los documentos que requieren aprobación formal antes de entrar en vigencia.",
    howTo: [
      "Revisá la lista de documentos pendientes de aprobación.",
      "Abrí el documento, verificá su contenido y firmá o rechazá.",
      "El documento aprobado queda como vigente y trazable.",
    ],
    recommendations: [
      "Definí quién aprueba cada tipo de documento antes de operar.",
      "Aprobá siempre sobre la última versión.",
      "Un rechazo debería incluir el motivo para que se corrija.",
    ],
  },
  {
    key: "auditorias",
    name: "Auditorías Internas",
    path: "/dashboard/auditorias",
    icon: FileSearch,
    clause: "ISO 9001 · Cláusula 9.2",
    tagline: "Planificá auditorías y registrá hallazgos.",
    description:
      "Gestiona el programa anual de auditorías internas y el registro de hallazgos o desvíos detectados.",
    howTo: [
      "Creá un programa de auditoría con objetivo, alcance y fechas.",
      "En «Asignaciones de Campo» asigná el área a un auditor. Si auditás a un cliente, elegilo en el selector de empresa: el auditor va a recibir el domicilio y el referente de esa empresa.",
      "Podés elegir una norma ISO (genera el checklist automático), una plantilla propia, o «Sin plantilla» para armar las preguntas a medida.",
      "Con «Editar preguntas del checklist» cargás tus propias preguntas o aplicás una plantilla guardada; podés hacerlo antes o después de asignar.",
      "Durante la auditoría, cargá los hallazgos encontrados.",
      "La pestaña «Hallazgos / Desvíos» se llena sola con lo que calificó el auditor en campo. Los que dicen «automático» no se borran desde acá: se corrigen en la respuesta que los originó.",
      "Podés agregar a mano los hallazgos que no salieron de un checklist.",
    ],
    recommendations: [
      "Auditá contra el alcance declarado en Contexto.",
      "Programá al menos una auditoría interna antes de la certificación.",
      "Un hallazgo objetivo cita la cláusula y la evidencia.",
      "Si asignás sin plantilla, cargá las preguntas antes de la fecha: el auditor puede reclamártelas desde la app y te llega un aviso por correo.",
    ],
  },
  {
    key: "campo",
    name: "Auditorías de Campo (app móvil)",
    path: "/dashboard/mis-auditorias",
    icon: ClipboardCheck,
    clause: "App móvil · PWA offline",
    tagline: "Ejecutá los controles en sitio, incluso sin internet.",
    description:
      "App móvil simplificada para que el auditor de campo ejecute los controles que le asignó el líder, con nota escrita y foto de evidencia en cada punto (y notas de voz si la organización las habilita), incluso sin conexión.",
    howTo: [
      "Abrí «Mis Auditorías» desde el celular: ahí aparecen las asignaciones que te hizo el auditor líder.",
      "Cada auditoría te dice para qué organización es, a qué domicilio ir, en qué horario y a quién buscar al llegar. «Ver en el mapa» abre el pin en el mapa del celular y el teléfono del referente se toca para llamar.",
      "Al abrir la auditoría tenés además el alcance: qué entra y qué no en la visita.",
      "Respondé cada punto como Conforme, No conforme o N/A.",
      "Debajo aparece la calificación del hallazgo: un «No conforme» es no conformidad mayor o menor; sobre un punto conforme o N/A podés dejar una Observación o una Oportunidad de mejora.",
      "Lo que califiques arma solo la planilla de Hallazgos / Desvíos del informe. Las no conformidades, además, abren su tratamiento en el módulo No Conformidades; las observaciones y oportunidades no, porque no son incumplimientos.",
      "Debajo de cada pregunta tenés el campo de nota breve y, al lado, el botón de cámara para la foto de evidencia. Es el modo por defecto y está siempre disponible.",
      "Si la auditoría llegó sin preguntas, tocá «Solicitar checklist al líder» y le llega el pedido por correo.",
      "Al terminar, firmá digitalmente: se cierra la auditoría y se genera el reporte.",
    ],
    recommendations: [
      "Instalá la app desde el navegador del celular (se agrega como ícono, sin App Store).",
      "Abrí la auditoría una vez con señal antes de salir: el domicilio, el contacto y el checklist quedan guardados en el dispositivo y los tenés aunque en planta no haya datos.",
      "Si olvidaste tu contraseña, usá «¿Olvidaste tu contraseña?» en la pantalla de ingreso: te llega un enlace al correo y no hace falta que un administrador te la cambie.",
      "Sin señal podés seguir auditando: todo queda en el dispositivo y se sincroniza al reconectar.",
      "Verificá el indicador de sincronización antes de cerrar la jornada.",
      "Sacá la foto de evidencia en cada punto crítico: es la prueba objetiva del hallazgo.",
      "Si te equivocaste de botón, corregí la respuesta: el hallazgo que se había generado se deshace solo, salvo que alguien ya lo haya puesto en tratamiento.",
      "Las notas de voz son opcionales: si tu organización las habilita, aparece un grabador para dictar la observación y el texto se genera al firmar.",
    ],
  },
  {
    key: "empresas",
    name: "Empresas Auditadas (cartera)",
    path: "/dashboard/auditorias",
    icon: Briefcase,
    clause: "Auditorías · Cartera de clientes",
    tagline: "Para quien audita a terceros, no a su propia casa.",
    description:
      "Registro de las empresas que auditás: domicilio, actividad, identificación tributaria y referente en sitio. Al asignar una auditoría elegís a cuál de ellas corresponde, y el auditor recibe los datos de esa empresa en lugar de los de tu propia organización.",
    howTo: [
      "Entrá a «Auditorías Internas → Empresas Auditadas» y cargá cada cliente con «Nueva empresa».",
      "Completá domicilio y referente: es lo que va a recibir el auditor que vaya a la visita.",
      "Al crear una asignación de campo, elegí la empresa en el selector. Si la dejás vacía, se entiende que auditás tu propia organización, como hasta ahora.",
      "Si una visita puntual es en otra sede, cargá el domicilio en la asignación: lo específico de la visita manda sobre la ficha del cliente.",
      "Cuando dejás de trabajar con un cliente, desactivalo: sale del selector y su historial de auditorías queda intacto.",
    ],
    recommendations: [
      "Cargá la empresa una vez y reutilizala: cada auditoría que le hagas hereda sus datos sin volver a tipearlos.",
      "Si cargás coordenadas, el auditor abre el pin exacto en el mapa del celular. Es la diferencia entre llegar y dar vueltas.",
      "Una empresa con auditorías registradas no se puede borrar —un informe sin auditado no prueba nada—: se desactiva.",
      "El teléfono de tu propio estudio nunca se usa como respaldo del contacto de un cliente: si la ficha del cliente no tiene referente, es mejor que el auditor lo sepa que darle un número que no sirve.",
    ],
  },
  {
    key: "plantillas",
    name: "Plantillas de Checklist",
    path: "/dashboard/auditorias",
    icon: ListChecks,
    clause: "Auditorías · Listas de verificación propias",
    tagline: "Auditá con tu propia lista, de cualquier actividad.",
    description:
      "Biblioteca de listas de verificación propias. Se crean a mano, se importan desde un archivo de Excel o CSV, se duplican para variar una versión y se aplican a cualquier auditoría. No hace falta auditar contra una norma ISO si lo que necesitás es controlar uso de EPP, higiene o recepción de mercadería.",
    howTo: [
      "Entrá a «Auditorías Internas → Plantillas de Checklist».",
      "Para empezar de cero, usá «Nueva plantilla» y cargá cláusula y pregunta en cada punto.",
      "Para traer una lista que ya tenés, usá «Importar CSV»: la pantalla te muestra una vista previa antes de guardar nada.",
      "También podés partir de un checklist ISO con «Desde catálogo» y después editarlo a tu medida.",
      "Al asignar una auditoría, elegí la plantilla y las preguntas se cargan solas; «Exportar» te devuelve el archivo para editarlo afuera.",
    ],
    recommendations: [
      "El archivo puede venir de Excel en español (con punto y coma) o de cualquier planilla con comas o tabulaciones: el importador reconoce el separador solo.",
      "Las columnas pueden llamarse «cláusula» y «pregunta», o sus sinónimos habituales, con o sin tildes. Si el archivo no trae encabezado, se toma la primera columna como cláusula y la segunda como pregunta, y la pantalla te lo avisa.",
      "Un archivo con algunas filas mal armadas importa las que están bien y te lista las otras por número de fila: no tenés que adivinar cuál falló.",
      "Redactá preguntas cerradas y verificables en sitio: se responden conforme, no conforme o N/A.",
      "Duplicá la plantilla antes de variarla para una sede puntual, así no pierdes la original.",
    ],
  },
  {
    key: "iso9001",
    name: "No Conformidades (ISO 9001)",
    path: "/dashboard/iso9001",
    icon: AlertOctagon,
    clause: "ISO 9001 · Cláusula 10.2",
    tagline: "Desviaciones, causa raíz y acción correctiva (CAPA).",
    description:
      "Ciclo completo de no conformidades: registro, análisis de causa raíz, acción correctiva y verificación de eficacia.",
    howTo: [
      "Declará la desviación indicando origen y descripción.",
      "Ejecutá el análisis de causa raíz (Ishikawa / 5 Porqués).",
      "Definí la acción correctiva con responsable y fecha límite.",
      "Verificá la eficacia y cerrá la no conformidad.",
    ],
    recommendations: [
      "No cierres una NC sin verificar que la causa fue eliminada.",
      "Usá el Auditor de IA para acelerar la causa raíz.",
      "Las NC recurrentes indican un problema de proceso, no de personas.",
    ],
  },
  {
    key: "cambios",
    name: "Control de Cambios",
    path: "/dashboard/cambios",
    icon: Shuffle,
    clause: "ISO 9001 · Cláusula 6.3",
    tagline: "Planificá los cambios sin perder el control.",
    description:
      "Gestiona los cambios del sistema de gestión de forma planificada, con acciones e impacto asociados.",
    howTo: [
      "Registrá el cambio con su código y descripción.",
      "Cargá las acciones necesarias y sus responsables.",
      "Actualizá el estado a medida que se implementan.",
    ],
    recommendations: [
      "Evaluá el impacto del cambio antes de ejecutarlo.",
      "Vinculá cambios significativos con riesgos y documentos.",
      "Registrá también los cambios de contexto y de estructura.",
    ],
  },
  {
    key: "equipos",
    name: "Equipos y Calibración",
    path: "/dashboard/equipos",
    icon: Sliders,
    clause: "ISO 9001 · Cláusula 7.1.5",
    tagline: "Instrumentos calibrados y trazables.",
    description:
      "Inventario de equipos de seguimiento y medición con su historial de calibraciones y certificados.",
    howTo: [
      "Cargá cada equipo con su identificación y frecuencia de calibración.",
      "Registrá cada calibración con fecha, resultado y certificado.",
      "Adjuntá el certificado desde la Gestión Documental.",
    ],
    recommendations: [
      "Configurá la frecuencia para anticipar vencimientos.",
      "Un equipo fuera de calibración invalida las mediciones que hizo.",
      "Guardá los certificados en el DMS para tenerlos trazables.",
    ],
  },
  {
    key: "capacitacion",
    name: "Planes y Competencias",
    path: "/dashboard/capacitacion",
    icon: GraduationCap,
    clause: "ISO 9001 · Cláusula 7.2",
    tagline: "Personas competentes para cada tarea.",
    description:
      "Administra planes de capacitación, asistentes y la matriz de competencias del personal.",
    howTo: [
      "Creá un plan de capacitación con tema, fecha y asistentes.",
      "Registrá asistencia y evaluá la eficacia de la formación.",
      "Mantené la matriz de competencias por colaborador.",
    ],
    recommendations: [
      "Detectá brechas de competencia a partir del diagnóstico.",
      "Evaluá la eficacia, no solo la asistencia.",
      "La competencia se demuestra con evidencia (título, evaluación, práctica).",
    ],
  },
  {
    key: "satisfaccion",
    name: "Satisfacción de Clientes",
    path: "/dashboard/satisfaccion",
    icon: HeartHandshake,
    clause: "ISO 9001 · Cláusula 9.1.2",
    tagline: "Escuchá la voz del cliente (NPS / CSAT).",
    description:
      "Diseña y ejecuta encuestas de satisfacción y analiza los resultados de NPS y CSAT.",
    howTo: [
      "Creá una encuesta con sus preguntas.",
      "Compartila o simulá respuestas para cargar resultados.",
      "Analizá los indicadores de satisfacción resultantes.",
    ],
    recommendations: [
      "Medí de forma periódica para ver tendencias, no puntos aislados.",
      "Convertí una insatisfacción en una no conformidad o mejora.",
      "Cruzá satisfacción con reclamos de proveedores y KPIs.",
    ],
  },
  {
    key: "proveedores",
    name: "Gestión de Proveedores",
    path: "/dashboard/proveedores",
    icon: Truck,
    clause: "ISO 9001 · Cláusula 8.4",
    tagline: "Controlá tu cadena de suministro.",
    description:
      "Registra proveedores, los evalúa periódicamente y gestiona reclamos hacia ellos.",
    howTo: [
      "Dá de alta el proveedor con sus datos y criticidad.",
      "Realizá evaluaciones periódicas de desempeño.",
      "Registrá reclamos y su resolución.",
    ],
    recommendations: [
      "Definí criterios de evaluación antes de calificar.",
      "Enfocá el control en los proveedores críticos.",
      "Un proveedor mal evaluado debería tener un plan de mejora.",
    ],
  },
  {
    key: "huella",
    name: "Huella de Carbono",
    path: "/dashboard/huella",
    icon: Leaf,
    clause: "GHG Protocol / ISO 14064",
    tagline: "Medí tus emisiones de CO₂ (Alcance 1, 2 y 3).",
    description:
      "Calcula la huella de carbono organizacional cargando las fuentes de emisión por alcance y categoría.",
    howTo: [
      "Cargá cada fuente de emisión con su cantidad y unidad.",
      "Clasificá por alcance (1 directas, 2 energía, 3 indirectas).",
      "Revisá el CO₂ equivalente calculado y adjuntá evidencia.",
    ],
    recommendations: [
      "Empezá por Alcance 1 y 2, que son los más fáciles de medir.",
      "Guardá las facturas/soportes como evidencia de cada carga.",
      "Fijá una meta de reducción y seguila con un KPI.",
    ],
  },
  {
    key: "kpis",
    name: "KPIs e Indicadores",
    path: "/dashboard/kpis",
    icon: Activity,
    clause: "ISO 9001 · Cláusula 9.1",
    tagline: "Medí el desempeño con datos.",
    description:
      "Define indicadores clave, cargá mediciones y seguí su evolución frente a las metas.",
    howTo: [
      "Creá un KPI con su fórmula, unidad y meta.",
      "Cargá mediciones periódicas.",
      "Analizá la tendencia y el cumplimiento de la meta.",
    ],
    recommendations: [
      "Pocos KPIs relevantes valen más que muchos que nadie mira.",
      "Cada objetivo y proceso importante debería tener su indicador.",
      "Un KPI en rojo es un insumo directo para la Revisión por la Dirección.",
    ],
  },
  {
    key: "direccion",
    name: "Revisión por la Dirección",
    path: "/dashboard/direccion",
    icon: FileSignature,
    clause: "ISO 9001 · Cláusula 9.3",
    tagline: "La dirección revisa y decide.",
    description:
      "Registra las revisiones por la dirección con sus entradas, conclusiones y decisiones.",
    howTo: [
      "Creá una revisión con fecha y participantes.",
      "Consolidá entradas: KPIs, auditorías, NC, satisfacción, riesgos.",
      "Documentá conclusiones, decisiones y recursos asignados; luego cerrala.",
    ],
    recommendations: [
      "Hacela al menos una vez al año.",
      "Usá los datos reales de los otros módulos como entrada.",
      "Toda decisión debería derivar en objetivos o acciones concretas.",
    ],
  },
  {
    key: "reportes",
    name: "Reporte SGI",
    path: "/dashboard/reportes",
    icon: Presentation,
    clause: "Salidas consolidadas",
    tagline: "El estado de tu sistema en un solo lugar.",
    description:
      "Genera reportes consolidados del sistema de gestión para auditorías, dirección o clientes.",
    howTo: [
      "Seleccioná el período y el alcance del reporte.",
      "Generá el reporte con los datos consolidados del SGI.",
      "Compartilo o exportalo según necesites.",
    ],
    recommendations: [
      "Generá un reporte antes de cada auditoría externa.",
      "Usalo como respaldo de la Revisión por la Dirección.",
    ],
  },
  {
    key: "ia-auditor",
    name: "Auditor de IA Hub",
    path: "/dashboard/ia-auditor",
    icon: Sparkles,
    clause: "Asistentes MCP",
    tagline: "Asistentes inteligentes para tu SGI.",
    description:
      "Herramientas de IA conectables (MCP): consultor de cumplimiento, causa raíz, mitigación de riesgos y resumen ejecutivo de KPIs.",
    howTo: [
      "Elegí el asistente según lo que necesites.",
      "Proporcioná el contexto (una NC, un riesgo, un período).",
      "Revisá la propuesta de la IA y ajustala con tu criterio.",
    ],
    recommendations: [
      "La IA acelera el análisis, pero la decisión final es del responsable.",
      "Ideal para causa raíz y para redactar resúmenes de dirección.",
      "Verificá siempre las recomendaciones contra la evidencia real.",
    ],
  },
  {
    key: "sst",
    name: "Seguridad y Salud (SST)",
    path: "/dashboard/sst",
    icon: HardHat,
    clause: "ISO 45001",
    tagline: "Cuidá a las personas: incidentes e inspecciones.",
    description:
      "Registra incidentes de seguridad y salud ocupacional e inspecciones de SST.",
    howTo: [
      "Registrá cada incidente con su descripción y gravedad.",
      "Cargá las inspecciones de seguridad realizadas.",
      "Derivá los hallazgos relevantes a no conformidades o acciones.",
    ],
    recommendations: [
      "Registrá también los casi-incidentes: previenen accidentes.",
      "Cerrá el círculo con acciones correctivas.",
      "Cruzá SST con capacitación y mantenimiento.",
    ],
  },
  {
    key: "mantenimiento",
    name: "Mantenimiento (CMMS)",
    path: "/dashboard/mantenimiento",
    icon: Wrench,
    clause: "ISO 9001 · Cláusula 7.1.3",
    tagline: "Infraestructura disponible y confiable.",
    description:
      "Gestiona activos de infraestructura y órdenes de trabajo de mantenimiento.",
    howTo: [
      "Cargá los activos de infraestructura críticos.",
      "Generá órdenes de trabajo de mantenimiento.",
      "Seguí su estado hasta el cierre.",
    ],
    recommendations: [
      "Priorizá el mantenimiento preventivo sobre el correctivo.",
      "Vinculá los activos con los equipos de medición cuando aplique.",
      "Una falla recurrente puede ser una no conformidad de infraestructura.",
    ],
  },
  {
    key: "permisos",
    name: "Usuarios, Permisos y Perfiles",
    path: "/dashboard/settings",
    icon: Shield,
    clause: "Administración del Tenant",
    tagline: "Definí quién entra y qué puede ver cada perfil.",
    description:
      "Gestión de usuarios de tu organización y del alcance de cada perfil: qué secciones ve, a qué puede entrar y qué puede modificar. Los permisos se aplican tanto en el menú como en el servidor.",
    howTo: [
      "Entrá a «Configuración del Tenant» (solo administradores) desde el menú lateral.",
      "En «Usuarios y Roles» invitá personas indicando nombre, correo y perfil; reciben un mail con su acceso y contraseña temporal.",
      "En «Permisos y Perfiles» marcá, para cada perfil, las secciones que debe ver y guardá los cambios.",
      "Podés crear perfiles propios (ej. «Supervisor de Planta») con «Crear perfil personalizado» y marcar si usan la app móvil de campo.",
      "En «Auditoría en Campo» elegís cómo registra la evidencia el auditor: la nota escrita y la foto están siempre activas; las notas de voz son opcionales.",
      "Cada usuario ve los cambios al recargar; si le cambiás el rol, debe volver a iniciar sesión.",
    ],
    recommendations: [
      "Aplicá el mínimo privilegio: dá solo las secciones que cada perfil necesita para trabajar.",
      "El perfil «Administrador» siempre ve todo y no se puede restringir: asignalo solo a quien administra el sistema.",
      "«Auditor de Campo» entra a una app móvil simplificada, limitada a sus auditorías asignadas.",
      "Ayuda y Mi Perfil están siempre disponibles para todos los perfiles.",
      "Los permisos también se validan en el servidor: ocultar una sección no es solo cosmético.",
      "Activar las notas de voz implica enviar el audio grabado en planta a un servicio externo de transcripción: por eso hay que aceptar el aviso de privacidad y queda registrado quién lo hizo.",
    ],
  },
];

export const MODULE_BY_KEY: Record<string, ModuleInfo> = Object.fromEntries(
  MODULES.map((m) => [m.key, m])
);

/** Phases shown in the onboarding tour to explain the overall flow. */
export const PHASES: Phase[] = [
  {
    title: "0 · Primeros pasos",
    summary: "Elegí el alcance de la plataforma y dejá que el Inicio te marque qué sigue.",
    moduleKeys: ["inicio", "ediciones"],
  },
  {
    title: "1 · Diagnóstico y contexto",
    summary: "Entendé dónde estás parado y define el terreno de tu sistema de gestión.",
    moduleKeys: ["diagnosticos", "contexto"],
  },
  {
    title: "2 · Planificación y procesos",
    summary: "Fijá objetivos, gestioná riesgos y mapeá cómo trabaja tu organización.",
    moduleKeys: ["planificacion", "procesos"],
  },
  {
    title: "3 · Documentación y evidencia",
    summary: "Centralizá y controlá la información documentada con aprobaciones.",
    moduleKeys: ["documents", "approvals"],
  },
  {
    title: "4 · Control operativo",
    summary: "Auditá, gestioná no conformidades, cambios y equipos de medición.",
    moduleKeys: ["auditorias", "empresas", "plantillas", "campo", "iso9001", "cambios", "equipos"],
  },
  {
    title: "5 · Personas y partes interesadas",
    summary: "Competencias del equipo, satisfacción de clientes y proveedores.",
    moduleKeys: ["capacitacion", "satisfaccion", "proveedores"],
  },
  {
    title: "6 · Desempeño y dirección",
    summary: "Medí resultados, tu huella de carbono y llevá todo a la dirección.",
    moduleKeys: ["huella", "kpis", "direccion", "reportes"],
  },
  {
    title: "7 · Herramientas y otros sistemas",
    summary: "Asistentes de IA, seguridad y salud (SST) y mantenimiento (CMMS).",
    moduleKeys: ["ia-auditor", "sst", "mantenimiento"],
  },
  {
    title: "8 · Administración",
    summary: "Usuarios de tu organización, perfiles y alcance de cada uno.",
    moduleKeys: ["permisos"],
  },
];
