"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  X,
  Minus,
  MapPin,
  Calendar,
  FileSearch,
  ListChecks,
  CheckCircle2,
  Loader2,
  ClipboardList,
} from "lucide-react";

interface Respuesta {
  id: string;
  punto_id: string;
  resultado: string;
  nota?: string | null;
}

interface Punto {
  id: string;
  asignacion_id: string;
  clausula: string;
  pregunta: string;
  tipo_resp: string;
  orden: number;
  respuesta?: Respuesta | null;
}

interface Asignacion {
  id: string;
  programa_titulo?: string | null;
  area: string;
  norma?: string | null;
  fecha_programada: string;
  estado: string;
  notas?: string | null;
}

export default function EjecutarAuditoriaPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const asigId = params?.id as string;

  const [asignacion, setAsignacion] = useState<Asignacion | null>(null);
  const [puntos, setPuntos] = useState<Punto[]>([]);
  const [notas, setNotas] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  const token = (session as any)?.accessToken;
  const api = process.env.NEXT_PUBLIC_API_URL || "";

  useEffect(() => {
    if (session?.user && asigId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, asigId]);

  const load = async () => {
    try {
      const [dRes, pRes] = await Promise.all([
        fetch(`${api}/api/v1/auditorias/asignaciones/${asigId}/detalle`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${api}/api/v1/auditorias/asignaciones/${asigId}/puntos`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (dRes.ok) setAsignacion(await dRes.json());
      if (pRes.ok) {
        const data: Punto[] = await pRes.json();
        setPuntos(data);
        const n: Record<string, string> = {};
        data.forEach((p) => { n[p.id] = p.respuesta?.nota || ""; });
        setNotas(n);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const saveRespuesta = async (punto: Punto, resultado: string) => {
    setSaving((s) => ({ ...s, [punto.id]: true }));
    try {
      const res = await fetch(`${api}/api/v1/auditorias/puntos/${punto.id}/respuesta`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ resultado, nota: notas[punto.id] || null }),
      });
      if (res.ok) {
        const respuesta = await res.json();
        setPuntos((prev) => prev.map((p) => (p.id === punto.id ? { ...p, respuesta } : p)));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving((s) => ({ ...s, [punto.id]: false }));
    }
  };

  const marcarCompletada = async () => {
    setCompleting(true);
    try {
      const res = await fetch(`${api}/api/v1/auditorias/asignaciones/${asigId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ estado: "completada" }),
      });
      if (res.ok) router.push("/dashboard/mis-auditorias");
    } catch (err) {
      console.error(err);
    } finally {
      setCompleting(false);
    }
  };

  const respondidos = puntos.filter((p) => p.respuesta).length;
  const total = puntos.length;
  const pct = total ? Math.round((respondidos / total) * 100) : 0;
  const todosRespondidos = total > 0 && respondidos === total;

  const opciones = [
    { key: "conforme", label: "Conforme", icon: Check, active: "border-green-600 bg-green-50 text-green-700", idle: "border-border text-muted-foreground hover:border-green-400" },
    { key: "no_conforme", label: "No conforme", icon: X, active: "border-red-600 bg-red-50 text-red-700", idle: "border-border text-muted-foreground hover:border-red-400" },
    { key: "na", label: "N/A", icon: Minus, active: "border-slate-500 bg-slate-100 text-slate-700", idle: "border-border text-muted-foreground hover:border-slate-400" },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Back */}
      <button
        onClick={() => router.push("/dashboard/mis-auditorias")}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition"
      >
        <ArrowLeft className="w-4 h-4" /> Volver a Mis Auditorías
      </button>

      {loading ? (
        <div className="bg-white dark:bg-zinc-950 border border-border rounded-xl p-12 text-center text-muted-foreground italic shadow-sm">
          Cargando checklist...
        </div>
      ) : !asignacion ? (
        <div className="bg-white dark:bg-zinc-950 border border-border rounded-xl p-12 text-center text-muted-foreground italic shadow-sm">
          No se encontró la auditoría.
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="bg-white dark:bg-zinc-950 border border-border rounded-xl p-6 shadow-sm">
            <h1 className="text-2xl font-bold tracking-tight font-heading flex items-center gap-2">
              <ClipboardList className="w-7 h-7 text-primary" />
              {asignacion.area}
            </h1>
            <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><FileSearch className="w-3.5 h-3.5 text-primary" /> {asignacion.programa_titulo || "Programa de auditoría"}</span>
              {asignacion.norma && <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold">{asignacion.norma}</span>}
              <span className="inline-flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-primary" /> {new Date(asignacion.fecha_programada + "T00:00:00").toLocaleDateString()}</span>
            </div>
            {asignacion.notas && (
              <p className="mt-3 text-xs text-muted-foreground italic border-l-2 border-primary/30 pl-3">{asignacion.notas}</p>
            )}

            {/* Progress */}
            <div className="mt-5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground mb-1">
                <span className="inline-flex items-center gap-1.5"><ListChecks className="w-3.5 h-3.5 text-primary" /> Avance del checklist</span>
                <span className="tabular-nums">{respondidos}/{total} · {pct}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>

          {/* Checklist */}
          {total === 0 ? (
            <div className="bg-white dark:bg-zinc-950 border border-border rounded-xl p-12 text-center shadow-sm">
              <ListChecks className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm font-semibold text-foreground">Esta auditoría todavía no tiene checklist</p>
              <p className="text-xs text-muted-foreground mt-1">
                El auditor líder puede generar los puntos de control desde la pestaña “Asignaciones de Campo” eligiendo una norma.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {puntos.map((p, idx) => {
                const sel = p.respuesta?.resultado;
                return (
                  <div key={p.id} className="bg-white dark:bg-zinc-950 border border-border rounded-xl p-5 shadow-sm">
                    <div className="flex items-start gap-3">
                      <span className="flex-none w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground tabular-nums">{idx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <span className="inline-block text-[10px] font-mono font-bold text-primary uppercase tracking-wide mb-1">{p.clausula}</span>
                        <p className="text-sm font-semibold text-foreground leading-snug">{p.pregunta}</p>
                      </div>
                      {saving[p.id] && <Loader2 className="w-4 h-4 text-muted-foreground animate-spin flex-none mt-1" />}
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-4">
                      {opciones.map((op) => {
                        const Icon = op.icon;
                        const isSel = sel === op.key;
                        return (
                          <button
                            key={op.key}
                            onClick={() => saveRespuesta(p, op.key)}
                            className={`flex flex-col items-center gap-1 py-2.5 rounded-lg border text-xs font-bold transition ${isSel ? op.active : op.idle}`}
                            style={{ borderWidth: 1.5 }}
                          >
                            <Icon className="w-4 h-4" /> {op.label}
                          </button>
                        );
                      })}
                    </div>

                    <textarea
                      value={notas[p.id] || ""}
                      onChange={(e) => setNotas((n) => ({ ...n, [p.id]: e.target.value }))}
                      onBlur={() => { if (p.respuesta) saveRespuesta(p, p.respuesta.resultado); }}
                      placeholder="Observación / evidencia (opcional)"
                      className="w-full mt-3 text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary resize-none h-16"
                    />
                  </div>
                );
              })}

              {/* Finish */}
              <div className="flex items-center justify-between gap-4 bg-white dark:bg-zinc-950 border border-border rounded-xl p-5 shadow-sm">
                <p className="text-xs text-muted-foreground">
                  {todosRespondidos
                    ? "Todos los controles fueron respondidos. Podés cerrar la auditoría."
                    : `Faltan ${total - respondidos} controles por responder.`}
                </p>
                <button
                  onClick={marcarCompletada}
                  disabled={!todosRespondidos || completing || asignacion.estado === "completada"}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold bg-secondary text-white px-4 py-2.5 rounded-lg hover:bg-secondary/90 transition shadow-sm disabled:opacity-50 flex-none"
                >
                  {completing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {asignacion.estado === "completada" ? "Auditoría completada" : "Finalizar auditoría"}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
