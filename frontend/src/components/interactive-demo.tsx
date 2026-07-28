"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Wifi,
  WifiOff,
  Signal,
  CheckCircle2,
  AlertOctagon,
  Minus,
  Camera,
  MapPin,
  PenLine,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ClipboardCheck,
  FileText,
  RotateCcw,
  Hand,
} from "lucide-react";

/**
 * Demo interactiva de la app móvil del Auditor en Campo, embebida en la web.
 * El visitante puede: elegir una auditoría, responder controles, alternar la
 * conexión (offline/online) y ver cómo se sincronizan las respuestas pendientes.
 * Todo es simulado en el cliente — no toca el backend.
 */

type Resultado = "conforme" | "no_conforme" | "na";
type Screen = "list" | "exec" | "done";

interface Punto {
  id: string;
  clausula: string;
  pregunta: string;
}
interface Audit {
  id: string;
  area: string;
  norma: string;
  puntos: Punto[];
}

const AUDITS: Audit[] = [
  {
    id: "a1",
    area: "Depósito Central",
    norma: "ISO 45001",
    puntos: [
      { id: "p1", clausula: "8.1.2", pregunta: "¿El personal usa los EPP adecuados?" },
      { id: "p2", clausula: "6.1.1", pregunta: "¿La señalización de emergencia está visible?" },
      { id: "p3", clausula: "7.2.1", pregunta: "¿Los registros de capacitación están al día?" },
      { id: "p4", clausula: "8.2.0", pregunta: "¿Existe plan de respuesta ante emergencias?" },
    ],
  },
  {
    id: "a2",
    area: "Línea de Producción",
    norma: "ISO 9001",
    puntos: [
      { id: "q1", clausula: "8.5.1", pregunta: "¿Los controles de proceso están definidos?" },
      { id: "q2", clausula: "7.1.5", pregunta: "¿Los instrumentos están calibrados?" },
      { id: "q3", clausula: "8.7.1", pregunta: "¿Se controla el producto no conforme?" },
    ],
  },
];

export default function InteractiveDemo() {
  const [online, setOnline] = useState(true);
  const [screen, setScreen] = useState<Screen>("list");
  const [audit, setAudit] = useState<Audit | null>(null);
  const [answers, setAnswers] = useState<Record<string, Resultado>>({});
  const [pending, setPending] = useState<string[]>([]); // ids de respuestas sin sincronizar
  const [syncing, setSyncing] = useState(false);
  const [hintDismissed, setHintDismissed] = useState(false);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Al recuperar conexión, sincroniza lo pendiente.
  useEffect(() => {
    if (online && pending.length > 0 && !syncing) {
      setSyncing(true);
      syncTimer.current = setTimeout(() => {
        setPending([]);
        setSyncing(false);
      }, 1400);
    }
    return () => {
      if (syncTimer.current) clearTimeout(syncTimer.current);
    };
  }, [online, pending, syncing]);

  const openAudit = (a: Audit) => {
    setAudit(a);
    setScreen("exec");
    setHintDismissed(true);
  };

  const answer = (puntoId: string, r: Resultado) => {
    setAnswers((prev) => ({ ...prev, [puntoId]: r }));
    if (!online) {
      setPending((prev) => (prev.includes(puntoId) ? prev : [...prev, puntoId]));
    }
  };

  const reset = () => {
    setScreen("list");
    setAudit(null);
    setAnswers({});
    setPending([]);
    setSyncing(false);
  };

  const answeredCount = audit ? audit.puntos.filter((p) => answers[p.id]).length : 0;
  const allAnswered = audit ? answeredCount === audit.puntos.length : false;
  const ncCount = audit ? audit.puntos.filter((p) => answers[p.id] === "no_conforme").length : 0;

  // Estado de la píldora de conexión/sync
  let pill: { cls: string; icon: React.ReactNode; text: string } | null = null;
  if (!online && pending.length > 0) {
    pill = { cls: "bg-amber-500 text-amber-950", icon: <WifiOff className="w-3 h-3" />, text: `${pending.length} sin enviar` };
  } else if (syncing) {
    pill = { cls: "bg-primary text-white", icon: <RefreshCw className="w-3 h-3 animate-spin" />, text: "Sincronizando…" };
  } else if (online && pending.length === 0 && Object.keys(answers).length > 0 && screen === "exec") {
    pill = { cls: "bg-green-600 text-white", icon: <CheckCircle2 className="w-3 h-3" />, text: "Sincronizado" };
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Toggle de conexión */}
      <div className="flex items-center gap-3 rounded-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 shadow-sm px-4 py-2">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Conexión del sitio:</span>
        <button
          onClick={() => setOnline((v) => !v)}
          className={`relative inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-colors ${
            online ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
          }`}
        >
          {online ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          {online ? "En línea" : "Sin conexión"}
        </button>
        <span className="text-[10px] text-slate-400 hidden sm:inline">← tocá para simular</span>
      </div>

      <div className="relative">
        {/* Pista para el usuario */}
        {!hintDismissed && (
          <div className="absolute -top-2 -right-4 z-30 flex items-center gap-1 rounded-full bg-primary text-white pl-2 pr-3 py-1 shadow-lg text-[10px] font-bold animate-bounce">
            <Hand className="w-3 h-3" /> Probá la demo
          </div>
        )}

        {/* Píldora de sync flotante */}
        {pill && (
          <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 rounded-full pl-2.5 pr-3 py-1 shadow-lg text-[10px] font-bold ${pill.cls}`}>
            {pill.icon}
            {pill.text}
          </div>
        )}

        {/* Marco del teléfono */}
        <div className="relative w-[290px] h-[590px] rounded-[2.8rem] bg-slate-900 dark:bg-black p-3 shadow-2xl border-4 border-slate-800 ring-1 ring-black/5">
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-6 bg-slate-900 dark:bg-black rounded-b-2xl z-20" />
          <div className="w-full h-full rounded-[2rem] bg-slate-50 overflow-hidden flex flex-col relative">
            {/* Barra de estado */}
            <div className="flex items-center justify-between px-5 pt-3 pb-1 text-[10px] text-slate-500 bg-white flex-none z-10">
              <span className="font-semibold">9:41</span>
              <span className="flex items-center gap-1">
                <Signal className="w-3 h-3" />
                {online ? <Wifi className="w-3 h-3 text-green-600" /> : <WifiOff className="w-3 h-3 text-amber-500" />}
              </span>
            </div>

            {/* Contenido de pantalla */}
            <div className="flex-1 overflow-hidden">
              {screen === "list" && <ScreenList onOpen={openAudit} />}
              {screen === "exec" && audit && (
                <ScreenExec
                  audit={audit}
                  answers={answers}
                  pending={pending}
                  online={online}
                  answeredCount={answeredCount}
                  allAnswered={allAnswered}
                  onAnswer={answer}
                  onBack={() => setScreen("list")}
                  onSign={() => setScreen("done")}
                />
              )}
              {screen === "done" && audit && (
                <ScreenDone audit={audit} ncCount={ncCount} onReset={reset} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Pantallas ---------------- */

function ScreenList({ onOpen }: { onOpen: (a: Audit) => void }) {
  return (
    <div className="h-full flex flex-col">
      <div className="bg-primary text-white px-4 pt-3 pb-4 flex-none">
        <p className="text-[10px] uppercase tracking-wider text-white/70 font-bold">Auditorías en Línea</p>
        <h3 className="text-lg font-bold flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5" /> Mis Auditorías
        </h3>
        <p className="text-[11px] text-white/70 mt-0.5">Tocá una auditoría para ejecutarla en sitio</p>
      </div>
      <div className="p-3 space-y-3 overflow-y-auto">
        {AUDITS.map((a) => (
          <button
            key={a.id}
            onClick={() => onOpen(a)}
            className="w-full text-left bg-white rounded-xl border border-slate-200 p-3 shadow-sm hover:border-primary hover:shadow-md transition active:scale-[0.98]"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-800">{a.area}</h4>
              <span className="text-[9px] font-bold text-sky-700 bg-sky-50 border border-sky-200 rounded-full px-2 py-0.5">Asignada</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">{a.norma} · {a.puntos.length} controles</p>
            <div className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-primary">
              Ejecutar controles <ChevronRight className="w-3 h-3" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ScreenExec({
  audit,
  answers,
  pending,
  online,
  answeredCount,
  allAnswered,
  onAnswer,
  onBack,
  onSign,
}: {
  audit: Audit;
  answers: Record<string, Resultado>;
  pending: string[];
  online: boolean;
  answeredCount: number;
  allAnswered: boolean;
  onAnswer: (id: string, r: Resultado) => void;
  onBack: () => void;
  onSign: () => void;
}) {
  const pct = Math.round((answeredCount / audit.puntos.length) * 100);
  return (
    <div className="h-full flex flex-col">
      <div className="bg-primary text-white px-4 pt-2 pb-3 flex-none">
        <button onClick={onBack} className="flex items-center gap-1 text-[10px] text-white/70 hover:text-white mb-1">
          <ChevronLeft className="w-3 h-3" /> Volver
        </button>
        <h3 className="text-sm font-bold leading-tight">{audit.area}</h3>
        <p className="text-[10px] text-white/70">{audit.norma}</p>
        <div className="mt-2 h-1.5 rounded-full bg-white/20 overflow-hidden">
          <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-[10px] text-white/70 mt-1">{answeredCount} de {audit.puntos.length} controles</p>
      </div>

      {!online && (
        <div className="flex items-center gap-1.5 bg-amber-50 border-b border-amber-200 px-3 py-1.5 text-[10px] text-amber-800 font-semibold flex-none">
          <WifiOff className="w-3 h-3" /> Modo sin conexión — se guarda en el dispositivo
        </div>
      )}

      <div className="flex-1 p-3 space-y-2.5 overflow-y-auto">
        {audit.puntos.map((p) => {
          const a = answers[p.id];
          const isPending = pending.includes(p.id);
          return (
            <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-2.5 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[8px] font-mono font-bold text-primary uppercase">{p.clausula}</p>
                  <p className="text-[11px] text-slate-700 leading-snug mt-0.5">{p.pregunta}</p>
                </div>
                {a && (
                  <span className="flex-none mt-0.5">
                    {isPending ? (
                      <RefreshCw className="w-3 h-3 text-amber-500" />
                    ) : (
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                    )}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-1.5 mt-2">
                <RespBtn active={a === "conforme"} onClick={() => onAnswer(p.id, "conforme")} color="green" Icon={CheckCircle2} label="Conforme" />
                <RespBtn active={a === "no_conforme"} onClick={() => onAnswer(p.id, "no_conforme")} color="red" Icon={AlertOctagon} label="No conf." />
                <RespBtn active={a === "na"} onClick={() => onAnswer(p.id, "na")} color="slate" Icon={Minus} label="N/A" />
              </div>
              {a === "no_conforme" && (
                <div className="mt-2 flex items-center gap-2 text-[9px] text-slate-400">
                  <span className="flex items-center gap-1 text-red-600 font-semibold"><AlertOctagon className="w-3 h-3" /> Dispara No Conformidad</span>
                  <span className="ml-auto flex gap-1"><Camera className="w-3 h-3" /><MapPin className="w-3 h-3" /></span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-3 border-t border-slate-200 bg-white flex-none">
        <button
          onClick={onSign}
          disabled={!allAnswered}
          className={`w-full text-[11px] font-bold rounded-lg py-2.5 flex items-center justify-center gap-1.5 transition ${
            allAnswered ? "bg-secondary text-white hover:bg-secondary/90 active:scale-[0.98]" : "bg-slate-200 text-slate-400 cursor-not-allowed"
          }`}
        >
          <PenLine className="w-3.5 h-3.5" /> {allAnswered ? "Firmar y cerrar auditoría" : `Faltan ${audit.puntos.length - answeredCount} controles`}
        </button>
      </div>
    </div>
  );
}

function RespBtn({
  active,
  onClick,
  color,
  Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  color: "green" | "red" | "slate";
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  const palette = {
    green: active ? "bg-green-600 text-white border-green-600" : "bg-green-50 text-green-700 border-green-200",
    red: active ? "bg-red-600 text-white border-red-600" : "bg-red-50 text-red-600 border-red-200",
    slate: active ? "bg-slate-600 text-white border-slate-600" : "bg-slate-100 text-slate-500 border-slate-200",
  }[color];
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 rounded-lg border py-1.5 text-[8px] font-bold transition active:scale-95 ${palette}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}

function ScreenDone({ audit, ncCount, onReset }: { audit: Audit; ncCount: number; onReset: () => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-6 bg-gradient-to-b from-white to-slate-50">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4 animate-[pop_0.4s_ease-out]">
        <CheckCircle2 className="w-9 h-9 text-green-600" />
      </div>
      <h3 className="text-base font-bold text-slate-800">Auditoría completada</h3>
      <p className="text-[11px] text-slate-500 mt-1">{audit.area} · {audit.norma}</p>

      <div className="grid grid-cols-2 gap-2 w-full mt-5">
        <div className="rounded-lg bg-white border border-slate-200 p-2.5">
          <p className="text-lg font-bold text-slate-800 tabular-nums">{audit.puntos.length}</p>
          <p className="text-[8px] text-slate-500 uppercase font-semibold">Controles</p>
        </div>
        <div className="rounded-lg bg-white border border-red-200 p-2.5">
          <p className="text-lg font-bold text-red-600 tabular-nums">{ncCount}</p>
          <p className="text-[8px] text-slate-500 uppercase font-semibold">No conf. → NC</p>
        </div>
      </div>

      <div className="w-full mt-4 space-y-2">
        <div className="w-full bg-primary text-white text-[11px] font-bold rounded-lg py-2.5 flex items-center justify-center gap-1.5">
          <FileText className="w-3.5 h-3.5" /> Reporte PDF generado
        </div>
        <button
          onClick={onReset}
          className="w-full text-[11px] font-semibold text-slate-500 hover:text-primary flex items-center justify-center gap-1.5 py-1"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reiniciar demo
        </button>
      </div>

      <style>{`@keyframes pop { 0% { transform: scale(0.4); opacity: 0 } 70% { transform: scale(1.1) } 100% { transform: scale(1); opacity: 1 } }`}</style>
    </div>
  );
}
