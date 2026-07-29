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
 * Mismo lenguaje visual que el carrusel: fondo con degradé teñido del color del
 * módulo, panel flotante con un mockup abstracto (flat con sombra) que representa
 * la función, y un badge con el ícono. Autocontenido, sin assets externos.
 */

type Variant =
  | "bars"
  | "donut"
  | "checklist"
  | "kanban"
  | "doc"
  | "flow"
  | "calendar"
  | "stars"
  | "gauge"
  | "chat"
  | "leaf"
  | "shield"
  | "gears"
  | "signature"
  | "grad"
  | "quadrants"
  | "gap"
  | "offline";

export interface ModuleDef {
  id: string;
  name: string;
  desc: string;
  accent: string;
  Icon: React.ComponentType<{ className?: string }>;
  variant: Variant;
}

export const MODULES: ModuleDef[] = [
  { id: "diagnostico", name: "Diagnóstico y Brechas", desc: "Autoevaluación del estado del SGI y detección de brechas frente a la norma.", accent: "#003F87", Icon: ClipboardCheck, variant: "gap" },
  { id: "contexto", name: "Contexto Organizacional", desc: "FODA, PESTEL y partes interesadas para entender el contexto de la organización.", accent: "#0F766E", Icon: Globe, variant: "quadrants" },
  { id: "planificacion", name: "Planificación SGI", desc: "Objetivos, programa anual y calendario de auditorías en un solo lugar.", accent: "#7C3AED", Icon: Target, variant: "calendar" },
  { id: "procesos", name: "Gestión de Procesos", desc: "Mapa de procesos con entradas, salidas e indicadores enlazados.", accent: "#0369A1", Icon: Workflow, variant: "flow" },
  { id: "dms", name: "Gestión Documental (DMS)", desc: "Versionado, control de acceso y repositorio aislado por empresa.", accent: "#2563EB", Icon: FolderClosed, variant: "doc" },
  { id: "aprobaciones", name: "Aprobaciones de Calidad", desc: "Flujos de revisión y aprobación de documentos con trazabilidad.", accent: "#0891B2", Icon: CheckSquare, variant: "signature" },
  { id: "auditorias", name: "Auditorías Internas", desc: "Programa, ejecución y seguimiento de auditorías con checklists por norma.", accent: "#003F87", Icon: FileSearch, variant: "checklist" },
  { id: "campo", name: "Auditorías de Campo", desc: "Ejecución en el celular, incluso sin internet, con sincronización automática.", accent: "#F59E0B", Icon: ClipboardList, variant: "offline" },
  { id: "nc", name: "No Conformidades (ISO 9001)", desc: "Del hallazgo a la acción correctiva, con causa raíz y cierre.", accent: "#DC2626", Icon: AlertOctagon, variant: "kanban" },
  { id: "cambios", name: "Control de Cambios", desc: "Solicitud, evaluación de impacto y aprobación de cambios del sistema.", accent: "#9333EA", Icon: Shuffle, variant: "flow" },
  { id: "equipos", name: "Equipos y Calibración", desc: "Inventario de equipos y control de calibraciones y vencimientos.", accent: "#0D9488", Icon: Sliders, variant: "gauge" },
  { id: "capacitacion", name: "Planes y Competencias", desc: "Matriz de competencias, planes de capacitación y seguimiento.", accent: "#2563EB", Icon: GraduationCap, variant: "grad" },
  { id: "satisfaccion", name: "Satisfacción de Clientes", desc: "Encuestas, NPS y análisis de la percepción del cliente.", accent: "#DB2777", Icon: HeartHandshake, variant: "stars" },
  { id: "proveedores", name: "Gestión de Proveedores", desc: "Evaluación, calificación y seguimiento del desempeño de proveedores.", accent: "#B45309", Icon: Truck, variant: "bars" },
  { id: "huella", name: "Huella de Carbono", desc: "Cálculo de Alcance 1, 2 y 3 en tiempo real (ISO 14001).", accent: "#2E7D32", Icon: Leaf, variant: "leaf" },
  { id: "kpis", name: "KPIs e Indicadores", desc: "Tableros con metas, tendencias y alertas de tus indicadores clave.", accent: "#0284C7", Icon: Activity, variant: "bars" },
  { id: "direccion", name: "Revisión por la Dirección", desc: "Entradas, salidas y actas de la revisión por la dirección.", accent: "#1D4ED8", Icon: FileSignature, variant: "signature" },
  { id: "reportes", name: "Reporte SGI", desc: "Reportes consolidados del sistema, listos para exportar y compartir.", accent: "#003F87", Icon: Presentation, variant: "donut" },
  { id: "ia", name: "Auditor de IA", desc: "Copiloto experto en ISO 9001, 14001 y 45001, disponible 24/7.", accent: "#7C3AED", Icon: Sparkles, variant: "chat" },
  { id: "sst", name: "Seguridad y Salud (SST)", desc: "Pirámide de incidentes, actos inseguros y reportes en terreno (ISO 45001).", accent: "#EA580C", Icon: HardHat, variant: "shield" },
  { id: "cmms", name: "Mantenimiento (CMMS)", desc: "Órdenes de trabajo, mantenimiento preventivo y activos.", accent: "#475569", Icon: Wrench, variant: "gears" },
];

export function ModuleScene({ mod }: { mod: ModuleDef }) {
  const a = mod.accent;
  return (
    <div
      className="relative rounded-xl overflow-hidden border border-slate-200/70 dark:border-zinc-800 shadow-sm aspect-[16/10]"
      style={{ background: `linear-gradient(135deg, ${a}10, ${a}22)` }}
    >
      {/* blob */}
      <div className="absolute -right-8 -top-10 w-32 h-32 rounded-full" style={{ background: a, opacity: 0.1 }} />
      {/* badge de ícono */}
      <div
        className="absolute top-3 left-3 w-9 h-9 rounded-lg flex items-center justify-center shadow-sm z-10"
        style={{ background: a }}
      >
        <mod.Icon className="w-5 h-5 text-white" />
      </div>
      {/* panel flotante con el mockup */}
      <div className="absolute inset-x-4 bottom-4 top-14 rounded-lg bg-white dark:bg-zinc-950 shadow-md ring-1 ring-black/5 p-2.5 overflow-hidden">
        <Mock variant={mod.variant} accent={a} />
      </div>
    </div>
  );
}

/* ----------------------- Mockups por variante ----------------------- */

function Mock({ variant, accent }: { variant: Variant; accent: string }) {
  switch (variant) {
    case "bars":
      return (
        <div className="h-full flex items-end gap-1.5 px-1 pb-1">
          {[45, 70, 55, 85, 62, 78].map((h, i) => (
            <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: i % 2 ? accent : `${accent}88` }} />
          ))}
        </div>
      );
    case "donut":
      return (
        <div className="h-full flex items-center justify-center gap-3">
          <Ring accent={accent} pct={78} />
          <div className="space-y-1.5">
            {[100, 70, 45].map((w, i) => (
              <div key={i} className="h-1.5 rounded-full bg-slate-200 dark:bg-zinc-800" style={{ width: 46 * (w / 100) }} />
            ))}
          </div>
        </div>
      );
    case "checklist":
      return (
        <div className="h-full flex flex-col justify-center gap-1.5">
          {["conforme", "conforme", "noconf", "conforme"].map((s, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded flex items-center justify-center text-[8px] text-white" style={{ background: s === "noconf" ? "#DC2626" : "#2E7D32" }}>
                {s === "noconf" ? "✕" : "✓"}
              </span>
              <span className="h-1.5 rounded-full bg-slate-200 dark:bg-zinc-800" style={{ width: `${55 + ((i * 13) % 35)}%` }} />
            </div>
          ))}
        </div>
      );
    case "offline":
      return (
        <div className="h-full flex flex-col justify-center gap-1.5">
          <div className="flex items-center gap-1 self-end text-[8px] font-bold text-amber-700 bg-amber-100 rounded-full px-1.5 py-0.5">◴ sin conexión</div>
          {["conforme", "noconf", "conforme"].map((s, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded flex items-center justify-center text-[8px] text-white" style={{ background: s === "noconf" ? "#DC2626" : "#2E7D32" }}>
                {s === "noconf" ? "✕" : "✓"}
              </span>
              <span className="h-1.5 rounded-full bg-slate-200 dark:bg-zinc-800" style={{ width: `${60 + ((i * 15) % 30)}%` }} />
              <span className="ml-auto text-[8px]" style={{ color: accent }}>⟳</span>
            </div>
          ))}
        </div>
      );
    case "kanban":
      return (
        <div className="h-full grid grid-cols-3 gap-1.5">
          {[
            { t: "Abierta", c: "#DC2626", n: 2 },
            { t: "Análisis", c: "#D97706", n: 1 },
            { t: "Cerrada", c: "#2E7D32", n: 1 },
          ].map((col) => (
            <div key={col.t} className="flex flex-col gap-1">
              <span className="text-[7px] font-bold uppercase" style={{ color: col.c }}>{col.t}</span>
              {Array.from({ length: col.n }).map((_, i) => (
                <div key={i} className="rounded p-1" style={{ background: `${col.c}18` }}>
                  <div className="h-1 rounded-full" style={{ width: "80%", background: `${col.c}88` }} />
                </div>
              ))}
            </div>
          ))}
        </div>
      );
    case "doc":
      return (
        <div className="h-full flex items-center justify-center">
          <div className="w-14 h-full max-h-[70px] rounded bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-1.5 space-y-1 relative">
            {[100, 85, 92, 70, 88].map((w, i) => (
              <div key={i} className="h-1 rounded-full bg-slate-200 dark:bg-zinc-800" style={{ width: `${w}%` }} />
            ))}
            <div className="absolute -right-2 -bottom-2 w-6 h-6 rounded-full flex items-center justify-center text-[9px] text-white shadow" style={{ background: accent }}>v3</div>
          </div>
        </div>
      );
    case "flow":
      return (
        <svg viewBox="0 0 120 60" className="w-full h-full">
          <line x1="22" y1="30" x2="58" y2="30" stroke={accent} strokeWidth="2" strokeDasharray="2 3" />
          <line x1="66" y1="30" x2="98" y2="18" stroke={accent} strokeWidth="2" strokeDasharray="2 3" />
          <line x1="66" y1="30" x2="98" y2="44" stroke={accent} strokeWidth="2" strokeDasharray="2 3" />
          <rect x="6" y="22" width="16" height="16" rx="4" fill={accent} />
          <rect x="54" y="22" width="16" height="16" rx="4" fill={`${accent}cc`} />
          <rect x="98" y="10" width="16" height="16" rx="4" fill={`${accent}88`} />
          <rect x="98" y="36" width="16" height="16" rx="4" fill={`${accent}88`} />
        </svg>
      );
    case "calendar":
      return (
        <div className="h-full grid grid-cols-6 gap-1 p-1 content-center">
          {Array.from({ length: 18 }).map((_, i) => {
            const on = [3, 7, 10, 14].includes(i);
            return <div key={i} className="rounded-sm aspect-square" style={{ background: on ? accent : `${accent}22` }} />;
          })}
        </div>
      );
    case "stars":
      return (
        <div className="h-full flex flex-col justify-center gap-2">
          <div className="flex gap-1" style={{ color: accent }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className="text-sm" style={{ opacity: i < 4 ? 1 : 0.25 }}>★</span>
            ))}
          </div>
          <div className="space-y-1">
            {[90, 60].map((w, i) => (
              <div key={i} className="h-1.5 rounded-full" style={{ width: `${w}%`, background: `${accent}66` }} />
            ))}
          </div>
        </div>
      );
    case "gauge":
      return (
        <div className="h-full flex items-center justify-center">
          <svg viewBox="0 0 100 56" className="w-24">
            <path d="M8 50 A42 42 0 0 1 92 50" fill="none" stroke="#E2E8F0" strokeWidth="9" strokeLinecap="round" />
            <path d="M8 50 A42 42 0 0 1 78 20" fill="none" stroke={accent} strokeWidth="9" strokeLinecap="round" />
            <line x1="50" y1="50" x2="70" y2="28" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="50" cy="50" r="4" fill="#334155" />
          </svg>
        </div>
      );
    case "chat":
      return (
        <div className="h-full flex flex-col justify-center gap-1.5">
          <div className="self-end rounded-lg rounded-tr-sm px-2 py-1 text-[7px] text-white max-w-[75%]" style={{ background: accent }}>¿Qué exige la 7.5?</div>
          <div className="self-start rounded-lg rounded-tl-sm px-2 py-1 text-[7px] bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 max-w-[85%]">Información documentada: control de versiones…</div>
          <div className="self-start flex items-center gap-1 text-[7px] font-semibold" style={{ color: accent }}>✦ Generar checklist</div>
        </div>
      );
    case "leaf":
      return (
        <div className="h-full flex items-end gap-1.5 px-1 pb-1">
          {[40, 65, 85].map((h, i) => (
            <div key={i} className="flex-1 h-full flex flex-col items-center justify-end">
              <span className="text-[8px] mb-0.5" style={{ color: accent }}>🌿</span>
              <div className="w-full rounded-t" style={{ height: `${h}%`, background: i === 2 ? accent : `${accent}88` }} />
              <span className="text-[6px] text-slate-400 mt-0.5">A{i + 1}</span>
            </div>
          ))}
        </div>
      );
    case "shield":
      return (
        <div className="h-full flex flex-col items-center justify-center gap-0.5">
          {[
            { w: 30, c: "#DC2626" },
            { w: 55, c: "#EA580C" },
            { w: 80, c: "#F59E0B" },
          ].map((r, i) => (
            <div key={i} className="h-3 rounded-sm" style={{ width: `${r.w}%`, background: r.c }} />
          ))}
          <div className="h-3 rounded-sm" style={{ width: "100%", background: "#FCD34D" }} />
        </div>
      );
    case "gears":
      return (
        <div className="h-full flex items-center justify-center gap-1">
          <svg viewBox="0 0 60 60" className="w-16 h-16">
            <Gear cx={24} cy={30} r={13} fill={accent} />
            <Gear cx={42} cy={20} r={9} fill={`${accent}99`} />
          </svg>
        </div>
      );
    case "signature":
      return (
        <div className="h-full flex flex-col justify-center gap-2 px-1">
          <div className="space-y-1">
            {[100, 80].map((w, i) => (
              <div key={i} className="h-1.5 rounded-full bg-slate-200 dark:bg-zinc-800" style={{ width: `${w}%` }} />
            ))}
          </div>
          <svg viewBox="0 0 80 20" className="w-20 h-5" style={{ color: accent }}>
            <path d="M2 14 q6 -12 12 0 t12 0 q4 -8 10 -2 t14 2 q6 -4 12 0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <div className="h-px w-24 bg-slate-300 dark:bg-zinc-700" />
        </div>
      );
    case "grad":
      return (
        <div className="h-full flex flex-col justify-center gap-1.5">
          {["Auditor", "Calidad", "SST"].map((_, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="text-[9px]">🎓</span>
              <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${[90, 65, 40][i]}%`, background: accent }} />
              </div>
            </div>
          ))}
        </div>
      );
    case "quadrants":
      return (
        <div className="h-full grid grid-cols-2 grid-rows-2 gap-1">
          {["F", "O", "D", "A"].map((q, i) => (
            <div key={q} className="rounded flex items-center justify-center text-[10px] font-bold" style={{ background: `${accent}${i % 2 ? "18" : "28"}`, color: accent }}>{q}</div>
          ))}
        </div>
      );
    case "gap":
      return (
        <div className="h-full flex items-end gap-2 px-1 pb-1">
          {[
            [40, 75],
            [55, 90],
            [30, 70],
          ].map((pair, i) => (
            <div key={i} className="flex-1 h-full flex items-end gap-0.5">
              <div className="flex-1 rounded-t bg-slate-300 dark:bg-zinc-700" style={{ height: `${pair[0]}%` }} />
              <div className="flex-1 rounded-t" style={{ height: `${pair[1]}%`, background: accent }} />
            </div>
          ))}
        </div>
      );
    default:
      return null;
  }
}

function Ring({ accent, pct }: { accent: string; pct: number }) {
  const r = 16;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 44 44" className="w-11 h-11">
      <circle cx="22" cy="22" r={r} fill="none" stroke="#E2E8F0" strokeWidth="6" />
      <circle cx="22" cy="22" r={r} fill="none" stroke={accent} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${(c * pct) / 100} ${c}`} transform="rotate(-90 22 22)" />
      <text x="22" y="26" textAnchor="middle" fontSize="11" fontWeight="700" fill={accent}>{pct}</text>
    </svg>
  );
}

function Gear({ cx, cy, r, fill }: { cx: number; cy: number; r: number; fill: string }) {
  const teeth = 8;
  const rects = Array.from({ length: teeth }).map((_, i) => {
    const ang = (i * 360) / teeth;
    return <rect key={i} x={cx - 2} y={cy - r - 3} width="4" height="6" rx="1" fill={fill} transform={`rotate(${ang} ${cx} ${cy})`} />;
  });
  return (
    <g>
      {rects}
      <circle cx={cx} cy={cy} r={r} fill={fill} />
      <circle cx={cx} cy={cy} r={r * 0.45} fill="#fff" />
    </g>
  );
}
