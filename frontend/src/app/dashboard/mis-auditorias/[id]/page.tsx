"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  X,
  Minus,
  Calendar,
  FileSearch,
  ListChecks,
  CheckCircle2,
  Loader2,
  ClipboardList,
  Camera,
  MapPin,
  WifiOff,
  CloudUpload,
  Clock,
} from "lucide-react";
import { kvGet, kvSet, outboxAdd, outboxAll, outboxDelete, uuid, OutboxItem } from "@/lib/offline-db";
import { useConnection } from "@/lib/use-connection";
import { SYNC_EVENT } from "@/lib/offline-sync";

interface Respuesta {
  id?: string;
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
  const token = (session as any)?.accessToken;
  const api = process.env.NEXT_PUBLIC_API_URL || "";

  const { online, pending, sync } = useConnection(token);

  const [asignacion, setAsignacion] = useState<Asignacion | null>(null);
  const [puntos, setPuntos] = useState<Punto[]>([]);
  const [notas, setNotas] = useState<Record<string, string>>({});
  const [fotos, setFotos] = useState<Record<string, string>>({}); // punto_id -> object URL preview
  const [fotoBlobs] = useState<Record<string, File | undefined>>({}); // punto_id -> File (no se serializa)
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);
  const [completing, setCompleting] = useState(false);

  // Refresca qué puntos tienen respuesta encolada (sin sincronizar) para esta auditoría.
  const refreshPending = useCallback(async () => {
    const all = await outboxAll();
    const mine = all.filter((i) => i.asignacion_id === asigId);
    setPendingIds(new Set(mine.map((i) => i.punto_id)));
  }, [asigId]);

  useEffect(() => {
    if (session?.user && asigId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, asigId]);

  // Cuando la sincronización cambia el estado, recomputamos pendientes y refrescamos del server.
  useEffect(() => {
    const onSync = () => {
      refreshPending();
      if (typeof navigator === "undefined" || navigator.onLine) refetchFromServer();
    };
    window.addEventListener(SYNC_EVENT, onSync);
    return () => window.removeEventListener(SYNC_EVENT, onSync);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asigId, token]);

  const applyOutbox = async (base: Punto[]): Promise<Punto[]> => {
    const all = await outboxAll();
    const mine = new Map(all.filter((i) => i.asignacion_id === asigId).map((i) => [i.punto_id, i]));
    return base.map((p) => {
      const q = mine.get(p.id);
      if (q) return { ...p, respuesta: { punto_id: p.id, resultado: q.resultado, nota: q.nota } };
      return p;
    });
  };

  const hydrateNotas = (list: Punto[]) => {
    const n: Record<string, string> = {};
    list.forEach((p) => { n[p.id] = p.respuesta?.nota || ""; });
    setNotas(n);
  };

  const refetchFromServer = async () => {
    try {
      const [dRes, pRes] = await Promise.all([
        fetch(`${api}/api/v1/auditorias/asignaciones/${asigId}/detalle`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${api}/api/v1/auditorias/asignaciones/${asigId}/puntos`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (dRes.ok) {
        const asig = await dRes.json();
        setAsignacion(asig);
        kvSet(`asig:${asigId}`, asig);
      }
      if (pRes.ok) {
        const data: Punto[] = await pRes.json();
        kvSet(`puntos:${asigId}`, data);
        const merged = await applyOutbox(data);
        setPuntos(merged);
        hydrateNotas(merged);
        setFromCache(false);
      }
    } catch {
      /* offline: ya trabajamos con caché */
    }
  };

  const load = async () => {
    setLoading(true);
    await refreshPending();

    // 1) Intento por red.
    let gotNetwork = false;
    try {
      const [dRes, pRes] = await Promise.all([
        fetch(`${api}/api/v1/auditorias/asignaciones/${asigId}/detalle`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${api}/api/v1/auditorias/asignaciones/${asigId}/puntos`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (dRes.ok && pRes.ok) {
        const asig = await dRes.json();
        const data: Punto[] = await pRes.json();
        await kvSet(`asig:${asigId}`, asig);
        await kvSet(`puntos:${asigId}`, data);
        setAsignacion(asig);
        const merged = await applyOutbox(data);
        setPuntos(merged);
        hydrateNotas(merged);
        gotNetwork = true;
      }
    } catch {
      /* pasa a caché */
    }

    // 2) Fallback a caché offline.
    if (!gotNetwork) {
      const asig = await kvGet<Asignacion>(`asig:${asigId}`);
      const data = await kvGet<Punto[]>(`puntos:${asigId}`);
      if (asig) setAsignacion(asig);
      if (data) {
        const merged = await applyOutbox(data);
        setPuntos(merged);
        hydrateNotas(merged);
      }
      setFromCache(true);
    }

    setLoading(false);
  };

  const captureGPS = (): Promise<{ lat: number | null; lng: number | null }> =>
    new Promise((resolve) => {
      if (typeof navigator === "undefined" || !navigator.geolocation) return resolve({ lat: null, lng: null });
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve({ lat: null, lng: null }),
        { enableHighAccuracy: false, timeout: 4000, maximumAge: 60000 }
      );
    });

  const pickFoto = (puntoId: string, file: File | null) => {
    setFotos((f) => {
      const next = { ...f };
      if (file) next[puntoId] = URL.createObjectURL(file);
      return next;
    });
    (fotoBlobs as any)[puntoId] = file || undefined;
  };

  // Registra la respuesta de un punto en el outbox (offline-first) y refleja en UI.
  const answer = async (punto: Punto, resultado: string) => {
    const gps = await captureGPS();
    const nota = notas[punto.id] || null;
    const foto = fotoBlobs[punto.id] || null;

    // Reemplaza cualquier respuesta encolada previa para el mismo punto.
    const all = await outboxAll();
    for (const it of all) {
      if (it.asignacion_id === asigId && it.punto_id === punto.id) await outboxDelete(it.client_uuid);
    }

    const item: OutboxItem = {
      client_uuid: uuid(),
      punto_id: punto.id,
      asignacion_id: asigId,
      resultado,
      nota,
      lat: gps.lat,
      lng: gps.lng,
      foto_blob: foto,
      created_at: Date.now(),
      status: "pending",
      attempts: 0,
      label: `${punto.clausula} · ${resultado}`,
    };
    await outboxAdd(item);

    // Refleja en UI + actualiza la caché local de puntos.
    setPuntos((prev) => {
      const next = prev.map((p) => (p.id === punto.id ? { ...p, respuesta: { punto_id: p.id, resultado, nota } } : p));
      kvSet(`puntos:${asigId}`, next.map(({ respuesta, ...rest }) => ({ ...rest, respuesta: respuesta || null })));
      return next;
    });
    await refreshPending();

    // Si hay conexión, dispara la sincronización.
    if (typeof navigator === "undefined" || navigator.onLine) sync();
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
    } catch {
      /* sin conexión: se puede cerrar al reconectar */
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
      <button
        onClick={() => router.push("/dashboard/mis-auditorias")}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition"
      >
        <ArrowLeft className="w-4 h-4" /> Volver a Mis Auditorías
      </button>

      {/* Offline / cache banner */}
      {(!online || fromCache) && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 px-4 py-2.5 text-xs font-semibold">
          <WifiOff className="w-4 h-4" />
          {online
            ? "Mostrando datos guardados en el dispositivo."
            : "Sin conexión — podés seguir auditando; se sincroniza al reconectar."}
          {pending > 0 && <span className="ml-auto inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {pending} en cola</span>}
        </div>
      )}

      {loading ? (
        <div className="bg-white dark:bg-zinc-950 border border-border rounded-xl p-12 text-center text-muted-foreground italic shadow-sm">
          Cargando checklist...
        </div>
      ) : !asignacion ? (
        <div className="bg-white dark:bg-zinc-950 border border-border rounded-xl p-12 text-center text-muted-foreground italic shadow-sm">
          No se encontró la auditoría (ni en el dispositivo). Abrila una vez con conexión para usarla offline.
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

          {total === 0 ? (
            <div className="bg-white dark:bg-zinc-950 border border-border rounded-xl p-12 text-center shadow-sm">
              <ListChecks className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm font-semibold text-foreground">Esta auditoría todavía no tiene checklist</p>
              <p className="text-xs text-muted-foreground mt-1">
                El auditor líder puede generar los puntos de control desde “Asignaciones de Campo” eligiendo una norma.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {puntos.map((p, idx) => {
                const sel = p.respuesta?.resultado;
                const isPending = pendingIds.has(p.id);
                return (
                  <div key={p.id} className="bg-white dark:bg-zinc-950 border border-border rounded-xl p-5 shadow-sm">
                    <div className="flex items-start gap-3">
                      <span className="flex-none w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground tabular-nums">{idx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <span className="inline-block text-[10px] font-mono font-bold text-primary uppercase tracking-wide mb-1">{p.clausula}</span>
                        <p className="text-sm font-semibold text-foreground leading-snug">{p.pregunta}</p>
                      </div>
                      {sel && (
                        isPending ? (
                          <span title="En cola de sincronización" className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 flex-none mt-0.5">
                            <Clock className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span title="Sincronizado" className="inline-flex items-center gap-1 text-[10px] font-semibold text-green-600 flex-none mt-0.5">
                            <CloudUpload className="w-3.5 h-3.5" />
                          </span>
                        )
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-4">
                      {opciones.map((op) => {
                        const Icon = op.icon;
                        const isSel = sel === op.key;
                        return (
                          <button
                            key={op.key}
                            onClick={() => answer(p, op.key)}
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
                      onBlur={() => { if (p.respuesta?.resultado) answer(p, p.respuesta.resultado); }}
                      placeholder="Observación / evidencia (opcional)"
                      className="w-full mt-3 text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary resize-none h-16"
                    />

                    <div className="flex items-center gap-3 mt-3">
                      <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary cursor-pointer hover:underline">
                        <Camera className="w-4 h-4" />
                        {fotos[p.id] ? "Cambiar foto" : "Adjuntar foto"}
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={(e) => pickFoto(p.id, e.target.files?.[0] || null)}
                        />
                      </label>
                      {fotos[p.id] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={fotos[p.id]} alt="evidencia" className="w-10 h-10 rounded-lg object-cover border border-border" />
                      )}
                      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground ml-auto">
                        <MapPin className="w-3 h-3" /> ubicación automática
                      </span>
                    </div>
                  </div>
                );
              })}

              <div className="flex items-center justify-between gap-4 bg-white dark:bg-zinc-950 border border-border rounded-xl p-5 shadow-sm">
                <p className="text-xs text-muted-foreground">
                  {todosRespondidos
                    ? online
                      ? "Todos los controles fueron respondidos. Podés cerrar la auditoría."
                      : "Todos respondidos. Vas a poder cerrarla al recuperar la conexión."
                    : `Faltan ${total - respondidos} controles por responder.`}
                </p>
                <button
                  onClick={marcarCompletada}
                  disabled={!todosRespondidos || completing || !online || asignacion.estado === "completada"}
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
