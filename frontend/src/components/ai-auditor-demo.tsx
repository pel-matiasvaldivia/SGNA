"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Sparkles,
  Send,
  Search,
  ShieldAlert,
  GitBranch,
  Activity,
  Check,
  X,
  Minus,
  Database,
} from "lucide-react";

/**
 * Demo interactiva del Auditor de IA, embebida en la landing.
 * El visitante toca una pregunta y ve una respuesta rica (brechas, riesgo,
 * causa raíz o KPIs), reflejando lo que el módulo hace sobre los datos reales
 * del SGI del cliente. Todo simulado en el cliente.
 */

const ACCENT = "#7C3AED";

type Kind = "gap" | "risk" | "root" | "kpi";
type Msg = { from: "user" | "ai"; kind?: Kind; text?: string };

const CHIPS: { kind: Kind; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { kind: "gap", label: "Analizá mis brechas de cumplimiento", Icon: Search },
  { kind: "risk", label: "¿Cómo mitigo este riesgo?", Icon: ShieldAlert },
  { kind: "root", label: "Causa raíz de una No Conformidad", Icon: GitBranch },
  { kind: "kpi", label: "Resumen de mis KPIs", Icon: Activity },
];

export default function AiAuditorDemo() {
  const [msgs, setMsgs] = useState<Msg[]>([
    { from: "ai", text: "greet" },
  ]);
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, typing]);

  const ask = (chip: (typeof CHIPS)[number]) => {
    setMsgs((m) => [...m, { from: "user", text: chip.label }]);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMsgs((m) => [...m, { from: "ai", kind: chip.kind }]);
    }, 900);
  };

  const used = new Set(msgs.filter((m) => m.from === "ai" && m.kind).map((m) => m.kind));

  return (
    <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 text-white" style={{ background: `linear-gradient(135deg, ${ACCENT}, #4F1D96)` }}>
        <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-sm leading-tight">Auditor de IA</p>
          <p className="text-[11px] text-white/75 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> Experto en ISO 9001 · 14001 · 45001
          </p>
        </div>
        <span className="text-[9px] font-bold bg-white/15 rounded-full px-2 py-1 flex items-center gap-1">
          <Database className="w-3 h-3" /> tus datos
        </span>
      </div>

      {/* Conversación */}
      <div ref={scrollRef} className="h-[300px] overflow-y-auto p-3 space-y-2.5 bg-slate-50 dark:bg-zinc-900/40">
        {msgs.map((m, i) =>
          m.from === "user" ? (
            <div key={i} className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-br-sm px-3 py-2 text-[13px] text-white" style={{ background: ACCENT }}>
                {m.text}
              </div>
            </div>
          ) : (
            <div key={i} className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-none mt-0.5" style={{ background: `${ACCENT}22` }}>
                <Sparkles className="w-3.5 h-3.5" style={{ color: ACCENT }} />
              </div>
              <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-3 py-2 text-[12.5px] text-slate-700 dark:text-slate-200 shadow-sm">
                {m.text === "greet" ? (
                  <>¡Hola! Soy tu auditor de IA. Analizo <b>tus</b> datos del SGI: cumplimiento, riesgos, no conformidades y KPIs. Tocá una pregunta 👇</>
                ) : (
                  <Answer kind={m.kind!} />
                )}
              </div>
            </div>
          )
        )}
        {typing && (
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-none mt-0.5" style={{ background: `${ACCENT}22` }}>
              <Sparkles className="w-3.5 h-3.5" style={{ color: ACCENT }} />
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-3 py-2.5 shadow-sm">
              <span className="flex gap-1">
                <Dot /> <Dot delay={0.15} /> <Dot delay={0.3} />
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Sugerencias */}
      <div className="p-2.5 border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="flex flex-wrap gap-1.5">
          {CHIPS.map((c) => (
            <button
              key={c.kind}
              onClick={() => ask(c)}
              disabled={typing}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-full px-2.5 py-1.5 border transition disabled:opacity-50"
              style={{
                color: used.has(c.kind) ? "#94A3B8" : ACCENT,
                borderColor: used.has(c.kind) ? "#E2E8F0" : `${ACCENT}44`,
                background: used.has(c.kind) ? "transparent" : `${ACCENT}0d`,
              }}
            >
              <c.Icon className="w-3.5 h-3.5" /> {c.label}
            </button>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2 rounded-full bg-slate-100 dark:bg-zinc-900 px-3 py-2">
          <span className="text-[12px] text-slate-400 flex-1">Escribí tu consulta…</span>
          <span className="w-7 h-7 rounded-full flex items-center justify-center text-white flex-none" style={{ background: ACCENT }}>
            <Send className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
      <style>{`@keyframes aiBlink { 0%,100% { opacity: 0.3 } 50% { opacity: 1 } }`}</style>
    </div>
  );
}

function Dot({ delay = 0 }: { delay?: number }) {
  return (
    <span
      className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block"
      style={{ animation: `aiBlink 1s ${delay}s infinite` }}
    />
  );
}

/* -------------------- Respuestas ricas por tipo -------------------- */

function Answer({ kind }: { kind: Kind }) {
  if (kind === "gap") {
    const rows = [
      { c: "7.5", r: "Información documentada", e: "parcial" },
      { c: "9.2", r: "Auditoría interna", e: "conforme" },
      { c: "10.2", r: "No conformidad y AC", e: "no" },
    ];
    return (
      <div>
        Detecté <b>1 brecha</b> y 1 punto parcial en tu cumplimiento ISO 9001:
        <div className="mt-2 space-y-1">
          {rows.map((r) => (
            <div key={r.c} className="flex items-center gap-2 text-[11px]">
              <StateDot e={r.e} />
              <span className="font-mono font-bold text-[10px]" style={{ color: ACCENT }}>{r.c}</span>
              <span className="text-slate-600 dark:text-slate-300">{r.r}</span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
          💡 Priorizá la cláusula <b>10.2</b>: falta el flujo de acción correctiva. Puedo abrir la tarea en el módulo de No Conformidades.
        </p>
      </div>
    );
  }
  if (kind === "risk") {
    return (
      <div>
        Para el riesgo <b>“Fallo de calibración de equipos”</b> (nivel <span className="font-bold text-orange-600">Alto</span>) propongo:
        <div className="mt-2 rounded-lg border border-slate-200 dark:border-zinc-700 p-2 text-[11px]">
          <p className="font-semibold text-slate-700 dark:text-slate-200">Control propuesto</p>
          <p className="text-slate-500 dark:text-slate-400">Plan de calibración con alertas de vencimiento y verificación intermedia.</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[10px] text-slate-400">Riesgo residual:</span>
            <span className="text-[10px] font-bold text-green-600 bg-green-50 dark:bg-green-950/40 rounded-full px-2 py-0.5">Bajo</span>
          </div>
        </div>
      </div>
    );
  }
  if (kind === "root") {
    return (
      <div>
        Análisis de causa raíz (5 Porqués) de la NC <b>“Producto fuera de tolerancia”</b>:
        <ol className="mt-2 space-y-0.5 text-[11px] list-decimal list-inside text-slate-600 dark:text-slate-300">
          <li>El instrumento midió mal…</li>
          <li>…porque estaba descalibrado…</li>
          <li>…porque venció su calibración…</li>
          <li>…porque no había alerta de vencimiento…</li>
          <li className="font-semibold" style={{ color: ACCENT }}>Causa raíz: falta de plan de calibración.</li>
        </ol>
        <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
          ✅ Acción sugerida: implementar plan de calibración · Resp. Calidad · 30 días.
        </p>
      </div>
    );
  }
  // kpi
  return (
    <div>
      Resumen de tus KPIs del trimestre:
      <div className="grid grid-cols-3 gap-1.5 mt-2">
        {[
          { k: "Cumplim.", v: "98%", up: true },
          { k: "NC abiertas", v: "3", up: false },
          { k: "Satisfacción", v: "4.5", up: true },
        ].map((s) => (
          <div key={s.k} className="rounded-lg bg-slate-50 dark:bg-zinc-800 p-1.5 text-center">
            <p className="text-sm font-bold" style={{ color: ACCENT }}>{s.v}</p>
            <p className="text-[8px] text-slate-500 uppercase font-semibold">{s.k}</p>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
        📈 Tendencia positiva, pero 2 indicadores están por debajo de la meta. ¿Querés el detalle?
      </p>
    </div>
  );
}

function StateDot({ e }: { e: string }) {
  if (e === "conforme") return <span className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center flex-none"><Check className="w-2.5 h-2.5 text-white" /></span>;
  if (e === "no") return <span className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center flex-none"><X className="w-2.5 h-2.5 text-white" /></span>;
  return <span className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center flex-none"><Minus className="w-2.5 h-2.5 text-white" /></span>;
}
