"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { 
  Target, 
  Plus, 
  Trash2, 
  TrendingUp, 
  ShieldAlert, 
  ShieldCheck, 
  Activity, 
  Calendar,
  Layers,
  Sparkles,
  Briefcase,
  FileText,
  Filter,
  RefreshCw,
  AlertCircle
} from "lucide-react";

interface Objetivo {
  id: string;
  nombre: string;
  descripcion: string;
  meta: number;
  unidad: string;
  indicador: string;
  frecuencia: string;
  fecha_limite: string;
  progreso: number;
}

interface Riesgo {
  id: string;
  descripcion: string;
  tipo: string;
  origen: string | null;
  probabilidad: number;
  impacto: number;
  probabilidad_residual: number;
  impacto_residual: number;
  acciones: string | null;
  estado: string;
  proceso_id: string | null;
  evidencia_documento_id: string | null;
}


export default function PlanificacionPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("objetivos");

  // Objetivos state
  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const [newObjNombre, setNewObjNombre] = useState("");
  const [newObjDesc, setNewObjDesc] = useState("");
  const [newObjMeta, setNewObjMeta] = useState(90);
  const [newObjIndicador, setNewObjIndicador] = useState("");
  const [newObjFrecuencia, setNewObjFrecuencia] = useState("mensual");
  const [newObjFecha, setNewObjFecha] = useState("");
  const [newObjProgreso, setNewObjProgreso] = useState(0);

  // Riesgos state
  const [riesgos, setRiesgos] = useState<Riesgo[]>([]);
  const [newRiesgoDesc, setNewRiesgoDesc] = useState("");
  const [newRiesgoTipo, setNewRiesgoTipo] = useState("riesgo");
  const [newRiesgoOrigen, setNewRiesgoOrigen] = useState("FODA");
  const [newRiesgoProb, setNewRiesgoProb] = useState(3);
  const [newRiesgoImp, setNewRiesgoImp] = useState(3);
  const [newRiesgoProbRes, setNewRiesgoProbRes] = useState(3);
  const [newRiesgoImpRes, setNewRiesgoImpRes] = useState(3);
  const [newRiesgoAcciones, setNewRiesgoAcciones] = useState("");
  const [newRiesgoProcesoId, setNewRiesgoProcesoId] = useState("");
  const [newRiesgoEvidenciaId, setNewRiesgoEvidenciaId] = useState("");

  // Business Lists
  const [procesos, setProcesos] = useState<any[]>([]);
  const [documentos, setDocumentos] = useState<any[]>([]);

  // Filtering
  const [selectedCell, setSelectedCell] = useState<{ prob: number; imp: number; type: "inherente" | "residual" } | null>(null);

  useEffect(() => {
    if (session?.user) {
      fetchObjetivos();
      fetchRiesgos();
      fetchProcesos();
      fetchDocumentos();
    }
  }, [session]);

  const fetchObjetivos = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/planificacion/objetivos`, {
        headers: { Authorization: `Bearer ${(session as any).accessToken}` },
      });
      if (res.ok) setObjetivos(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRiesgos = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/planificacion/riesgos`, {
        headers: { Authorization: `Bearer ${(session as any).accessToken}` },
      });
      if (res.ok) setRiesgos(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProcesos = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/procesos/`, {
        headers: { Authorization: `Bearer ${(session as any).accessToken}` },
      });
      if (res.ok) setProcesos(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDocumentos = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/documents/list`, {
        headers: { Authorization: `Bearer ${(session as any).accessToken}` },
      });
      if (res.ok) setDocumentos(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddObjetivo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newObjNombre || !newObjFecha || !newObjIndicador) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/planificacion/objetivos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any).accessToken}`,
        },
        body: JSON.stringify({
          nombre: newObjNombre,
          descripcion: newObjDesc,
          meta: Number(newObjMeta),
          unidad: "%",
          indicador: newObjIndicador,
          frecuencia: newObjFrecuencia,
          fecha_limite: newObjFecha,
          progreso: Number(newObjProgreso),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setObjetivos((prev) => [...prev, data]);
        setNewObjNombre("");
        setNewObjDesc("");
        setNewObjIndicador("");
        setNewObjFecha("");
        setNewObjProgreso(0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteObjetivo = async (id: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/planificacion/objetivos/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${(session as any).accessToken}` },
      });
      if (res.ok) {
        setObjetivos((prev) => prev.filter((o) => o.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddRiesgo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRiesgoDesc) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/planificacion/riesgos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any).accessToken}`,
        },
        body: JSON.stringify({
          descripcion: newRiesgoDesc,
          tipo: newRiesgoTipo,
          origen: newRiesgoOrigen,
          probabilidad: Number(newRiesgoProb),
          impacto: Number(newRiesgoImp),
          probabilidad_residual: Number(newRiesgoProbRes),
          impacto_residual: Number(newRiesgoImpRes),
          acciones: newRiesgoAcciones || null,
          proceso_id: newRiesgoProcesoId || null,
          evidencia_documento_id: newRiesgoEvidenciaId || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setRiesgos((prev) => [...prev, data]);
        setNewRiesgoDesc("");
        setNewRiesgoAcciones("");
        setNewRiesgoProcesoId("");
        setNewRiesgoEvidenciaId("");
        setNewRiesgoProb(3);
        setNewRiesgoImp(3);
        setNewRiesgoProbRes(3);
        setNewRiesgoImpRes(3);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRiesgo = async (id: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/planificacion/riesgos/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${(session as any).accessToken}` },
      });
      if (res.ok) {
        setRiesgos((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Helper to color code risks severity
  const getRiskSeverity = (prob: number, imp: number) => {
    const score = prob * imp;
    if (score >= 15) return { label: "Crítico", color: "text-red-700 bg-red-50 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/50" };
    if (score >= 5) return { label: "Moderado", color: "text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50" };
    return { label: "Aceptable", color: "text-green-700 bg-green-50 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/50" };
  };

  // Helpers to lookup process and document info
  const getProcesoInfo = (id: string | null) => {
    if (!id) return null;
    return procesos.find((p) => p.id === id);
  };

  const getDocumentoInfo = (id: string | null) => {
    if (!id) return null;
    return documentos.find((d) => d.id === id);
  };

  const handleDownloadEvidence = async (id: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/documents/${id}/download`, {
        headers: { Authorization: `Bearer ${(session as any).accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        window.open(data.download_url, "_blank");
      }
    } catch (err) {
      console.error("Error downloading evidence document:", err);
    }
  };

  // Active coordinates filter
  const filteredRiesgos = riesgos.filter((r) => {
    if (!selectedCell) return true;
    if (selectedCell.type === "inherente") {
      return r.probabilidad === selectedCell.prob && r.impacto === selectedCell.imp;
    } else {
      return r.probabilidad_residual === selectedCell.prob && r.impacto_residual === selectedCell.imp;
    }
  });

  return (
    <div className="space-y-8 animate-fade-in text-zinc-900 dark:text-zinc-50">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-heading flex items-center gap-2">
          <Target className="w-8 h-8 text-primary animate-pulse" />
          M03 · Planificación Estratégica del SGI
        </h1>
        <p className="text-muted-foreground text-sm">
          Planifica objetivos estratégicos de calidad y evalúa la severidad de riesgos y oportunidades bajo el estándar internacional ISO 31000.
        </p>
      </div>

      {/* Tabs selector */}
      <div className="flex border-b border-border overflow-x-auto gap-1">
        {[
          { id: "objetivos", name: "Objetivos del SGI", icon: TrendingUp },
          { id: "riesgos", name: "Matriz de Riesgos ISO 31000", icon: ShieldAlert },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-3 px-5 text-xs font-bold border-b-2 transition whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.name}
            </button>
          );
        })}
      </div>

      {activeTab === "objetivos" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form */}
          <form onSubmit={handleAddObjetivo} className="lg:col-span-4 bg-white dark:bg-zinc-950 p-6 border border-border rounded-xl shadow-sm space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground border-b pb-2">
              Nuevo Objetivo Estratégico
            </h3>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Nombre del Objetivo</label>
              <input
                type="text"
                required
                placeholder="Ej: Incrementar satisfacción al cliente"
                value={newObjNombre}
                onChange={(e) => setNewObjNombre(e.target.value)}
                className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Descripción del Logro</label>
              <textarea
                placeholder="Ej: Cumplir con las expectativas mediante la mejora de entregas..."
                value={newObjDesc}
                onChange={(e) => setNewObjDesc(e.target.value)}
                className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary h-20"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Meta (%)</label>
                <input
                  type="number"
                  required
                  placeholder="Ej: 95"
                  value={newObjMeta}
                  onChange={(e) => setNewObjMeta(Number(e.target.value))}
                  className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Progreso Inicial (%)</label>
                <input
                  type="number"
                  placeholder="Ej: 20"
                  value={newObjProgreso}
                  onChange={(e) => setNewObjProgreso(Number(e.target.value))}
                  className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">KPI / Fórmula Indicador</label>
              <input
                type="text"
                required
                placeholder="Ej: (Encuestas con puntaje > 8 / Total) * 100"
                value={newObjIndicador}
                onChange={(e) => setNewObjIndicador(e.target.value)}
                className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Frecuencia</label>
                <select
                  value={newObjFrecuencia}
                  onChange={(e) => setNewObjFrecuencia(e.target.value)}
                  className="w-full text-xs bg-muted/40 border border-border rounded-lg px-2.5 py-2 focus:outline-none focus:border-primary font-medium"
                >
                  <option value="mensual">Mensual</option>
                  <option value="trimestral">Trimestral</option>
                  <option value="semestral">Semestral</option>
                  <option value="anual">Anual</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Fecha Límite</label>
                <input
                  type="date"
                  required
                  value={newObjFecha}
                  onChange={(e) => setNewObjFecha(e.target.value)}
                  className="w-full text-xs bg-muted/40 border border-border rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-primary"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition shadow-sm"
            >
              Guardar Objetivo
            </button>
          </form>

          {/* List display */}
          <div className="lg:col-span-8 space-y-4">
            {objetivos.length === 0 ? (
              <div className="bg-white dark:bg-zinc-950 border border-border rounded-xl p-12 text-center text-muted-foreground italic shadow-sm">
                No hay objetivos estratégicos de calidad registrados.
              </div>
            ) : (
              objetivos.map((o) => (
                <div key={o.id} className="bg-white dark:bg-zinc-950 border border-border rounded-xl p-6 shadow-sm space-y-4 hover:shadow-md transition">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h4 className="font-bold text-base text-primary flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        {o.nombre}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1 max-w-xl leading-relaxed">
                        {o.descripcion}
                      </p>
                    </div>
                    <button onClick={() => handleDeleteObjetivo(o.id)} className="text-red-500 hover:text-red-700 transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-muted-foreground">Progreso Actual: {o.progreso}{o.unidad}</span>
                      <span className="text-primary">Meta: {o.meta}{o.unidad}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5">
                      <div
                        className="h-2.5 rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${Math.min((o.progreso / o.meta) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Badges footer */}
                  <div className="flex flex-wrap gap-2 pt-2 text-[10px] font-bold text-muted-foreground uppercase">
                    <span className="bg-muted px-2 py-0.5 rounded font-mono">
                      KPI: {o.indicador}
                    </span>
                    <span className="bg-muted px-2 py-0.5 rounded">
                      Frecuencia: {o.frecuencia}
                    </span>
                    <span className="bg-muted px-2 py-0.5 rounded flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Límite: {new Date(o.fecha_limite).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === "riesgos" && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* Matrices & Form column */}
          <div className="xl:col-span-6 space-y-6">
            
            {/* DUAL 5x5 RAM MATRICES */}
            <div className="bg-white dark:bg-zinc-950 p-6 border border-border rounded-xl shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b border-border pb-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary animate-pulse" />
                  Matrices RAM 5x5 (ISO 31000)
                </h3>
                {selectedCell && (
                  <button 
                    onClick={() => setSelectedCell(null)}
                    className="text-[10px] bg-primary/10 hover:bg-primary/20 text-primary font-bold px-2 py-1 rounded transition flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Limpiar Filtro (P{selectedCell.prob}xI{selectedCell.imp})
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* 1. Inherente Matrix */}
                <div className="space-y-4">
                  <div className="text-center">
                    <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wide flex items-center justify-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      1. Riesgo Inherente
                    </span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Evaluación inicial sin controles</p>
                  </div>
                  
                  {/* Heatmap Grid */}
                  <div className="flex flex-col gap-1 w-full max-w-[280px] mx-auto font-sans">
                    <div className="text-center text-[8px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                      ← Menor IMPACTO Mayor →
                    </div>
                    
                    {[5, 4, 3, 2, 1].map((prob) => (
                      <div key={prob} className="flex gap-1 items-center">
                        <div className="w-5 text-[8px] font-bold text-muted-foreground text-center">
                          P{prob}
                        </div>
                        {[1, 2, 3, 4, 5].map((imp) => {
                          const score = prob * imp;
                          let cellClass = "bg-green-500/80 hover:bg-green-500 text-white";
                          if (score >= 15) cellClass = "bg-red-500 hover:bg-red-600 text-white";
                          else if (score >= 5) cellClass = "bg-amber-400 hover:bg-amber-500 text-zinc-900";
                          
                          const count = riesgos.filter((r) => r.probabilidad === prob && r.impacto === imp).length;
                          const isSelected = selectedCell && selectedCell.prob === prob && selectedCell.imp === imp && selectedCell.type === "inherente";

                          return (
                            <div
                              key={imp}
                              onClick={() => setSelectedCell({ prob, imp, type: "inherente" })}
                              className={`flex-1 aspect-square rounded flex flex-col items-center justify-center font-bold text-[10px] border select-none cursor-pointer transition hover:scale-[1.08] relative shadow-sm ${cellClass} ${
                                isSelected ? "ring-2 ring-primary ring-offset-2 dark:ring-offset-zinc-950 scale-[1.08] border-white font-extrabold shadow-md" : "border-white/10"
                              }`}
                              title={`Probabilidad: ${prob}, Impacto: ${imp} (Score: ${score})`}
                            >
                              <span>{score}</span>
                              {count > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-0.5 bg-zinc-900 text-white rounded-full flex items-center justify-center font-mono text-[7px] border border-white">
                                  {count}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                    
                    <div className="flex gap-1 pl-5 mt-0.5">
                      {[1, 2, 3, 4, 5].map((imp) => (
                        <div key={imp} className="flex-1 text-[8px] font-bold text-muted-foreground text-center">
                          I{imp}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. Residual Matrix */}
                <div className="space-y-4">
                  <div className="text-center">
                    <span className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wide flex items-center justify-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      2. Riesgo Residual
                    </span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Mitigado con controles aplicados</p>
                  </div>
                  
                  {/* Heatmap Grid */}
                  <div className="flex flex-col gap-1 w-full max-w-[280px] mx-auto font-sans">
                    <div className="text-center text-[8px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                      ← Menor IMPACTO Mayor →
                    </div>
                    
                    {[5, 4, 3, 2, 1].map((prob) => (
                      <div key={prob} className="flex gap-1 items-center">
                        <div className="w-5 text-[8px] font-bold text-muted-foreground text-center">
                          P{prob}
                        </div>
                        {[1, 2, 3, 4, 5].map((imp) => {
                          const score = prob * imp;
                          let cellClass = "bg-green-500/80 hover:bg-green-500 text-white";
                          if (score >= 15) cellClass = "bg-red-500 hover:bg-red-600 text-white";
                          else if (score >= 5) cellClass = "bg-amber-400 hover:bg-amber-500 text-zinc-900";
                          
                          const count = riesgos.filter((r) => r.probabilidad_residual === prob && r.impacto_residual === imp).length;
                          const isSelected = selectedCell && selectedCell.prob === prob && selectedCell.imp === imp && selectedCell.type === "residual";

                          return (
                            <div
                              key={imp}
                              onClick={() => setSelectedCell({ prob, imp, type: "residual" })}
                              className={`flex-1 aspect-square rounded flex flex-col items-center justify-center font-bold text-[10px] border select-none cursor-pointer transition hover:scale-[1.08] relative shadow-sm ${cellClass} ${
                                isSelected ? "ring-2 ring-primary ring-offset-2 dark:ring-offset-zinc-950 scale-[1.08] border-white font-extrabold shadow-md" : "border-white/10"
                              }`}
                              title={`Probabilidad: ${prob}, Impacto: ${imp} (Score: ${score})`}
                            >
                              <span>{score}</span>
                              {count > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-0.5 bg-zinc-900 text-white rounded-full flex items-center justify-center font-mono text-[7px] border border-white">
                                  {count}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                    
                    <div className="flex gap-1 pl-5 mt-0.5">
                      {[1, 2, 3, 4, 5].map((imp) => (
                        <div key={imp} className="flex-1 text-[8px] font-bold text-muted-foreground text-center">
                          I{imp}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleAddRiesgo} className="bg-white dark:bg-zinc-950 p-6 border border-border rounded-xl shadow-sm space-y-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground border-b pb-2 flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary" />
                Registrar Escenario (ISO 31000)
              </h3>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Descripción del Escenario</label>
                <textarea
                  required
                  placeholder="Ej: Fuga de datos confidenciales de clientes..."
                  value={newRiesgoDesc}
                  onChange={(e) => setNewRiesgoDesc(e.target.value)}
                  className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary h-20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Tipo de Impacto</label>
                  <select
                    value={newRiesgoTipo}
                    onChange={(e) => setNewRiesgoTipo(e.target.value)}
                    className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary font-medium"
                  >
                    <option value="riesgo">Riesgo (Negativo)</option>
                    <option value="oportunidad">Oportunidad (Positivo)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Origen / Fuente</label>
                  <select
                    value={newRiesgoOrigen}
                    onChange={(e) => setNewRiesgoOrigen(e.target.value)}
                    className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary font-medium"
                  >
                    <option value="FODA">FODA Interno</option>
                    <option value="PESTEL">PESTEL Externo</option>
                    <option value="proceso">Proceso / BPM</option>
                    <option value="auditoria">Auditoría / Hallazgo</option>
                  </select>
                </div>
              </div>

              {/* Proceso y Evidencia select combos */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Proceso SGI Asociado</label>
                  <select
                    value={newRiesgoProcesoId}
                    onChange={(e) => setNewRiesgoProcesoId(e.target.value)}
                    className="w-full text-xs bg-muted/40 border border-border rounded-lg px-2.5 py-2 focus:outline-none focus:border-primary font-medium text-zinc-800 dark:text-zinc-100"
                  >
                    <option value="">-- Sin Proceso --</option>
                    {procesos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.codigo} - {p.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Control / Evidencia DMS</label>
                  <select
                    value={newRiesgoEvidenciaId}
                    onChange={(e) => setNewRiesgoEvidenciaId(e.target.value)}
                    className="w-full text-xs bg-muted/40 border border-border rounded-lg px-2.5 py-2 focus:outline-none focus:border-primary font-medium text-zinc-800 dark:text-zinc-100"
                  >
                    <option value="">-- Sin Evidencia --</option>
                    {documentos.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.title} ({d.status})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Evaluaciones side-by-side */}
              <div className="grid grid-cols-2 gap-4 border-t border-border pt-3 mt-1">
                {/* Inherente */}
                <div className="space-y-3 bg-red-500/5 p-3 rounded-lg border border-red-500/10">
                  <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Evaluación Inherente
                  </span>
                  
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase">Probabilidad (1-5)</label>
                    <select
                      value={newRiesgoProb}
                      onChange={(e) => setNewRiesgoProb(Number(e.target.value))}
                      className="w-full text-xs bg-white dark:bg-zinc-900 border border-border rounded px-2 py-1 focus:outline-none focus:border-primary"
                    >
                      <option value="1">1 - Muy Baja</option>
                      <option value="2">2 - Baja</option>
                      <option value="3">3 - Media</option>
                      <option value="4">4 - Alta</option>
                      <option value="5">5 - Muy Alta</option>
                    </select>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase">Impacto (1-5)</label>
                    <select
                      value={newRiesgoImp}
                      onChange={(e) => setNewRiesgoImp(Number(e.target.value))}
                      className="w-full text-xs bg-white dark:bg-zinc-900 border border-border rounded px-2 py-1 focus:outline-none focus:border-primary"
                    >
                      <option value="1">1 - Insignificante</option>
                      <option value="2">2 - Menor</option>
                      <option value="3">3 - Moderado</option>
                      <option value="4">4 - Mayor</option>
                      <option value="5">5 - Catastrófico</option>
                    </select>
                  </div>

                  <div className="text-[10px] font-bold text-center border-t border-red-500/10 pt-1.5 text-red-600 dark:text-red-400">
                    Criticidad: {newRiesgoProb * newRiesgoImp} ({(newRiesgoProb * newRiesgoImp) >= 15 ? "Crítico" : (newRiesgoProb * newRiesgoImp) >= 5 ? "Moderado" : "Aceptable"})
                  </div>
                </div>

                {/* Residual */}
                <div className="space-y-3 bg-green-500/5 p-3 rounded-lg border border-green-500/10">
                  <span className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Evaluación Residual
                  </span>
                  
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase">Probabilidad (1-5)</label>
                    <select
                      value={newRiesgoProbRes}
                      onChange={(e) => setNewRiesgoProbRes(Number(e.target.value))}
                      className="w-full text-xs bg-white dark:bg-zinc-900 border border-border rounded px-2 py-1 focus:outline-none focus:border-primary"
                    >
                      <option value="1">1 - Muy Baja</option>
                      <option value="2">2 - Baja</option>
                      <option value="3">3 - Media</option>
                      <option value="4">4 - Alta</option>
                      <option value="5">5 - Muy Alta</option>
                    </select>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase">Impacto (1-5)</label>
                    <select
                      value={newRiesgoImpRes}
                      onChange={(e) => setNewRiesgoImpRes(Number(e.target.value))}
                      className="w-full text-xs bg-white dark:bg-zinc-900 border border-border rounded px-2 py-1 focus:outline-none focus:border-primary"
                    >
                      <option value="1">1 - Insignificante</option>
                      <option value="2">2 - Menor</option>
                      <option value="3">3 - Moderado</option>
                      <option value="4">4 - Mayor</option>
                      <option value="5">5 - Catastrófico</option>
                    </select>
                  </div>

                  <div className="text-[10px] font-bold text-center border-t border-green-500/10 pt-1.5 text-green-600 dark:text-green-400">
                    Criticidad: {newRiesgoProbRes * newRiesgoImpRes} ({(newRiesgoProbRes * newRiesgoImpRes) >= 15 ? "Crítico" : (newRiesgoProbRes * newRiesgoImpRes) >= 5 ? "Moderado" : "Aceptable"})
                  </div>
                </div>
              </div>

              {/* Real-time math emission reduction estimation card */}
              <div className="p-3 bg-primary/5 rounded-lg border border-primary/10 text-center space-y-1">
                <span className="text-[10px] font-bold text-primary uppercase block">Reducción de Criticidad Estimada</span>
                <div className="text-base font-extrabold text-primary flex items-center justify-center gap-2">
                  <span>{newRiesgoProb * newRiesgoImp} ➔ {newRiesgoProbRes * newRiesgoImpRes}</span>
                  <span className="text-[10px] font-bold bg-primary text-white px-2 py-0.5 rounded-full">
                    {Math.max(0, Math.round(((newRiesgoProb * newRiesgoImp - newRiesgoProbRes * newRiesgoImpRes) / (newRiesgoProb * newRiesgoImp || 1)) * 100))}% de Mitigación
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Medidas de Mitigación / Acciones</label>
                <textarea
                  placeholder="Ej: Implementar cortafuegos y cifrado de extremo a extremo..."
                  value={newRiesgoAcciones}
                  onChange={(e) => setNewRiesgoAcciones(e.target.value)}
                  className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary h-20"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition shadow-sm flex items-center justify-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Guardar Escenario de Riesgo
              </button>
            </form>
          </div>

          {/* List display column */}
          <div className="xl:col-span-6 space-y-4">
            
            {/* Filter indication alert */}
            {selectedCell && (
              <div className="bg-primary/5 text-primary border border-primary/20 p-3.5 rounded-xl text-xs font-bold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Filter className="w-4 h-4 animate-bounce" />
                  Filtrando por Matriz {selectedCell.type === "inherente" ? "Inherente" : "Residual"}: Celda (Probabilidad {selectedCell.prob} x Impacto {selectedCell.imp})
                </span>
                <button 
                  onClick={() => setSelectedCell(null)} 
                  className="bg-white dark:bg-zinc-900 border border-border hover:bg-muted text-[10px] px-2 py-1 rounded transition"
                >
                  Limpiar Filtro
                </button>
              </div>
            )}

            <div className="bg-white dark:bg-zinc-950 border border-border rounded-xl shadow-sm overflow-hidden flex flex-col h-fit">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/40 border-b border-border font-bold uppercase tracking-wider text-muted-foreground text-[10px]">
                    <th className="p-4">Escenario / Relaciones</th>
                    <th className="p-4 text-center">Criticidad (Inherente ➔ Residual)</th>
                    <th className="p-4">Clasificación Residual</th>
                    <th className="p-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs">
                  {filteredRiesgos.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-muted-foreground italic">
                        {selectedCell ? "No hay riesgos en esta celda seleccionada de la matriz." : "No hay riesgos u oportunidades evaluadas."}
                      </td>
                    </tr>
                  ) : (
                    filteredRiesgos.map((r) => {
                      const scoreInh = r.probabilidad * r.impacto;
                      const scoreRes = r.probabilidad_residual * r.impacto_residual;
                      const sevRes = getRiskSeverity(r.probabilidad_residual, r.impacto_residual);
                      const proc = getProcesoInfo(r.proceso_id);
                      const doc = getDocumentoInfo(r.evidencia_documento_id);

                      return (
                        <tr key={r.id} className="hover:bg-muted/10 transition">
                          <td className="p-4 space-y-1.5 max-w-[240px]">
                            <span className="font-semibold block leading-relaxed">{r.descripcion}</span>
                            
                            {/* Badges row */}
                            <div className="flex flex-wrap gap-1 text-[9px] font-bold uppercase mt-1">
                              <span className={`px-1.5 py-0.5 rounded ${r.tipo === "riesgo" ? "bg-red-50 text-red-500 dark:bg-red-950/20" : "bg-green-50 text-green-500 dark:bg-green-950/20"}`}>
                                {r.tipo}
                              </span>
                              <span className="bg-muted px-1.5 py-0.5 rounded font-normal text-muted-foreground">
                                {r.origen}
                              </span>
                            </div>

                            {/* Relationships display */}
                            {(proc || doc || r.acciones) && (
                              <div className="pt-2 border-t border-border space-y-1 text-[10px] text-muted-foreground">
                                {proc && (
                                  <div className="flex items-center gap-1 font-mono">
                                    <Briefcase className="w-3.5 h-3.5 text-primary shrink-0" />
                                    <span>Proceso: {proc.codigo} - {proc.nombre}</span>
                                  </div>
                                )}
                                {doc && (
                                  <div className="flex items-center gap-1 font-mono">
                                    <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                                    <span>Evidencia: </span>
                                    <button 
                                      onClick={() => handleDownloadEvidence(doc.id)} 
                                      className="text-primary hover:underline text-left font-bold"
                                    >
                                      {doc.title}
                                    </button>
                                  </div>
                                )}
                                {r.acciones && (
                                  <div className="bg-muted/40 p-1.5 rounded text-[10px] italic leading-relaxed text-zinc-700 dark:text-zinc-300">
                                    <strong>Mitigación:</strong> {r.acciones}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-center font-extrabold text-sm font-mono whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <span className="text-red-500">{scoreInh}</span>
                              <span className="text-muted-foreground font-normal text-xs">➔</span>
                              <span className="text-green-600 dark:text-green-400">{scoreRes}</span>
                            </div>
                            <span className="block text-[8px] font-semibold text-muted-foreground font-normal mt-0.5">
                              (P{r.probabilidad}xI{r.impacto} ➔ P{r.probabilidad_residual}xI{r.impacto_residual})
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase border ${sevRes.color}`}>
                              {sevRes.label}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <button onClick={() => handleDeleteRiesgo(r.id)} className="text-red-500 hover:text-red-700 transition p-1 hover:bg-red-50 rounded">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

