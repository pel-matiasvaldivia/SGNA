"use client";

import React, { useMemo, useState } from "react";
import { LifeBuoy, Search, ChevronDown, PlayCircle, ListChecks, Lightbulb, ArrowRight } from "lucide-react";
import Link from "next/link";
import { MODULES } from "@/lib/modules-info";
import { START_TOUR_EVENT } from "@/components/onboarding-tour";

export default function AyudaPage() {
  const [query, setQuery] = useState("");
  const [openKey, setOpenKey] = useState<string | null>(MODULES[0]?.key ?? null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MODULES;
    return MODULES.filter((m) =>
      [m.name, m.tagline, m.description, m.clause, ...m.howTo, ...m.recommendations]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [query]);

  const replayTour = () => window.dispatchEvent(new Event(START_TOUR_EVENT));

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading flex items-center gap-2">
            <LifeBuoy className="w-8 h-8 text-secondary" /> Centro de Ayuda
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Qué hace cada módulo, cómo usarlo y recomendaciones para sacarle el máximo provecho.
          </p>
        </div>
        <button
          onClick={replayTour}
          className="inline-flex items-center justify-center gap-2 py-2.5 px-5 bg-secondary text-white font-bold rounded-lg text-sm hover:opacity-95 shadow transition"
        >
          <PlayCircle className="w-4 h-4" /> Ver tour de bienvenida
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar un módulo o tema (ej. auditoría, riesgos, calibración)…"
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40"
        />
      </div>

      {/* Module list */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="p-10 text-center text-sm text-muted-foreground bg-white dark:bg-zinc-950 border border-border rounded-xl">
            No se encontraron módulos para “{query}”.
          </div>
        )}

        {filtered.map((m) => {
          const Icon = m.icon;
          const isOpen = openKey === m.key;
          return (
            <div key={m.key} className="bg-white dark:bg-zinc-950 border border-border rounded-xl overflow-hidden shadow-sm">
              <button
                onClick={() => setOpenKey(isOpen ? null : m.key)}
                className="w-full flex items-center gap-4 p-4 text-left hover:bg-muted/20 transition"
              >
                <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm">{m.name}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{m.clause}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{m.tagline}</div>
                </div>
                <ChevronDown className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>

              {isOpen && (
                <div className="px-4 pb-5 pt-1 space-y-5 border-t border-border">
                  <p className="text-sm text-muted-foreground pt-4">{m.description}</p>

                  <div>
                    <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground mb-2">
                      <ListChecks className="w-4 h-4 text-secondary" /> Cómo usarlo
                    </h4>
                    <ol className="space-y-1.5">
                      {m.howTo.map((s, i) => (
                        <li key={i} className="flex gap-2.5 text-sm">
                          <span className="w-5 h-5 rounded-full bg-secondary/15 text-secondary font-bold text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div>
                    <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground mb-2">
                      <Lightbulb className="w-4 h-4 text-amber-500" /> Recomendaciones
                    </h4>
                    <ul className="space-y-1.5">
                      {m.recommendations.map((r, i) => (
                        <li key={i} className="flex gap-2.5 text-sm text-muted-foreground">
                          <span className="text-amber-500 mt-1.5 flex-shrink-0">•</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link
                    href={m.path}
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-secondary hover:underline"
                  >
                    Ir a {m.name} <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
