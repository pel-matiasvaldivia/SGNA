"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  BarChart3,
  WifiOff,
  AlertOctagon,
  Leaf,
  BrainCircuit,
  CheckCircle2,
  TrendingUp,
  Camera,
  MapPin,
  PenLine,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";

/**
 * Carrusel del hero: muestra, con mockups animados de la propia interfaz,
 * cómo se usa el sistema y qué beneficio entrega cada módulo.
 * Auto-avanza cada 6s, se pausa al pasar el mouse, con flechas y puntos.
 */

const SLIDES = [
  {
    id: "tablero",
    tag: "Tablero de Control",
    title: "Todo el cumplimiento, en un solo panel",
    desc: "Estado de auditorías, hallazgos y KPIs en tiempo real. Deje de perseguir planillas: la dirección ve la foto completa de un vistazo.",
    accent: "#003F87",
    Icon: BarChart3,
    visual: <VisualDashboard />,
  },
  {
    id: "campo",
    tag: "Auditor en Campo",
    title: "Audite en sitio, incluso sin internet",
    desc: "Sus auditores ejecutan los controles desde el celular en planta u obra. Al reconectar, todo se sincroniza solo. Cero papeles, cero reprocesos.",
    accent: "#F59E0B",
    Icon: WifiOff,
    visual: <VisualCampo />,
  },
  {
    id: "nc",
    tag: "No Conformidades",
    title: "Del hallazgo a la acción correctiva",
    desc: "Cada 'no conforme' abre una NC con análisis de causa raíz y seguimiento. Nada se pierde entre el hallazgo y el cierre efectivo.",
    accent: "#DC2626",
    Icon: AlertOctagon,
    visual: <VisualNC />,
  },
  {
    id: "huella",
    tag: "Huella de Carbono · ISO 14001",
    title: "Mida su impacto ambiental en vivo",
    desc: "Cálculo automático de Alcance 1, 2 y 3. Demuestre su compromiso ambiental con datos, no con promesas.",
    accent: "#2E7D32",
    Icon: Leaf,
    visual: <VisualHuella />,
  },
  {
    id: "ia",
    tag: "IA Auditor Copilot",
    title: "Un experto en normas ISO, 24/7",
    desc: "Consulte requisitos, redacte hallazgos y prepare auditorías con un copiloto que conoce ISO 9001, 14001 y 45001.",
    accent: "#7C3AED",
    Icon: BrainCircuit,
    visual: <VisualIA />,
  },
];

export default function HeroCarousel() {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = SLIDES.length;

  const go = useCallback((i: number) => setIdx(((i % n) + n) % n), [n]);
  const next = useCallback(() => setIdx((p) => (p + 1) % n), [n]);
  const prev = useCallback(() => setIdx((p) => (p - 1 + n) % n), [n]);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setIdx((p) => (p + 1) % n), 6000);
    return () => clearInterval(t);
  }, [paused, n]);

  const slide = SLIDES[idx];

  return (
    <div
      className="rounded-2xl border border-slate-200/50 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl p-2 shadow-2xl select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-zinc-950 dark:to-zinc-900 aspect-video">
        {/* Slides */}
        {SLIDES.map((s, i) => (
          <div
            key={s.id}
            className={`absolute inset-0 transition-all duration-700 ease-out ${
              i === idx ? "opacity-100 translate-x-0" : i < idx ? "opacity-0 -translate-x-6 pointer-events-none" : "opacity-0 translate-x-6 pointer-events-none"
            }`}
          >
            <div className="h-full w-full grid md:grid-cols-2 gap-4 p-5 sm:p-8">
              {/* Texto */}
              <div className="flex flex-col justify-center order-2 md:order-1">
                <span
                  className="inline-flex items-center gap-1.5 self-start px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide mb-3"
                  style={{ color: s.accent, backgroundColor: `${s.accent}14` }}
                >
                  <s.Icon className="w-3.5 h-3.5" /> {s.tag}
                </span>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white leading-tight font-heading">
                  {s.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 leading-relaxed max-w-md">
                  {s.desc}
                </p>
              </div>
              {/* Mockup */}
              <div className="order-1 md:order-2 flex items-center justify-center min-h-0">
                {s.visual}
              </div>
            </div>
          </div>
        ))}

        {/* Flechas */}
        <button
          onClick={prev}
          aria-label="Anterior"
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/80 dark:bg-zinc-800/80 backdrop-blur shadow-md flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-white hover:scale-110 transition"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={next}
          aria-label="Siguiente"
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/80 dark:bg-zinc-800/80 backdrop-blur shadow-md flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-white hover:scale-110 transition"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Puntos + barra de progreso */}
      <div className="flex items-center justify-center gap-2 py-3">
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            onClick={() => go(i)}
            aria-label={`Ir al slide ${i + 1}`}
            className="group relative h-2 rounded-full transition-all duration-300 overflow-hidden"
            style={{
              width: i === idx ? 32 : 8,
              backgroundColor: i === idx ? undefined : "rgb(203 213 225)",
            }}
          >
            {i === idx && (
              <span
                className="absolute inset-0 rounded-full"
                style={{ backgroundColor: s.accent }}
              >
                <span
                  key={`${idx}-${paused}`}
                  className="absolute inset-y-0 left-0 rounded-full bg-white/40"
                  style={{ animation: paused ? "none" : "carouselFill 6s linear forwards" }}
                />
              </span>
            )}
          </button>
        ))}
      </div>

      <style>{`@keyframes carouselFill { from { width: 0% } to { width: 100% } }`}</style>
    </div>
  );
}

/* ---------- Mockups (autocontenidos, sin assets externos) ---------- */

function BrowserFrame({ children, url }: { children: React.ReactNode; url: string }) {
  return (
    <div className="w-full max-w-sm rounded-xl overflow-hidden shadow-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
      <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-zinc-800 border-b border-slate-200 dark:border-zinc-700">
        <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
        <span className="ml-2 flex-1 text-[9px] text-slate-400 bg-white dark:bg-zinc-900 rounded px-2 py-0.5 truncate">{url}</span>
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

function VisualDashboard() {
  const bars = [40, 65, 50, 80, 60, 90, 72];
  return (
    <BrowserFrame url="sgna.auditoriasenlinea.com.ar/dashboard">
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { v: "98%", l: "Cumplim.", c: "text-green-600" },
          { v: "12", l: "Auditorías", c: "text-primary" },
          { v: "3", l: "NC abiertas", c: "text-red-500" },
        ].map((k) => (
          <div key={k.l} className="rounded-lg bg-slate-50 dark:bg-zinc-800 p-2 text-center">
            <p className={`text-base font-bold tabular-nums ${k.c}`}>{k.v}</p>
            <p className="text-[8px] text-slate-500 uppercase font-semibold">{k.l}</p>
          </div>
        ))}
      </div>
      <div className="rounded-lg bg-slate-50 dark:bg-zinc-800 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] font-bold text-slate-500 uppercase">Avance por norma</span>
          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-green-600"><TrendingUp className="w-3 h-3" /> +14%</span>
        </div>
        <div className="flex items-end gap-1.5 h-16">
          {bars.map((h, i) => (
            <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-primary to-secondary" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
    </BrowserFrame>
  );
}

function VisualCampo() {
  return (
    <div className="relative">
      <div className="absolute -top-3 -left-3 z-10 flex items-center gap-1 rounded-full bg-amber-500 text-amber-950 pl-2 pr-2.5 py-1 shadow-lg text-[9px] font-bold">
        <WifiOff className="w-3 h-3" /> Sin conexión
      </div>
      <div className="w-[150px] rounded-[1.5rem] bg-slate-900 p-2 shadow-xl border-2 border-slate-800">
        <div className="rounded-[1.1rem] bg-slate-50 overflow-hidden">
          <div className="bg-primary text-white px-3 pt-4 pb-3">
            <p className="text-[8px] uppercase tracking-wide text-white/70 font-bold">Auditoría</p>
            <p className="text-[11px] font-bold leading-tight">Depósito · ISO 45001</p>
            <div className="mt-2 h-1 rounded-full bg-white/20 overflow-hidden">
              <div className="h-full w-2/3 bg-white rounded-full" />
            </div>
          </div>
          <div className="p-2 space-y-1.5">
            <div className="bg-white rounded-lg border border-green-200 p-2">
              <p className="text-[7px] font-mono font-bold text-primary">8.1.2 EPP</p>
              <div className="flex items-center gap-1 mt-1 text-[8px] font-bold text-green-700">
                <CheckCircle2 className="w-2.5 h-2.5" /> Conforme
                <span className="ml-auto flex gap-0.5 text-slate-400"><Camera className="w-2.5 h-2.5" /><MapPin className="w-2.5 h-2.5" /></span>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-red-200 p-2">
              <p className="text-[7px] font-mono font-bold text-primary">6.1.1 Riesgos</p>
              <div className="flex items-center gap-1 mt-1 text-[8px] font-bold text-red-600">
                <AlertOctagon className="w-2.5 h-2.5" /> No conforme
              </div>
            </div>
            <div className="bg-secondary text-white text-[8px] font-bold rounded-lg py-1.5 flex items-center justify-center gap-1">
              <PenLine className="w-2.5 h-2.5" /> Firmar
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function VisualNC() {
  const cols = [
    { t: "Abierta", c: "border-red-200 bg-red-50", d: "text-red-600", items: ["Señalización", "Registro EPP"] },
    { t: "En análisis", c: "border-amber-200 bg-amber-50", d: "text-amber-600", items: ["Causa raíz"] },
    { t: "Cerrada", c: "border-green-200 bg-green-50", d: "text-green-600", items: ["Calibración"] },
  ];
  return (
    <BrowserFrame url="sgna.auditoriasenlinea.com.ar/no-conformidades">
      <div className="grid grid-cols-3 gap-1.5">
        {cols.map((col) => (
          <div key={col.t}>
            <p className={`text-[8px] font-bold uppercase mb-1.5 ${col.d}`}>{col.t}</p>
            <div className="space-y-1.5">
              {col.items.map((it) => (
                <div key={it} className={`rounded-md border p-1.5 ${col.c}`}>
                  <p className="text-[8px] font-semibold text-slate-700 leading-tight">{it}</p>
                  <div className="mt-1 h-0.5 w-full rounded bg-slate-300/60" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800 px-2 py-1.5">
        <AlertOctagon className="w-3.5 h-3.5 text-red-500" />
        <p className="text-[8px] text-slate-600 dark:text-slate-300">Análisis de causa raíz · 5 Porqués e Ishikawa</p>
      </div>
    </BrowserFrame>
  );
}

function VisualHuella() {
  const scopes = [
    { l: "Alcance 1", v: "42 t", w: "60%", c: "from-green-500 to-green-400" },
    { l: "Alcance 2", v: "28 t", w: "40%", c: "from-emerald-500 to-emerald-400" },
    { l: "Alcance 3", v: "71 t", w: "85%", c: "from-teal-500 to-teal-400" },
  ];
  return (
    <BrowserFrame url="sgna.auditoriasenlinea.com.ar/huella">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
          <Leaf className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <p className="text-base font-bold text-slate-900 dark:text-white tabular-nums leading-none">141 tCO₂e</p>
          <p className="text-[8px] text-slate-500 uppercase font-semibold mt-0.5">Total anual</p>
        </div>
        <span className="ml-auto inline-flex items-center gap-0.5 text-[9px] font-bold text-green-600"><TrendingUp className="w-3 h-3 rotate-180" /> -8%</span>
      </div>
      <div className="space-y-2">
        {scopes.map((s) => (
          <div key={s.l}>
            <div className="flex justify-between text-[8px] font-semibold text-slate-500 mb-0.5">
              <span>{s.l}</span><span className="tabular-nums">{s.v}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
              <div className={`h-full rounded-full bg-gradient-to-r ${s.c}`} style={{ width: s.w }} />
            </div>
          </div>
        ))}
      </div>
    </BrowserFrame>
  );
}

function VisualIA() {
  return (
    <BrowserFrame url="sgna.auditoriasenlinea.com.ar/ia-auditor">
      <div className="space-y-2">
        <div className="flex justify-end">
          <div className="bg-primary text-white rounded-2xl rounded-tr-sm px-3 py-1.5 max-w-[80%]">
            <p className="text-[9px] leading-snug">¿Qué exige la cláusula 7.5 de ISO 9001?</p>
          </div>
        </div>
        <div className="flex items-start gap-1.5">
          <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Sparkles className="w-3 h-3 text-purple-600" />
          </div>
          <div className="bg-slate-100 dark:bg-zinc-800 rounded-2xl rounded-tl-sm px-3 py-1.5 max-w-[85%]">
            <p className="text-[9px] leading-snug text-slate-700 dark:text-slate-200">
              La 7.5 requiere <b>información documentada</b>: creación, control de versiones y disponibilidad. Te preparo la checklist…
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-2 py-1.5">
          <ArrowUpRight className="w-3 h-3 text-purple-600" />
          <p className="text-[8px] text-purple-700 font-semibold">Generar checklist 7.5 →</p>
        </div>
      </div>
    </BrowserFrame>
  );
}
