import {
  ClipboardCheck, Globe, Target, Workflow, FolderClosed, CheckSquare, FileSearch,
  AlertOctagon, Shuffle, Sliders, GraduationCap, HeartHandshake, Truck, Leaf,
  Activity, FileSignature, Presentation, Sparkles, HardHat, Wrench, LucideIcon,
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
      "Durante la auditoría, cargá los hallazgos encontrados.",
      "Derivá los hallazgos que sean no conformidades al módulo ISO 9001.",
    ],
    recommendations: [
      "Auditá contra el alcance declarado en Contexto.",
      "Programá al menos una auditoría interna antes de la certificación.",
      "Un hallazgo objetivo cita la cláusula y la evidencia.",
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
];

export const MODULE_BY_KEY: Record<string, ModuleInfo> = Object.fromEntries(
  MODULES.map((m) => [m.key, m])
);

/** Phases shown in the onboarding tour to explain the overall flow. */
export const PHASES: Phase[] = [
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
    moduleKeys: ["auditorias", "iso9001", "cambios", "equipos"],
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
];
