"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  ClipboardCheck,
  MapPin,
  Calendar,
  FileSearch,
  PlayCircle,
  CheckCircle2,
  Clock,
  Smartphone,
  WifiOff,
  ListChecks,
  ChevronRight,
  FileText,
} from "lucide-react";
import { kvGet, kvSet } from "@/lib/offline-db";

interface Asignacion {
  id: string;
  programa_id: string;
  programa_titulo?: string | null;
  auditor_id: string;
  auditor_nombre: string;
  auditor_email: string;
  area: string;
  norma?: string | null;
  fecha_programada: string;
  estado: string;
  notas?: string | null;
  total_puntos?: number | null;
  puntos_respondidos?: number | null;
}

export default function MisAuditoriasPage() {
  const { data: session } = useSession();
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user) fetchMias();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const fetchMias = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/auditorias/asignaciones/mias`, {
        headers: { Authorization: `Bearer ${(session as any).accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAsignaciones(data);
        kvSet("mias", data); // cache para uso offline
      }
    } catch (err) {
      // Sin conexión: usar la última copia guardada en el dispositivo.
      const cached = await kvGet<any[]>("mias");
      if (cached) setAsignaciones(cached);
    } finally {
      setLoading(false);
    }
  };

  const updateEstado = async (id: string, estado: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/auditorias/asignaciones/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any).accessToken}`,
        },
        body: JSON.stringify({ estado }),
      });
      if (res.ok) {
        const data = await res.json();
        setAsignaciones((prev) => prev.map((a) => (a.id === id ? data : a)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const pendientes = asignaciones.filter((a) => a.estado !== "completada").length;
  const completadas = asignaciones.filter((a) => a.estado === "completada").length;

  const estadoMeta = (estado: string) => {
    switch (estado) {
      case "completada":
        return { label: "Completada", cls: "text-green-700 bg-green-50 border-green-200", icon: CheckCircle2 };
      case "en_progreso":
        return { label: "En progreso", cls: "text-amber-700 bg-amber-50 border-amber-200", icon: PlayCircle };
      default:
        return { label: "Asignada", cls: "text-sky-700 bg-sky-50 border-sky-200", icon: Clock };
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-heading flex items-center gap-2">
          <ClipboardCheck className="w-8 h-8 text-primary" />
          Mis Auditorías
        </h1>
        <p className="text-muted-foreground text-sm">
          Auditorías de campo que te asignó tu auditor líder. Actualizá el avance a medida que ejecutás los controles en sitio.
        </p>
      </div>

      {/* Mobile teaser banner */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center flex-none">
          <Smartphone className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground flex items-center gap-2">
            App de auditoría en campo <WifiOff className="w-4 h-4 text-primary" />
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ejecutá estos controles desde el celular, incluso sin conexión: los cambios se guardan en el dispositivo y se sincronizan automáticamente al reconectar.
          </p>
        </div>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-950 border border-border rounded-xl p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Asignadas</p>
          <p className="text-3xl font-bold text-foreground mt-1 tabular-nums">{asignaciones.length}</p>
        </div>
        <div className="bg-white dark:bg-zinc-950 border border-border rounded-xl p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pendientes</p>
          <p className="text-3xl font-bold text-amber-600 mt-1 tabular-nums">{pendientes}</p>
        </div>
        <div className="bg-white dark:bg-zinc-950 border border-border rounded-xl p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Completadas</p>
          <p className="text-3xl font-bold text-green-600 mt-1 tabular-nums">{completadas}</p>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="bg-white dark:bg-zinc-950 border border-border rounded-xl p-12 text-center text-muted-foreground italic shadow-sm">
          Cargando tus auditorías...
        </div>
      ) : asignaciones.length === 0 ? (
        <div className="bg-white dark:bg-zinc-950 border border-border rounded-xl p-12 text-center shadow-sm">
          <ClipboardCheck className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-semibold text-foreground">Todavía no tenés auditorías asignadas</p>
          <p className="text-xs text-muted-foreground mt-1">
            Cuando el auditor líder te asigne una auditoría de campo, aparecerá acá.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {asignaciones.map((a) => {
            const meta = estadoMeta(a.estado);
            const Icon = meta.icon;
            return (
              <div key={a.id} className="bg-white dark:bg-zinc-950 border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition">
                <div className="flex justify-between items-start gap-4">
                  <div className="min-w-0">
                    <h3 className="font-bold text-base text-foreground">{a.area}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                      <FileSearch className="w-3.5 h-3.5" /> {a.programa_titulo || "Programa de auditoría"}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[9px] uppercase border flex-none ${meta.cls}`}>
                    <Icon className="w-3 h-3" /> {meta.label}
                  </span>
                </div>

                <div className="flex flex-wrap gap-4 mt-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    {new Date(a.fecha_programada + "T00:00:00").toLocaleDateString()}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-primary" /> {a.area}
                  </span>
                </div>

                {typeof a.total_puntos === "number" && a.total_puntos > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground mb-1">
                      <span className="inline-flex items-center gap-1.5">
                        <ListChecks className="w-3.5 h-3.5 text-primary" /> Checklist{a.norma ? ` · ${a.norma}` : ""}
                      </span>
                      <span className="tabular-nums">{a.puntos_respondidos || 0}/{a.total_puntos} controles</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${Math.round(((a.puntos_respondidos || 0) / a.total_puntos) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {a.notas && (
                  <p className="mt-3 text-xs text-muted-foreground italic border-l-2 border-primary/30 pl-3">{a.notas}</p>
                )}

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-border">
                  <Link
                    href={`/dashboard/mis-auditorias/${a.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold bg-primary text-white px-3.5 py-2 rounded-lg hover:bg-primary/90 transition shadow-sm"
                  >
                    <ListChecks className="w-4 h-4" /> Ejecutar controles <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                  {a.estado === "asignada" && (
                    <button
                      onClick={() => updateEstado(a.id, "en_progreso")}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold bg-primary text-white px-3.5 py-2 rounded-lg hover:bg-primary/90 transition shadow-sm"
                    >
                      <PlayCircle className="w-4 h-4" /> Comenzar auditoría
                    </button>
                  )}
                  {a.estado === "en_progreso" && (
                    <>
                      <button
                        onClick={() => updateEstado(a.id, "completada")}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold bg-secondary text-white px-3.5 py-2 rounded-lg hover:bg-secondary/90 transition shadow-sm"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Marcar como completada
                      </button>
                      <button
                        onClick={() => updateEstado(a.id, "asignada")}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg transition"
                      >
                        Volver a asignada
                      </button>
                    </>
                  )}
                  {a.estado === "completada" && (
                    <>
                      <Link
                        href={`/dashboard/mis-auditorias/${a.id}/reporte`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold bg-secondary text-white px-3.5 py-2 rounded-lg hover:bg-secondary/90 transition shadow-sm"
                      >
                        <FileText className="w-4 h-4" /> Reporte
                      </Link>
                      <button
                        onClick={() => updateEstado(a.id, "en_progreso")}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg transition"
                      >
                        <PlayCircle className="w-4 h-4" /> Reabrir
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
