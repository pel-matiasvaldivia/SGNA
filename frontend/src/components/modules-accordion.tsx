"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { MODULES, PHASES, ModuleScene } from "./module-scenes";

/**
 * Acordeón de módulos agrupados por etapa del workflow (PDCA).
 * Cada etapa es un encabezado clickeable: al tocarlo, se despliegan o se ocultan
 * las tarjetas de sus módulos.
 */

const PHASE_COLOR: Record<string, string> = {
  plan: "#003F87",
  do: "#0F766E",
  check: "#B45309",
  act: "#7C3AED",
};

export default function ModulesAccordion() {
  // Primera etapa abierta por defecto para que la sección no arranque vacía.
  const [open, setOpen] = useState<Record<string, boolean>>({ plan: true });
  const toggle = (k: string) => setOpen((o) => ({ ...o, [k]: !o[k] }));

  return (
    <div className="space-y-4">
      {PHASES.map((ph, i) => {
        const mods = MODULES.filter((m) => m.phase === ph.key);
        const isOpen = !!open[ph.key];
        const color = PHASE_COLOR[ph.key];
        const [num, ...rest] = ph.label.split(" · ");
        const title = rest.join(" · ");
        return (
          <div
            key={ph.key}
            className="border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-950 shadow-sm"
          >
            <button
              onClick={() => toggle(ph.key)}
              aria-expanded={isOpen}
              className="w-full flex items-center gap-4 p-4 sm:p-5 text-left hover:bg-slate-50 dark:hover:bg-zinc-900 transition"
            >
              {/* número de etapa */}
              <span
                className="flex-none w-11 h-11 rounded-xl flex items-center justify-center text-lg font-extrabold text-white shadow-sm"
                style={{ background: color }}
              >
                {num}
              </span>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-heading">
                  {title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate">{ph.desc}</p>
              </div>
              {/* contador */}
              <span
                className="hidden sm:inline-flex flex-none items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                style={{ color, background: `${color}14` }}
              >
                {mods.length} módulos
              </span>
              {/* mini avatares de íconos de los módulos (preview cuando está cerrado) */}
              {!isOpen && (
                <div className="hidden lg:flex flex-none -space-x-2">
                  {mods.slice(0, 5).map((m) => (
                    <span
                      key={m.id}
                      className="w-7 h-7 rounded-lg ring-2 ring-white dark:ring-zinc-950 flex items-center justify-center"
                      style={{ background: m.accent }}
                    >
                      <m.Icon className="w-3.5 h-3.5 text-white" />
                    </span>
                  ))}
                  {mods.length > 5 && (
                    <span className="w-7 h-7 rounded-lg ring-2 ring-white dark:ring-zinc-950 bg-slate-200 dark:bg-zinc-800 flex items-center justify-center text-[9px] font-bold text-slate-600 dark:text-slate-300">
                      +{mods.length - 5}
                    </span>
                  )}
                </div>
              )}
              <ChevronDown
                className={`flex-none w-5 h-5 text-slate-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* tarjetas de la etapa */}
            {isOpen && (
              <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-slate-100 dark:border-zinc-900">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-4 animate-fade-in">
                  {mods.map((mod) => (
                    <div key={mod.id} className="group">
                      <ModuleScene mod={mod} />
                      <h4 className="mt-3 font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full flex-none" style={{ background: mod.accent }} />
                        {mod.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug">{mod.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
