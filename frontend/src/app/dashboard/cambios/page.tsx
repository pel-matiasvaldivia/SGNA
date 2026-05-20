"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { 
  Shuffle, 
  Plus, 
  CheckCircle2, 
  Circle, 
  AlertCircle, 
  Calendar, 
  User, 
  FileText, 
  X, 
  ListTodo, 
  Sparkles, 
  TrendingUp, 
  ArrowRight,
  ShieldAlert,
  Clock
} from "lucide-react";

interface Accion {
  id: string;
  cambio_id: string;
  descripcion: string;
  responsable_id: string | null;
  fecha_limite: string;
  fecha_ejecucion: string | null;
  estado: string; // pendiente, completado
}

interface Cambio {
  id: string;
  codigo: string;
  titulo: string;
  descripcion: string;
  motivo: string;
  impacto_sgi: string; // alto, medio, bajo
  recursos_requeridos: string | null;
  estado: string; // propuesto, en_analisis, aprobado, ejecutado, cancelado
  fecha_propuesta: string;
  fecha_limite: string | null;
  solicitante_id: string | null;
  aprobador_id: string | null;
  acciones: Accion[];
}

export default function ControlCambiosPage() {
  const { data: session } = useSession();
  const [cambios, setCambios] = useState<Cambio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selector
  const [selectedCambio, setSelectedCambio] = useState<Cambio | null>(null);

  // Modals
  const [isCambioModalOpen, setIsCambioModalOpen] = useState(false);
  const [isAccionModalOpen, setIsAccionModalOpen] = useState(false);

  // Form states - Cambio Create
  const [newCodigo, setNewCodigo] = useState("");
  const [newTitulo, setNewTitulo] = useState("");
  const [newDescripcion, setNewDescripcion] = useState("");
  const [newMotivo, setNewMotivo] = useState("");
  const [newImpactoSGI, setNewImpactoSGI] = useState("bajo");
  const [newRecursos, setNewRecursos] = useState("");
  const [newFechaLimite, setNewFechaLimite] = useState("");

  // Form states - Accion Create
  const [newAccionDesc, setNewAccionDesc] = useState("");
  const [newAccionFecha, setNewAccionFecha] = useState("");

  const fetchData = async () => {
    if (!session?.user) return;
    setLoading(true);
    setError(null);
    try {
      const headers = { Authorization: `Bearer ${(session as any).accessToken}` };
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

      const res = await fetch(`${apiUrl}/api/v1/cambios`, { headers });
      if (!res.ok) throw new Error("Error al obtener las solicitudes de cambio.");
      const data = await res.json();
      setCambios(data);
      
      // Update selected change or default to first
      if (data.length > 0) {
        if (selectedCambio) {
          const updated = data.find((c: Cambio) => c.id === selectedCambio.id);
          setSelectedCambio(updated || data[0]);
        } else {
          setSelectedCambio(data[0]);
        }
      } else {
        setSelectedCambio(null);
      }
    } catch (err: any) {
      setError(err.message || "Error al cargar el panel de control de cambios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [session]);

  const handleCreateCambio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCodigo || !newTitulo || !newDescripcion || !newMotivo) return;

    try {
      setError(null);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/cambios`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any).accessToken}`,
        },
        body: JSON.stringify({
          codigo: newCodigo,
          titulo: newTitulo,
          descripcion: newDescripcion,
          motivo: newMotivo,
          impacto_sgi: newImpactoSGI,
          recursos_requeridos: newRecursos || null,
          fecha_limite: newFechaLimite ? new Date(newFechaLimite).toISOString() : null,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Error al registrar el control de cambio.");
      }

      // Reset & Refresh
      setNewCodigo("");
      setNewTitulo("");
      setNewDescripcion("");
      setNewMotivo("");
      setNewImpactoSGI("bajo");
      setNewRecursos("");
      setNewFechaLimite("");
      setIsCambioModalOpen(false);
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreateAccion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCambio || !newAccionDesc || !newAccionFecha) return;

    try {
      setError(null);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/cambios/${selectedCambio.id}/acciones`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${(session as any).accessToken}`,
          },
          body: JSON.stringify({
            descripcion: newAccionDesc,
            fecha_limite: new Date(newAccionFecha).toISOString(),
          }),
        }
      );

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Error al agregar la tarea.");
      }

      // Reset & Refresh
      setNewAccionDesc("");
      setNewAccionFecha("");
      setIsAccionModalOpen(false);
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleTransitionEstado = async (id: string, nuevoEstado: string) => {
    try {
      setError(null);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/cambios/${id}/estado?estado=${nuevoEstado}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${(session as any).accessToken}`,
          },
        }
      );

      if (!res.ok) throw new Error("Error al actualizar el estado del cambio.");
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCompleteAccion = async (cambioId: string, accionId: string) => {
    try {
      setError(null);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/cambios/${cambioId}/acciones/${accionId}/completar`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${(session as any).accessToken}`,
          },
        }
      );

      if (!res.ok) throw new Error("Error al completar la tarea.");
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Color helpers for Impact
  const getImpactColor = (impacto: string) => {
    switch (impacto.toLowerCase()) {
      case "alto":
        return { text: "text-rose-400 border-rose-500/20 bg-rose-500/10", dot: "bg-rose-500" };
      case "medio":
        return { text: "text-amber-400 border-amber-500/20 bg-amber-500/10", dot: "bg-amber-500" };
      default:
        return { text: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10", dot: "bg-emerald-500" };
    }
  };

  // Color helper for States
  const getEstadoBadge = (estado: string) => {
    switch (estado.toLowerCase()) {
      case "propuesto":
        return "bg-blue-500/15 text-blue-400 border border-blue-500/20";
      case "en_analisis":
        return "bg-violet-500/15 text-violet-400 border border-violet-500/20";
      case "aprobado":
        return "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20";
      case "ejecutado":
        return "bg-teal-500 text-primary-foreground border border-teal-500/30";
      case "cancelado":
        return "bg-zinc-800 text-zinc-500 border border-zinc-700";
      default:
        return "bg-zinc-700 text-zinc-300";
    }
  };

  // Stepper representation of current progress
  const getProgressPercent = (cambio: Cambio) => {
    if (cambio.acciones.length === 0) return 0;
    const completed = cambio.acciones.filter(a => a.estado === "completado").length;
    return Math.round((completed / cambio.acciones.length) * 100);
  };

  // Metric summaries
  const totalCambios = cambios.length;
  const propuestos = cambios.filter(c => c.estado === "propuesto" || c.estado === "en_analisis").length;
  const aprobados = cambios.filter(c => c.estado === "aprobado").length;
  const ejecutados = cambios.filter(c => c.estado === "ejecutado").length;

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-12">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-secondary/15 rounded-2xl flex items-center justify-center border border-secondary/25 shadow-inner">
              <Shuffle className="w-6 h-6 text-secondary animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Gestión y Control de Cambios</h1>
              <p className="text-sm text-muted-foreground">
                Planifique, evalúe y ejecute modificaciones sistemáticas en su organización bajo Cláusula 6.3 de ISO 9001:2015.
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsCambioModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-secondary text-primary-foreground font-semibold shadow hover:bg-secondary/90 hover:scale-[1.02] active:scale-95 transition-all text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Solicitar Control de Cambio</span>
        </button>
      </div>

      {/* API Errors Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Ha ocurrido un error:</span> {error}
          </div>
        </div>
      )}

      {/* Glassmorphic Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-white/5 p-6 shadow flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-zinc-500 block uppercase font-bold tracking-wider">Total Cambios</span>
            <span className="text-2xl font-bold block text-white mt-1">{totalCambios}</span>
          </div>
        </div>

        <div className="bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-white/5 p-6 shadow flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-zinc-500 block uppercase font-bold tracking-wider">En Evaluación</span>
            <span className="text-2xl font-bold block text-white mt-1">{propuestos}</span>
          </div>
        </div>

        <div className="bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-white/5 p-6 shadow flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-zinc-500 block uppercase font-bold tracking-wider">Aprobados</span>
            <span className="text-2xl font-bold block text-white mt-1">{aprobados}</span>
          </div>
        </div>

        <div className="bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-white/5 p-6 shadow flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-zinc-500 block uppercase font-bold tracking-wider">Ejecutados</span>
            <span className="text-2xl font-bold block text-white mt-1">{ejecutados}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-medium">Cargando panel de gestión de cambios...</p>
        </div>
      ) : cambios.length === 0 ? (
        <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-12 text-center max-w-xl mx-auto shadow-2xl">
          <Shuffle className="w-16 h-16 text-zinc-700 mx-auto mb-4 animate-bounce" />
          <h3 className="text-lg font-bold text-white mb-2">No se han registrado solicitudes de cambio</h3>
          <p className="text-zinc-500 text-sm mb-6 leading-relaxed">
            Comience a estructurar y controlar los cambios del SGI de manera segura y documentada para superar auditorías internacionales.
          </p>
          <button
            onClick={() => setIsCambioModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-secondary text-primary-foreground font-bold shadow hover:bg-secondary/90 transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Primer Solicitud</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar selector */}
          <div className="lg:col-span-4 space-y-4">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Solicitudes del Tenant</h3>
            <div className="space-y-3 max-h-[550px] overflow-y-auto pr-2">
              {cambios.map((c) => {
                const isSelected = selectedCambio?.id === c.id;
                const progressVal = getProgressPercent(c);
                const imp = getImpactColor(c.impacto_sgi);

                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCambio(c)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-secondary/15 border-secondary shadow-lg shadow-secondary/5 text-white"
                        : "bg-zinc-900/30 border-white/5 text-zinc-400 hover:bg-zinc-900/60 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-extrabold bg-white/10 px-2 py-0.5 rounded text-white">
                        {c.codigo}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${getEstadoBadge(c.estado)}`}>
                        {c.estado.replace("_", " ")}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-white line-clamp-1 mb-2">{c.titulo}</h4>
                    
                    <div className="flex items-center justify-between text-xs text-zinc-500 mb-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-semibold uppercase ${imp.text}`}>
                        Impacto {c.impacto_sgi}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(c.fecha_propuesta).toLocaleDateString("es-ES")}
                      </span>
                    </div>

                    {/* Progress bar */}
                    {c.acciones.length > 0 && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-zinc-500 font-bold">
                          <span>Tareas</span>
                          <span>{progressVal}%</span>
                        </div>
                        <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-secondary h-full rounded-full transition-all duration-500" 
                            style={{ width: `${progressVal}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Details & Actions list */}
          {selectedCambio && (
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl relative">
                {/* Upper Details */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-white/5 pb-6 mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-xs font-extrabold bg-secondary text-primary-foreground px-3 py-1 rounded-md">
                        {selectedCambio.codigo}
                      </span>
                      <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${getEstadoBadge(selectedCambio.estado)}`}>
                        {selectedCambio.estado.replace("_", " ")}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-white">{selectedCambio.titulo}</h2>
                    <p className="text-xs text-zinc-400 mt-1">
                      Propuesto el {new Date(selectedCambio.fecha_propuesta).toLocaleString("es-ES")}
                    </p>
                  </div>

                  {/* Flow Actions */}
                  <div className="flex flex-wrap items-center gap-2 self-end sm:self-start">
                    {selectedCambio.estado === "propuesto" && (
                      <button
                        onClick={() => handleTransitionEstado(selectedCambio.id, "en_analisis")}
                        className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs shadow transition-all flex items-center gap-1.5"
                      >
                        <span>Evaluar Impacto</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {selectedCambio.estado === "en_analisis" && (
                      <button
                        onClick={() => handleTransitionEstado(selectedCambio.id, "aprobado")}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow transition-all flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Aprobar Cambio</span>
                      </button>
                    )}
                    {selectedCambio.estado === "aprobado" && (
                      <button
                        onClick={() => handleTransitionEstado(selectedCambio.id, "ejecutado")}
                        className="px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-primary font-bold text-xs shadow transition-all flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Declarar Ejecutado</span>
                      </button>
                    )}
                    {selectedCambio.estado !== "ejecutado" && selectedCambio.estado !== "cancelado" && (
                      <button
                        onClick={() => handleTransitionEstado(selectedCambio.id, "cancelado")}
                        className="px-3.5 py-2 rounded-xl bg-zinc-800 text-rose-500 border border-white/5 hover:bg-rose-500/10 hover:border-rose-500/20 transition-all text-xs font-semibold"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>

                {/* Justification & Resources cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="p-5 rounded-2xl bg-zinc-950/40 border border-white/5 space-y-2">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block">Descripción y Alcance</span>
                    <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">{selectedCambio.descripcion}</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-zinc-950/40 border border-white/5 space-y-2">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block">Motivo / Justificación</span>
                    <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">{selectedCambio.motivo}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-white/5 pt-6 mb-8">
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-2">Recursos Requeridos</span>
                    <p className="text-xs text-zinc-400 leading-relaxed italic bg-zinc-950/20 p-3 rounded-xl border border-white/5">
                      {selectedCambio.recursos_requeridos || "No se especificaron recursos especiales."}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-2">Evaluación de Riesgo SGI</span>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wide ${getImpactColor(selectedCambio.impacto_sgi).text}`}>
                        <span className={`w-2 h-2 rounded-full ${getImpactColor(selectedCambio.impacto_sgi).dot}`} />
                        Impacto {selectedCambio.impacto_sgi}
                      </span>
                    </div>
                  </div>
                </div>

                {/* TAREAS / ACCIONES CHECKLIST */}
                <div className="border-t border-white/5 pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                      <ListTodo className="w-4.5 h-4.5 text-secondary" />
                      Plan de Tareas e Hitos
                    </h3>
                    
                    {selectedCambio.estado !== "ejecutado" && selectedCambio.estado !== "cancelado" && (
                      <button
                        onClick={() => setIsAccionModalOpen(true)}
                        className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white font-semibold text-xs shadow hover:bg-white/10 hover:scale-[1.02] transition-all flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Añadir Tarea</span>
                      </button>
                    )}
                  </div>

                  {selectedCambio.acciones.length === 0 ? (
                    <div className="p-6 text-center border border-dashed border-zinc-800 rounded-2xl text-zinc-500 text-xs">
                      No se han agregado tareas específicas de mitigación para la ejecución de este cambio.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedCambio.acciones.map((acc) => {
                        const isDone = acc.estado === "completado";
                        return (
                          <div 
                            key={acc.id}
                            className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                              isDone 
                                ? "bg-emerald-500/5 border-emerald-500/10 text-zinc-400" 
                                : "bg-zinc-950/20 border-white/5 text-white"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {selectedCambio.estado !== "ejecutado" && selectedCambio.estado !== "cancelado" ? (
                                <button
                                  onClick={() => handleCompleteAccion(selectedCambio.id, acc.id)}
                                  disabled={isDone}
                                  className="text-zinc-500 hover:text-emerald-400 transition-colors"
                                >
                                  {isDone ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                  ) : (
                                    <Circle className="w-5 h-5" />
                                  )}
                                </button>
                              ) : (
                                <div>
                                  {isDone ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                  ) : (
                                    <Circle className="w-5 h-5 text-zinc-700" />
                                  )}
                                </div>
                              )}
                              <div>
                                <p className={`text-sm ${isDone ? "line-through text-zinc-500" : ""}`}>
                                  {acc.descripcion}
                                </p>
                                <span className="text-[10px] text-zinc-500 flex items-center gap-1 mt-1 font-semibold">
                                  <Calendar className="w-3 h-3" />
                                  Límite: {new Date(acc.fecha_limite).toLocaleDateString("es-ES")}
                                  {acc.fecha_ejecucion && ` | Completado: ${new Date(acc.fecha_ejecucion).toLocaleDateString("es-ES")}`}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: CREATE CAMBIO */}
      {isCambioModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-lg bg-zinc-900 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Shuffle className="w-5 h-5 text-secondary" />
                Registrar Control de Cambio SGI
              </h2>
              <button 
                onClick={() => setIsCambioModalOpen(false)}
                className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCambio} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Código *</label>
                  <input
                    type="text"
                    placeholder="Ej: M11-CAM-01"
                    required
                    value={newCodigo}
                    onChange={(e) => setNewCodigo(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/10 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Impacto SGI *</label>
                  <select
                    value={newImpactoSGI}
                    onChange={(e) => setNewImpactoSGI(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/10 text-white text-sm focus:outline-none focus:border-secondary transition-all"
                  >
                    <option value="bajo">Bajo Impacto</option>
                    <option value="medio">Medio Impacto</option>
                    <option value="alto">Alto Impacto</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Título del Cambio *</label>
                <input
                  type="text"
                  placeholder="Ej: Restructuración del Proceso de Compras de Materias Primas"
                  required
                  value={newTitulo}
                  onChange={(e) => setNewTitulo(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/10 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Descripción y Alcance *</label>
                <textarea
                  placeholder="Describa a detalle en qué consiste el cambio, áreas afectadas y consecuencias estimadas..."
                  required
                  rows={3}
                  value={newDescripcion}
                  onChange={(e) => setNewDescripcion(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/10 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Justificación del Cambio *</label>
                <textarea
                  placeholder="¿Por qué se propone esta modificación? (Motivos organizacionales, no conformidades, eficiencias)..."
                  required
                  rows={2}
                  value={newMotivo}
                  onChange={(e) => setNewMotivo(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/10 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Recursos Especiales</label>
                  <input
                    type="text"
                    placeholder="Ej: Presupuesto externo, TI, etc."
                    value={newRecursos}
                    onChange={(e) => setNewRecursos(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/10 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Fecha Límite</label>
                  <input
                    type="date"
                    value={newFechaLimite}
                    onChange={(e) => setNewFechaLimite(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/10 text-white text-sm focus:outline-none focus:border-secondary transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsCambioModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-secondary text-primary-foreground font-bold text-xs shadow hover:bg-secondary/90 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Registrar Cambio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD ACCION/TASK */}
      {isAccionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-secondary" />
                Agregar Tarea de Mitigación
              </h2>
              <button 
                onClick={() => setIsAccionModalOpen(false)}
                className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAccion} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Descripción de la Tarea *</label>
                <input
                  type="text"
                  placeholder="Ej: Modificar el documento interno de compras en el DMS"
                  required
                  value={newAccionDesc}
                  onChange={(e) => setNewAccionDesc(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/10 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Fecha Límite *</label>
                <input
                  type="date"
                  required
                  value={newAccionFecha}
                  onChange={(e) => setNewAccionFecha(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/10 text-white text-sm focus:outline-none focus:border-secondary transition-all"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsAccionModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-secondary text-primary-foreground font-bold text-xs shadow hover:bg-secondary/90 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Asignar Tarea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
