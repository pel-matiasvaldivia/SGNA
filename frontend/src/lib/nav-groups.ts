import {
  Activity,
  AlertOctagon,
  ClipboardCheck,
  ClipboardList,
  CheckSquare,
  FileSearch,
  FileSignature,
  FolderClosed,
  Globe,
  GraduationCap,
  HardHat,
  HeartHandshake,
  Home,
  Leaf,
  Presentation,
  Shuffle,
  Sliders,
  Sparkles,
  Target,
  Truck,
  Workflow,
  Wrench,
  type LucideIcon,
} from "lucide-react";

/**
 * Agrupación del menú principal.
 *
 * El menú era una lista plana de 22 módulos: todos con el mismo peso visual, en
 * un orden que no era ni alfabético ni de uso, y sin forma de ver de un golpe
 * qué tipo de trabajo cubre la plataforma. Nadie lee 22 opciones; se escanean
 * unas pocas. Agrupados quedan cinco encabezados, que sí se leen.
 *
 * El orden de los grupos sigue el del ciclo de un SGI —primero entender la
 * organización, después operar, después auditar, después mejorar y por último
 * rendir cuentas a la dirección— que es también el orden en que un implementador
 * recorre la norma. No es decorativo: es el que hace que el siguiente paso esté
 * siempre más abajo que el anterior.
 *
 * `key` tiene que coincidir con el catálogo del backend
 * (backend/app/data/modules_catalog.py): si no coincide, el módulo queda sin
 * gating de permisos, o directamente invisible. `backend/tests/test_menu_agrupado.py`
 * compara las dos listas y avisa si alguien agrega un módulo de un solo lado.
 */

export type NavItem = {
  key: string;
  name: string;
  path: string;
  icon: LucideIcon;
};

export type NavGroup = {
  id: string;
  label: string;
  items: NavItem[];
};

/** Inicio va suelto arriba de los grupos: es el destino por defecto, no una categoría. */
export const INICIO: NavItem = {
  key: "inicio",
  name: "Inicio",
  path: "/dashboard",
  icon: Home,
};

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "diagnostico",
    label: "Diagnóstico y planificación",
    items: [
      { key: "diagnosticos", name: "Diagnóstico y Brechas", path: "/dashboard/diagnosticos", icon: ClipboardCheck },
      { key: "contexto", name: "Contexto Organizacional", path: "/dashboard/contexto", icon: Globe },
      { key: "planificacion", name: "Planificación SGI", path: "/dashboard/planificacion", icon: Target },
    ],
  },
  {
    id: "auditorias",
    label: "Auditorías",
    items: [
      { key: "auditorias", name: "Auditorías Internas", path: "/dashboard/auditorias", icon: FileSearch },
      { key: "mis-auditorias", name: "Mis Auditorías (Campo)", path: "/dashboard/mis-auditorias", icon: ClipboardList },
      { key: "ia-auditor", name: "Auditor de IA Hub", path: "/dashboard/ia-auditor", icon: Sparkles },
    ],
  },
  {
    id: "operacion",
    label: "Operación del SGI",
    items: [
      { key: "procesos", name: "Gestión de Procesos", path: "/dashboard/procesos", icon: Workflow },
      { key: "documents", name: "Gestión Documental", path: "/dashboard/documents", icon: FolderClosed },
      { key: "approvals", name: "Aprobaciones de Calidad", path: "/dashboard/approvals", icon: CheckSquare },
      { key: "cambios", name: "Control de Cambios", path: "/dashboard/cambios", icon: Shuffle },
      { key: "equipos", name: "Equipos y Calibración", path: "/dashboard/equipos", icon: Sliders },
      { key: "mantenimiento", name: "Mantenimiento (CMMS)", path: "/dashboard/mantenimiento", icon: Wrench },
      { key: "capacitacion", name: "Planes y Competencias", path: "/dashboard/capacitacion", icon: GraduationCap },
      { key: "proveedores", name: "Gestión de Proveedores", path: "/dashboard/proveedores", icon: Truck },
      { key: "sst", name: "Seguridad y Salud (SST)", path: "/dashboard/sst", icon: HardHat },
    ],
  },
  {
    id: "mejora",
    label: "Mejora y seguimiento",
    items: [
      { key: "iso9001", name: "No Conformidades", path: "/dashboard/iso9001", icon: AlertOctagon },
      { key: "satisfaccion", name: "Satisfacción de Clientes", path: "/dashboard/satisfaccion", icon: HeartHandshake },
      { key: "kpis", name: "KPIs e Indicadores", path: "/dashboard/kpis", icon: Activity },
      { key: "huella", name: "Huella de Carbono", path: "/dashboard/huella", icon: Leaf },
    ],
  },
  {
    id: "direccion",
    label: "Dirección",
    items: [
      { key: "direccion", name: "Revisión Dirección", path: "/dashboard/direccion", icon: FileSignature },
      { key: "reportes", name: "Reporte SGI", path: "/dashboard/reportes", icon: Presentation },
    ],
  },
];

/** Todos los ítems de todos los grupos, sin Inicio. Útil para validar el catálogo. */
export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

/**
 * Id del grupo que contiene una ruta, o null si la ruta no está en ninguno
 * (Inicio, Mi Perfil, Ayuda, Configuración, consola de superadmin). Se usa para
 * abrir únicamente el grupo de la sección en la que está parado el usuario.
 */
export function grupoDeRuta(path: string): string | null {
  for (const grupo of NAV_GROUPS) {
    const dentro = grupo.items.some(
      (item) => path === item.path || path.startsWith(item.path + "/")
    );
    if (dentro) return grupo.id;
  }
  return null;
}
