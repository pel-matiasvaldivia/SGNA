"use client";

import React from "react";
import {
  ClipboardCheck,
  Globe,
  Target,
  Workflow,
  FolderClosed,
  CheckSquare,
  FileSearch,
  ClipboardList,
  AlertOctagon,
  Shuffle,
  Sliders,
  GraduationCap,
  HeartHandshake,
  Truck,
  Leaf,
  Activity,
  FileSignature,
  Presentation,
  Sparkles,
  HardHat,
  Wrench,
} from "lucide-react";

/**
 * Ilustraciones por módulo para la sección "Cómo funciona la plataforma".
 * Cada escena es una ilustración a medida (SVG, flat con profundidad) que
 * representa de forma literal la función del módulo. Los módulos están ordenados
 * según el ciclo de mejora continua (PDCA) del Sistema de Gestión.
 */

export interface PhaseDef {
  key: "plan" | "do" | "check" | "act";
  label: string;
  desc: string;
}

export const PHASES: PhaseDef[] = [
  { key: "plan", label: "1 · Planificar", desc: "Entender el contexto, evaluar brechas y definir el plan." },
  { key: "do", label: "2 · Implementar", desc: "Operar el sistema: documentos, personas, recursos y operación." },
  { key: "check", label: "3 · Verificar", desc: "Auditar, medir y detectar desvíos en terreno y en datos." },
  { key: "act", label: "4 · Mejorar", desc: "Reportar, revisar por la dirección y gestionar cambios." },
];

export interface ModuleDef {
  id: string;
  name: string;
  desc: string;
  accent: string;
  phase: PhaseDef["key"];
  Icon: React.ComponentType<{ className?: string }>;
}

export const MODULES: ModuleDef[] = [
  // --- Planificar ---
  { id: "diagnostico", name: "Diagnóstico y Brechas", desc: "Autoevaluación del estado del SGI y detección de brechas frente a la norma.", accent: "#003F87", phase: "plan", Icon: ClipboardCheck },
  { id: "contexto", name: "Contexto Organizacional", desc: "FODA, PESTEL y partes interesadas para entender el contexto de la organización.", accent: "#0F766E", phase: "plan", Icon: Globe },
  { id: "planificacion", name: "Planificación SGI", desc: "Objetivos, programa anual y calendario de auditorías en un solo lugar.", accent: "#7C3AED", phase: "plan", Icon: Target },
  { id: "procesos", name: "Gestión de Procesos", desc: "Mapa de procesos con entradas, salidas e indicadores enlazados.", accent: "#0369A1", phase: "plan", Icon: Workflow },
  // --- Implementar ---
  { id: "dms", name: "Gestión Documental (DMS)", desc: "Versionado, control de acceso y repositorio aislado por empresa.", accent: "#2563EB", phase: "do", Icon: FolderClosed },
  { id: "aprobaciones", name: "Aprobaciones de Calidad", desc: "Flujos de revisión y aprobación de documentos con trazabilidad.", accent: "#0891B2", phase: "do", Icon: CheckSquare },
  { id: "capacitacion", name: "Planes y Competencias", desc: "Matriz de competencias, planes de capacitación y seguimiento.", accent: "#2563EB", phase: "do", Icon: GraduationCap },
  { id: "equipos", name: "Equipos y Calibración", desc: "Inventario de equipos y control de calibraciones y vencimientos.", accent: "#0D9488", phase: "do", Icon: Sliders },
  { id: "cmms", name: "Mantenimiento (CMMS)", desc: "Órdenes de trabajo, mantenimiento preventivo y activos.", accent: "#475569", phase: "do", Icon: Wrench },
  { id: "proveedores", name: "Gestión de Proveedores", desc: "Evaluación, calificación y seguimiento del desempeño de proveedores.", accent: "#B45309", phase: "do", Icon: Truck },
  { id: "sst", name: "Seguridad y Salud (SST)", desc: "Pirámide de incidentes, actos inseguros y reportes en terreno (ISO 45001).", accent: "#EA580C", phase: "do", Icon: HardHat },
  { id: "huella", name: "Huella de Carbono", desc: "Cálculo de Alcance 1, 2 y 3 en tiempo real (ISO 14001).", accent: "#2E7D32", phase: "do", Icon: Leaf },
  // --- Verificar ---
  { id: "auditorias", name: "Auditorías Internas", desc: "Programa, ejecución y seguimiento de auditorías con checklists por norma.", accent: "#003F87", phase: "check", Icon: FileSearch },
  { id: "campo", name: "Auditorías de Campo", desc: "Ejecución en el celular, incluso sin internet, con sincronización automática.", accent: "#F59E0B", phase: "check", Icon: ClipboardList },
  { id: "nc", name: "No Conformidades (ISO 9001)", desc: "Del hallazgo a la acción correctiva, con causa raíz y cierre.", accent: "#DC2626", phase: "check", Icon: AlertOctagon },
  { id: "satisfaccion", name: "Satisfacción de Clientes", desc: "Encuestas, NPS y análisis de la percepción del cliente.", accent: "#DB2777", phase: "check", Icon: HeartHandshake },
  { id: "kpis", name: "KPIs e Indicadores", desc: "Tableros con metas, tendencias y alertas de tus indicadores clave.", accent: "#0284C7", phase: "check", Icon: Activity },
  // --- Mejorar ---
  { id: "reportes", name: "Reporte SGI", desc: "Reportes consolidados del sistema, listos para exportar y compartir.", accent: "#003F87", phase: "act", Icon: Presentation },
  { id: "direccion", name: "Revisión por la Dirección", desc: "Entradas, salidas y actas de la revisión por la dirección.", accent: "#1D4ED8", phase: "act", Icon: FileSignature },
  { id: "cambios", name: "Control de Cambios", desc: "Solicitud, evaluación de impacto y aprobación de cambios del sistema.", accent: "#9333EA", phase: "act", Icon: Shuffle },
  { id: "ia", name: "Auditor de IA", desc: "Copiloto experto en ISO 9001, 14001 y 45001, disponible 24/7.", accent: "#7C3AED", phase: "act", Icon: Sparkles },
];

export function ModuleScene({ mod }: { mod: ModuleDef }) {
  const a = mod.accent;
  return (
    <div
      className="relative rounded-xl overflow-hidden border border-slate-200/70 dark:border-zinc-800 shadow-sm aspect-[16/10]"
      style={{ background: `linear-gradient(135deg, ${a}10, ${a}22)` }}
    >
      <div className="absolute -right-8 -top-10 w-32 h-32 rounded-full" style={{ background: a, opacity: 0.1 }} />
      <div className="absolute top-3 left-3 w-9 h-9 rounded-lg flex items-center justify-center shadow-sm z-10" style={{ background: a }}>
        <mod.Icon className="w-5 h-5 text-white" />
      </div>
      <div className="absolute inset-x-4 bottom-4 top-14 rounded-lg bg-white dark:bg-zinc-950 shadow-md ring-1 ring-black/5 overflow-hidden">
        <svg viewBox="0 0 200 100" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
          {scene(mod.id, a)}
        </svg>
      </div>
    </div>
  );
}

/* ============================ Escenas por módulo ============================ */

const SL = "#CBD5E1"; // slate-300
const SL2 = "#94A3B8"; // slate-400
const LT = "#E7EDF4"; // muy claro

function scene(id: string, a: string): React.ReactNode {
  switch (id) {
    /* ---------- Planificar ---------- */
    case "diagnostico": // brechas: barras que crecen hacia una meta con lupa
      return (
        <g>
          <line x1="24" y1="80" x2="176" y2="80" stroke={SL} strokeWidth="2" />
          <line x1="24" y1="30" x2="176" y2="30" stroke={a} strokeWidth="1.6" strokeDasharray="4 4" />
          <path d="M170 30 l0 -12 l14 6 Z" fill={a} />
          <rect x="44" y="56" width="22" height="24" rx="2" fill={SL} />
          <rect x="86" y="44" width="22" height="36" rx="2" fill={`${a}99`} />
          <rect x="128" y="34" width="22" height="46" rx="2" fill={a} />
          <g stroke={a} strokeWidth="4" fill="#fff" opacity="0.95">
            <circle cx="60" cy="30" r="12" />
            <line x1="69" y1="39" x2="80" y2="50" strokeLinecap="round" />
          </g>
        </g>
      );
    case "contexto": // FODA 2x2 + globo
      return (
        <g>
          {[
            { x: 40, y: 20, t: "F" },
            { x: 104, y: 20, t: "O" },
            { x: 40, y: 56, t: "D" },
            { x: 104, y: 56, t: "A" },
          ].map((q, i) => (
            <g key={q.t}>
              <rect x={q.x} y={q.y} width="56" height="28" rx="5" fill={`${a}${i % 2 ? "18" : "2a"}`} />
              <text x={q.x + 28} y={q.y + 19} textAnchor="middle" fontSize="14" fontWeight="800" fill={a}>{q.t}</text>
            </g>
          ))}
          <circle cx="176" cy="24" r="12" fill="#fff" stroke={a} strokeWidth="2" />
          <path d="M164 24 h24 M176 12 a12 16 0 0 1 0 24 a12 16 0 0 1 0 -24" fill="none" stroke={a} strokeWidth="1.4" />
        </g>
      );
    case "planificacion": // calendario con objetivo (diana) y bandera
      return (
        <g>
          <rect x="34" y="20" width="98" height="66" rx="6" fill="#fff" stroke={SL} />
          <rect x="34" y="20" width="98" height="16" rx="6" fill={a} />
          {Array.from({ length: 12 }).map((_, i) => {
            const cx = 46 + (i % 4) * 24;
            const cy = 46 + Math.floor(i / 4) * 16;
            const on = i === 6;
            return <rect key={i} x={cx} y={cy} width="14" height="10" rx="2" fill={on ? `${a}22` : LT} />;
          })}
          {/* diana sobre un día */}
          <g transform="translate(101 51)">
            <circle r="9" fill="none" stroke={a} strokeWidth="2.5" />
            <circle r="4" fill={a} />
          </g>
          {/* bandera de meta */}
          <g transform="translate(150 28)">
            <line x1="0" y1="0" x2="0" y2="46" stroke={SL2} strokeWidth="2.5" />
            <path d="M0 2 L24 8 L0 16 Z" fill={a} />
          </g>
        </g>
      );
    case "procesos": // entrada -> [proceso/engranaje] -> salida
      return (
        <g>
          <rect x="18" y="38" width="36" height="24" rx="4" fill={SL} />
          <rect x="82" y="30" width="40" height="40" rx="6" fill={a} />
          <rect x="150" y="38" width="36" height="24" rx="4" fill={`${a}99`} />
          <Gear cx={102} cy={50} r={12} fill="#fff" hole={a} />
          <path d="M56 50 h22 M124 50 h22" stroke={a} strokeWidth="2.5" markerEnd="" strokeDasharray="1 4" strokeLinecap="round" />
          <path d="M78 50 l-7 -4 v8 Z" fill={a} />
          <path d="M146 50 l-7 -4 v8 Z" fill={a} />
        </g>
      );
    /* ---------- Implementar ---------- */
    case "dms": // carpeta con documentos y versión
      return (
        <g>
          <rect x="70" y="26" width="46" height="58" rx="4" fill="#fff" stroke={SL} transform="rotate(-6 93 55)" />
          <rect x="84" y="24" width="46" height="58" rx="4" fill="#fff" stroke={SL} />
          {[36, 46, 56, 66].map((y, i) => (
            <rect key={i} x="92" y={y} width={i === 3 ? 20 : 30} height="4" rx="2" fill={LT} />
          ))}
          <path d="M40 34 h26 l6 8 h44 a4 4 0 0 1 4 4 v34 a4 4 0 0 1 -4 4 H40 a4 4 0 0 1 -4 -4 V38 a4 4 0 0 1 4 -4 Z" fill={`${a}cc`} />
          <circle cx="120" cy="74" r="12" fill={a} />
          <text x="120" y="78" textAnchor="middle" fontSize="10" fontWeight="800" fill="#fff">v3</text>
        </g>
      );
    case "aprobaciones": // documento con sello de aprobado
      return (
        <g>
          <rect x="40" y="18" width="76" height="66" rx="5" fill="#fff" stroke={SL} />
          {[30, 40, 50, 60, 70].map((y, i) => (
            <rect key={i} x="50" y={y} width={i === 4 ? 30 : 56} height="4" rx="2" fill={LT} />
          ))}
          <g transform="rotate(-12 140 44)">
            <circle cx="140" cy="44" r="20" fill="none" stroke={a} strokeWidth="3" />
            <path d="M131 44 l6 7 l12 -14" stroke={a} strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </g>
      );
    case "capacitacion": // birrete + progreso + diploma
      return (
        <g>
          <path d="M60 34 L96 22 L132 34 L96 46 Z" fill={a} />
          <path d="M78 40 v12 a18 8 0 0 0 36 0 v-12" fill={`${a}66`} />
          <line x1="132" y1="34" x2="132" y2="50" stroke={a} strokeWidth="2" />
          <circle cx="132" cy="52" r="3" fill={a} />
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <rect x="46" y={64 + i * 10} width="80" height="6" rx="3" fill={LT} />
              <rect x="46" y={64 + i * 10} width={[70, 50, 32][i]} height="6" rx="3" fill={a} />
            </g>
          ))}
          <circle cx="150" cy="72" r="12" fill={`${a}22`} />
          <path d="M150 66 l2 4 4 0 -3 3 1 4 -4 -2 -4 2 1 -4 -3 -3 4 0 Z" fill={a} />
        </g>
      );
    case "equipos": // gauge/manómetro de calibración + calibre
      return (
        <g>
          <path d="M46 66 A34 34 0 0 1 114 66" fill="none" stroke={LT} strokeWidth="8" strokeLinecap="round" />
          <path d="M46 66 A34 34 0 0 1 92 34" fill="none" stroke={a} strokeWidth="8" strokeLinecap="round" />
          <line x1="80" y1="66" x2="104" y2="44" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
          <circle cx="80" cy="66" r="5" fill="#334155" />
          {/* calibre */}
          <g transform="translate(126 40)">
            <rect x="0" y="10" width="52" height="8" rx="2" fill={SL} />
            <rect x="6" y="2" width="8" height="22" rx="2" fill={a} />
            <rect x="34" y="2" width="8" height="22" rx="2" fill={`${a}99`} />
          </g>
        </g>
      );
    case "cmms": // llave + engranaje + calendario preventivo
      return (
        <g>
          <Gear cx={78} cy={50} r={26} fill={`${a}cc`} hole="#fff" />
          <Gear cx={118} cy={30} r={14} fill={`${a}88`} hole="#fff" />
          {/* llave inglesa */}
          <g transform="rotate(40 78 50)">
            <rect x="72" y="30" width="12" height="44" rx="4" fill="#fff" stroke={a} strokeWidth="3" />
            <path d="M72 30 a8 8 0 1 1 12 0 Z" fill="#fff" stroke={a} strokeWidth="3" />
          </g>
          <rect x="140" y="52" width="40" height="34" rx="4" fill="#fff" stroke={SL} />
          <rect x="140" y="52" width="40" height="9" rx="4" fill={a} />
          <path d="M150 72 l5 5 9 -10" stroke={a} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      );
    case "proveedores": // camión + estrellas de calificación
      return (
        <g>
          <rect x="30" y="38" width="60" height="34" rx="4" fill={a} />
          <path d="M90 46 h24 l16 14 v12 h-40 Z" fill={`${a}99`} />
          <rect x="96" y="50" width="18" height="12" rx="2" fill="#fff" opacity="0.7" />
          <circle cx="52" cy="76" r="8" fill="#334155" /><circle cx="52" cy="76" r="3" fill="#fff" />
          <circle cx="112" cy="76" r="8" fill="#334155" /><circle cx="112" cy="76" r="3" fill="#fff" />
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} cx={150 + (i % 3) * 16} cy={i < 3 ? 32 : 52} r={6} fill={i < 4 ? a : LT} />
          ))}
        </g>
      );
    case "sst": // casco + pirámide de incidentes
      return (
        <g>
          {/* casco */}
          <g transform="translate(46 34)">
            <path d="M4 24 a24 20 0 0 1 48 0 Z" fill={a} />
            <rect x="0" y="24" width="56" height="7" rx="3" fill={`${a}cc`} />
            <rect x="24" y="6" width="8" height="10" rx="2" fill="#fff" opacity="0.7" />
          </g>
          {/* pirámide */}
          {[
            { w: 22, c: "#DC2626" },
            { w: 44, c: "#EA580C" },
            { w: 66, c: "#F59E0B" },
            { w: 88, c: "#FCD34D" },
          ].map((r, i) => (
            <rect key={i} x={150 - r.w / 2} y={26 + i * 13} width={r.w} height="10" rx="2" fill={r.c} />
          ))}
        </g>
      );
    case "huella": // fábrica con humo + hoja + flecha baja
      return (
        <g>
          <rect x="40" y="50" width="70" height="34" fill={SL} />
          <rect x="52" y="38" width="12" height="20" fill={SL2} />
          <path d="M40 50 l18 -10 v10 Z M58 50 l18 -10 v10 Z M76 50 l18 -10 v10 Z" fill={SL2} />
          <rect x="50" y="62" width="12" height="14" fill="#fff" opacity="0.6" />
          <rect x="72" y="62" width="12" height="14" fill="#fff" opacity="0.6" />
          {/* humo */}
          <g fill={SL} opacity="0.5">
            <circle cx="58" cy="30" r="7" /><circle cx="68" cy="26" r="6" /><circle cx="50" cy="26" r="5" />
          </g>
          {/* hoja */}
          <path d="M150 34 q22 0 22 24 q-24 0 -24 -24 Z" fill={a} />
          <path d="M150 58 q6 -14 20 -22" stroke="#fff" strokeWidth="2" fill="none" />
          {/* flecha reducción */}
          <path d="M160 66 v14 M154 74 l6 8 6 -8" stroke={a} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      );
    /* ---------- Verificar ---------- */
    case "auditorias": // portapapeles con checklist + lupa
      return (
        <g>
          <rect x="52" y="20" width="66" height="70" rx="6" fill="#fff" stroke={SL} />
          <rect x="74" y="15" width="22" height="12" rx="3" fill={a} />
          {[34, 48, 62, 76].map((y, i) => (
            <g key={i}>
              <rect x="62" y={y - 5} width="11" height="11" rx="2" fill={i === 2 ? "#DC2626" : "#2E7D32"} />
              <path d={i === 2 ? `M64.5 ${y - 2} l6 6 M70.5 ${y - 2} l-6 6` : `M64 ${y} l2 2 4 -4`} stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" />
              <rect x="80" y={y - 3} width="30" height="5" rx="2" fill={LT} />
            </g>
          ))}
          <g stroke={a} strokeWidth="4" fill="#fff">
            <circle cx="122" cy="70" r="12" />
            <line x1="131" y1="79" x2="142" y2="90" strokeLinecap="round" />
          </g>
        </g>
      );
    case "campo": // teléfono con checklist + sin conexión + casco
      return (
        <g>
          <rect x="66" y="16" width="52" height="76" rx="8" fill="#0F1B2D" />
          <rect x="71" y="24" width="42" height="60" rx="3" fill="#fff" />
          <rect x="71" y="24" width="42" height="12" fill={a} />
          {[44, 56, 68].map((y, i) => (
            <g key={i}>
              <rect x="76" y={y - 4} width="9" height="9" rx="2" fill={i === 1 ? "#DC2626" : "#2E7D32"} />
              <rect x="89" y={y - 2} width="20" height="4" rx="2" fill={LT} />
            </g>
          ))}
          {/* pill sin conexión */}
          <g transform="translate(120 22)">
            <rect x="0" y="0" width="56" height="16" rx="8" fill="#F59E0B" />
            <path d="M8 10 a5 5 0 0 1 10 0" fill="none" stroke="#fff" strokeWidth="1.6" />
            <line x1="6" y1="4" x2="20" y2="14" stroke="#fff" strokeWidth="1.6" />
            <text x="34" y="11" textAnchor="middle" fontSize="7" fontWeight="700" fill="#fff">offline</text>
          </g>
          {/* casco pequeño */}
          <g transform="translate(126 52)">
            <path d="M2 12 a12 10 0 0 1 24 0 Z" fill={a} />
            <rect x="0" y="12" width="28" height="4" rx="2" fill={`${a}cc`} />
          </g>
        </g>
      );
    case "nc": // triángulo de alerta -> acción correctiva
      return (
        <g>
          <path d="M56 26 L88 78 L24 78 Z" fill="#DC2626" />
          <rect x="52" y="42" width="8" height="20" rx="3" fill="#fff" />
          <circle cx="56" cy="70" r="4" fill="#fff" />
          <path d="M98 52 h26" stroke={SL2} strokeWidth="2.5" strokeDasharray="1 4" strokeLinecap="round" />
          <path d="M124 52 l-8 -4 v8 Z" fill={SL2} />
          <circle cx="150" cy="52" r="22" fill={`${a}18`} />
          <Gear cx={150} cy={52} r={13} fill={a} hole="#fff" />
        </g>
      );
    case "satisfaccion": // caras (NPS) con la feliz seleccionada + estrellas
      return (
        <g>
          {[
            { cx: 46, happy: -1 },
            { cx: 100, happy: 0 },
            { cx: 154, happy: 1 },
          ].map((f, i) => {
            const sel = i === 2;
            return (
              <g key={i}>
                <circle cx={f.cx} cy="40" r={sel ? 22 : 18} fill={sel ? a : LT} />
                <circle cx={f.cx - 7} cy="36" r="2.5" fill={sel ? "#fff" : SL2} />
                <circle cx={f.cx + 7} cy="36" r="2.5" fill={sel ? "#fff" : SL2} />
                <path
                  d={
                    f.happy > 0
                      ? `M${f.cx - 8} 46 q8 8 16 0`
                      : f.happy < 0
                      ? `M${f.cx - 8} 50 q8 -8 16 0`
                      : `M${f.cx - 8} 48 h16`
                  }
                  stroke={sel ? "#fff" : SL2}
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                />
              </g>
            );
          })}
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} cx={70 + i * 16} cy={82} r={6} fill={i < 4 ? a : LT} />
          ))}
        </g>
      );
    case "kpis": // línea ascendente + flecha + valor
      return (
        <g>
          <line x1="26" y1="80" x2="180" y2="80" stroke={SL} strokeWidth="1.5" />
          <polyline points="30,70 62,60 90,66 120,44 150,34" fill="none" stroke={a} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M150 34 l-10 2 6 8 Z" fill={a} />
          {[30, 62, 90, 120, 150].map((x, i) => (
            <circle key={i} cx={x} cy={[70, 60, 66, 44, 34][i]} r="3" fill={a} />
          ))}
          <text x="150" y="24" textAnchor="middle" fontSize="12" fontWeight="800" fill={a}>+18%</text>
        </g>
      );
    /* ---------- Mejorar ---------- */
    case "reportes": // documento con gráficos + tag PDF + descarga
      return (
        <g>
          <rect x="50" y="16" width="80" height="74" rx="5" fill="#fff" stroke={SL} />
          <rect x="60" y="26" width="40" height="6" rx="3" fill={LT} />
          <rect x="60" y="46" width="10" height="20" rx="1" fill={`${a}99`} />
          <rect x="74" y="40" width="10" height="26" rx="1" fill={a} />
          <circle cx="108" cy="54" r="13" fill="none" stroke={LT} strokeWidth="6" />
          <circle cx="108" cy="54" r="13" fill="none" stroke={a} strokeWidth="6" strokeDasharray="55 82" transform="rotate(-90 108 54)" />
          <rect x="60" y="76" width="60" height="5" rx="2" fill={LT} />
          <g transform="translate(120 20)">
            <rect x="0" y="0" width="30" height="16" rx="3" fill="#DC2626" />
            <text x="15" y="12" textAnchor="middle" fontSize="8" fontWeight="800" fill="#fff">PDF</text>
          </g>
          <path d="M150 60 v20 M143 73 l7 8 7 -8" stroke={a} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      );
    case "direccion": // acta/informe con firma
      return (
        <g>
          <rect x="44" y="16" width="82" height="74" rx="5" fill="#fff" stroke={SL} />
          <rect x="54" y="26" width="46" height="7" rx="3" fill={a} />
          {[42, 51, 60].map((y, i) => (
            <rect key={i} x="54" y={y} width={i === 2 ? 40 : 62} height="4" rx="2" fill={LT} />
          ))}
          <path d="M54 76 q8 -12 16 0 t16 0 q5 -8 12 -2" fill="none" stroke={a} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="54" y1="83" x2="112" y2="83" stroke={SL} strokeWidth="1.5" />
          {/* sello acta */}
          <g transform="translate(150 40)">
            <circle r="20" fill={`${a}18`} />
            <circle r="14" fill="none" stroke={a} strokeWidth="2" />
            <text y="4" textAnchor="middle" fontSize="9" fontWeight="800" fill={a}>ACTA</text>
          </g>
        </g>
      );
    case "cambios": // ramas/merge con aprobación
      return (
        <g>
          <path d="M30 50 h40 q16 0 16 -22 h24" fill="none" stroke={a} strokeWidth="3" />
          <path d="M30 50 h40 q16 0 16 22 h24" fill="none" stroke={`${a}88`} strokeWidth="3" />
          <path d="M110 28 q16 0 16 22 h24" fill="none" stroke={a} strokeWidth="3" />
          <circle cx="30" cy="50" r="7" fill={a} />
          <circle cx="110" cy="28" r="6" fill={`${a}cc`} />
          <circle cx="110" cy="72" r="6" fill={`${a}88`} />
          <circle cx="150" cy="50" r="11" fill={a} />
          <path d="M145 50 l4 4 6 -7" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      );
    case "ia": // robot + burbuja con destello
      return (
        <g>
          {/* robot */}
          <line x1="70" y1="20" x2="70" y2="30" stroke={a} strokeWidth="2.5" />
          <circle cx="70" cy="17" r="4" fill={a} />
          <rect x="44" y="30" width="52" height="42" rx="10" fill={`${a}cc`} />
          <rect x="52" y="40" width="36" height="20" rx="6" fill="#fff" />
          <circle cx="63" cy="50" r="4" fill={a} /><circle cx="77" cy="50" r="4" fill={a} />
          <rect x="60" y="72" width="20" height="6" rx="2" fill={`${a}88`} />
          {/* burbuja */}
          <rect x="108" y="30" width="76" height="40" rx="10" fill="#fff" stroke={SL} />
          <path d="M120 70 l0 12 12 -12 Z" fill="#fff" stroke={SL} />
          {[40, 50, 60].map((y, i) => (
            <rect key={i} x="118" y={y - 2} width={[56, 44, 36][i]} height="4" rx="2" fill={LT} />
          ))}
          <path d="M170 26 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2 Z" fill={a} />
        </g>
      );
    default:
      return null;
  }
}

/* ------------------------------ primitivas ------------------------------ */

function Gear({ cx, cy, r, fill, hole }: { cx: number; cy: number; r: number; fill: string; hole: string }) {
  const teeth = 8;
  return (
    <g>
      {Array.from({ length: teeth }).map((_, i) => (
        <rect
          key={i}
          x={cx - r * 0.16}
          y={cy - r - r * 0.28}
          width={r * 0.32}
          height={r * 0.4}
          rx="1"
          fill={fill}
          transform={`rotate(${(i * 360) / teeth} ${cx} ${cy})`}
        />
      ))}
      <circle cx={cx} cy={cy} r={r} fill={fill} />
      <circle cx={cx} cy={cy} r={r * 0.42} fill={hole} />
    </g>
  );
}

function Star({ cx, cy, r, fill }: { cx: number; cy: number; r: number; fill: string }) {
  const pts = Array.from({ length: 10 }).map((_, i) => {
    const ang = (Math.PI / 5) * i - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.45;
    return `${cx + rad * Math.cos(ang)},${cy + rad * Math.sin(ang)}`;
  });
  return <polygon points={pts.join(" ")} fill={fill} />;
}
