"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
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
  PenLine,
  FileText,
  Mic,
  RefreshCw,
  Send,
  AudioLines,
  ShieldAlert,
} from "lucide-react";
import { kvGet, kvSet, outboxAdd, outboxAll, outboxDelete, uuid, OutboxItem } from "@/lib/offline-db";
import { useConnection } from "@/lib/use-connection";
import { SYNC_EVENT } from "@/lib/offline-sync";
import SignaturePad from "@/components/signature-pad";
import AudioRecorder from "@/components/audio-recorder";

interface Respuesta {
  id?: string;
  punto_id: string;
  resultado: string;
  nota?: string | null;
  foto_url?: string | null;
  audio_url?: string | null;
  transcripcion?: string | null;
  transcripcion_estado?: string | null;
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
  const [audios, setAudios] = useState<Record<string, Blob | undefined>>({}); // espejo para la UI
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [showSign, setShowSign] = useState(false);
  const [solicitando, setSolicitando] = useState(false);
  const [solicitado, setSolicitado] = useState(false);
  // Las notas de voz son opt-in de cada organización (Configuración → Auditoría
  // en Campo). Por defecto el checklist trabaja con nota escrita y foto.
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [avisoPrivacidad, setAvisoPrivacidad] = useState<string | null>(null);

  // Evidencias todavía no sincronizadas. Van en refs (y no en estado) para que
  // 'answer' siempre lea el valor vigente, sin depender del ciclo de render.
  const fotoBlobs = useRef<Record<string, Blob | undefined>>({});
  const audioBlobs = useRef<Record<string, Blob | undefined>>({});
  const audioExts = useRef<Record<string, string | undefined>>({});

  // Refresca qué puntos tienen respuesta encolada (sin sincronizar) para esta auditoría.
  const refreshPending = useCallback(async () => {
    const all = await outboxAll();
    const mine = all.filter((i) => i.asignacion_id === asigId);
    const ids = new Set(mine.map((i) => i.punto_id));
    setPendingIds(ids);

    // Las evidencias que ya salieron de la cola están en el servidor: liberamos
    // los blobs locales para no volver a subirlos en la próxima respuesta.
    const conEvidencia = Array.from(
      new Set([...Object.keys(audioBlobs.current), ...Object.keys(fotoBlobs.current)])
    );
    for (const puntoId of conEvidencia) {
      if (!ids.has(puntoId)) {
        delete audioBlobs.current[puntoId];
        delete audioExts.current[puntoId];
        delete fotoBlobs.current[puntoId];
        setAudios((a) => (a[puntoId] ? { ...a, [puntoId]: undefined } : a));
      }
    }
  }, [asigId]);

  useEffect(() => {
    if (session?.user && asigId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, asigId]);

  // Preferencia del tenant: la cacheamos para que la app siga funcionando igual
  // sin conexión (si nunca se leyó, se asume desactivada = solo nota escrita).
  useEffect(() => {
    if (!token) return;
    (async () => {
      const cached = await kvGet<{ audio_notes_enabled: boolean; aviso_privacidad?: string }>("prefs:campo");
      if (cached) {
        setAudioEnabled(!!cached.audio_notes_enabled);
        setAvisoPrivacidad(cached.aviso_privacidad || null);
      }
      try {
        const res = await fetch(`${api}/api/v1/tenant/preferencias-campo`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setAudioEnabled(!!data.audio_notes_enabled);
          setAvisoPrivacidad(data.aviso_privacidad || null);
          kvSet("prefs:campo", data);
        }
      } catch {
        /* offline: queda lo cacheado */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

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

  // El líder puede cargar o cambiar las preguntas mientras el auditor ya tiene
  // la pantalla abierta: revalidamos al volver a la app y al recuperar la red,
  // para no depender de un refresco manual.
  useEffect(() => {
    if (!token || !asigId) return;
    const revalidar = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      refetchFromServer();
    };
    window.addEventListener("focus", revalidar);
    window.addEventListener("online", revalidar);
    document.addEventListener("visibilitychange", revalidar);
    return () => {
      window.removeEventListener("focus", revalidar);
      window.removeEventListener("online", revalidar);
      document.removeEventListener("visibilitychange", revalidar);
    };
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

  // Adjunta una foto tomada con la cámara del teléfono. Si el punto ya estaba
  // respondido, se vuelve a encolar la respuesta para que la evidencia suba.
  const pickFoto = (punto: Punto, file: File | null) => {
    setFotos((f) => {
      const next = { ...f };
      if (file) next[punto.id] = URL.createObjectURL(file);
      else delete next[punto.id];
      return next;
    });
    fotoBlobs.current[punto.id] = file || undefined;
    if (punto.respuesta?.resultado) answer(punto, punto.respuesta.resultado);
  };

  // Adjunta (o quita) la nota de voz del punto. Se sube al sincronizar y el
  // backend la transcribe a texto al finalizar la auditoría.
  const setAudio = (punto: Punto, blob: Blob | null, ext: string | null) => {
    audioBlobs.current[punto.id] = blob || undefined;
    audioExts.current[punto.id] = ext || undefined;
    setAudios((a) => ({ ...a, [punto.id]: blob || undefined }));
    if (punto.respuesta?.resultado) answer(punto, punto.respuesta.resultado);
  };

  // Registra la respuesta de un punto en el outbox (offline-first) y refleja en UI.
  const answer = async (punto: Punto, resultado: string) => {
    const gps = await captureGPS();
    const nota = notas[punto.id] || null;
    const foto = fotoBlobs.current[punto.id] || null;
    const audio = audioBlobs.current[punto.id] || null;

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
      audio_blob: audio,
      audio_ext: audioExts.current[punto.id] || null,
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

  // Cierre con firma digital: sube la firma y marca la auditoría como completada.
  const handleSign = async (blob: Blob) => {
    setCompleting(true);
    try {
      const fd = new FormData();
      fd.append("file", blob, "firma.png");
      const res = await fetch(`${api}/api/v1/auditorias/asignaciones/${asigId}/firma`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (res.ok) {
        setShowSign(false);
        router.push(`/dashboard/mis-auditorias/${asigId}/reporte`);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || "No se pudo firmar la auditoría.");
      }
    } catch {
      alert("Necesitás conexión para firmar y cerrar la auditoría.");
    } finally {
      setCompleting(false);
    }
  };

  // Auditoría asignada sin plantilla: el auditor reclama las preguntas al líder.
  const solicitarChecklist = async () => {
    setSolicitando(true);
    try {
      const res = await fetch(`${api}/api/v1/auditorias/asignaciones/${asigId}/solicitar-checklist`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setSolicitado(true);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || "No se pudo enviar la solicitud.");
      }
    } catch {
      alert("Necesitás conexión para solicitar el checklist.");
    } finally {
      setSolicitando(false);
    }
  };

  const conAudioPendiente = puntos.some((p) => audios[p.id] || p.respuesta?.audio_url);
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

          {/* Aviso de privacidad: solo cuando la organización habilitó las notas
              de voz, porque el audio sale hacia un transcriptor externo. */}
          {audioEnabled && avisoPrivacidad && total > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-sky-200 bg-sky-50 text-sky-900 px-4 py-2.5 text-[11px] leading-relaxed">
              <ShieldAlert className="w-4 h-4 flex-none mt-0.5" />
              <span><strong>Notas de voz habilitadas.</strong> {avisoPrivacidad}</span>
            </div>
          )}

          {total === 0 ? (
            <div className="bg-white dark:bg-zinc-950 border border-border rounded-xl p-10 text-center shadow-sm">
              <ListChecks className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm font-semibold text-foreground">Esta auditoría todavía no tiene checklist</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Fue asignada sin plantilla. El auditor líder tiene que cargar las preguntas
                desde <strong>“Asignaciones de Campo”</strong>, a mano o aplicando una plantilla guardada.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
                {solicitado ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-3.5 py-2 rounded-lg">
                    <CheckCircle2 className="w-4 h-4" /> Solicitud enviada al líder
                  </span>
                ) : (
                  <button
                    onClick={solicitarChecklist}
                    disabled={solicitando || !online}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold bg-primary text-white px-3.5 py-2 rounded-lg hover:bg-primary/90 transition shadow-sm disabled:opacity-50"
                  >
                    {solicitando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Solicitar checklist al líder
                  </button>
                )}
                <button
                  onClick={refetchFromServer}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg transition"
                >
                  <RefreshCw className="w-4 h-4" /> Actualizar
                </button>
              </div>
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

                    {/* Nota escrita + captura de foto. Es el modo por defecto del
                        checklist: siempre visible, sin depender de ninguna opción. */}
                    <div className="flex items-center gap-2 mt-3">
                      <input
                        type="text"
                        value={notas[p.id] || ""}
                        onChange={(e) => setNotas((n) => ({ ...n, [p.id]: e.target.value }))}
                        onBlur={() => { if (p.respuesta?.resultado) answer(p, p.respuesta.resultado); }}
                        placeholder="Nota / observación breve"
                        className="flex-1 min-w-0 text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                      />
                      <label
                        title={fotos[p.id] || p.respuesta?.foto_url ? "Cambiar foto" : "Tomar foto con la cámara"}
                        className="flex-none w-10 h-10 rounded-lg border border-border bg-muted/40 flex items-center justify-center text-primary cursor-pointer hover:border-primary transition relative"
                      >
                        <Camera className="w-4 h-4" />
                        {(fotos[p.id] || p.respuesta?.foto_url) && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-green-600 border-2 border-white dark:border-zinc-950" />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={(e) => pickFoto(p, e.target.files?.[0] || null)}
                        />
                      </label>
                    </div>

                    <div className="mt-2 space-y-2">
                      <div className="flex items-center gap-3">
                        {fotos[p.id] && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={fotos[p.id]} alt="evidencia" className="w-10 h-10 rounded-lg object-cover border border-border" />
                        )}
                        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground ml-auto">
                          <MapPin className="w-3 h-3" /> ubicación automática
                        </span>
                      </div>

                      {/* Nota de voz: opcional, solo si la organización la habilitó. */}
                      {audioEnabled && (
                        <AudioRecorder
                          value={audios[p.id] || null}
                          onChange={(blob, ext) => setAudio(p, blob, ext)}
                        />
                      )}

                      {audioEnabled && audios[p.id] && (
                        <p className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Mic className="w-3 h-3" /> Se transcribe a texto al finalizar la auditoría.
                        </p>
                      )}

                      {p.respuesta?.transcripcion && (
                        <p className="text-[11px] text-foreground bg-muted/40 border-l-2 border-primary/40 rounded-r px-2.5 py-1.5">
                          <span className="inline-flex items-center gap-1 font-semibold text-primary">
                            <AudioLines className="w-3 h-3" /> Nota de voz transcripta:
                          </span>{" "}
                          {p.respuesta.transcripcion}
                        </p>
                      )}
                      {!p.respuesta?.transcripcion && p.respuesta?.audio_url && (
                        <p className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                          <AudioLines className="w-3 h-3" />
                          {p.respuesta.transcripcion_estado === "no_disponible"
                            ? "Audio guardado como evidencia (transcripción no configurada)."
                            : "Nota de voz guardada — se transcribe al finalizar."}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}

              <div className="flex items-center justify-between gap-4 bg-white dark:bg-zinc-950 border border-border rounded-xl p-5 shadow-sm">
                <p className="text-xs text-muted-foreground">
                  {asignacion.estado === "completada"
                    ? "Auditoría cerrada y firmada."
                    : todosRespondidos
                    ? online
                      ? conAudioPendiente
                        ? "Todos los controles fueron respondidos. Al firmar, las notas de voz se transcriben a texto y quedan en el reporte."
                        : "Todos los controles fueron respondidos. Firmá para cerrar la auditoría."
                      : "Todos respondidos. Vas a poder firmarla al recuperar la conexión."
                    : `Faltan ${total - respondidos} controles por responder.`}
                </p>
                {asignacion.estado === "completada" ? (
                  <Link
                    href={`/dashboard/mis-auditorias/${asigId}/reporte`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold bg-primary text-white px-4 py-2.5 rounded-lg hover:bg-primary/90 transition shadow-sm flex-none"
                  >
                    <FileText className="w-4 h-4" /> Ver reporte
                  </Link>
                ) : (
                  <button
                    onClick={() => setShowSign(true)}
                    disabled={!todosRespondidos || !online}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold bg-secondary text-white px-4 py-2.5 rounded-lg hover:bg-secondary/90 transition shadow-sm disabled:opacity-50 flex-none"
                  >
                    <PenLine className="w-4 h-4" /> Firmar y finalizar
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {showSign && (
        <SignaturePad
          firmante={(session?.user as any)?.name || (session?.user as any)?.email}
          submitting={completing}
          onCancel={() => setShowSign(false)}
          onSign={handleSign}
        />
      )}
    </div>
  );
}
