"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  AlertOctagon,
  Plus,
  Calendar,
  Tag,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  Activity,
  Sliders,
  Check,
  TrendingUp,
  FileText,
  User,
  AlertCircle,
  FolderOpen,
  Info,
  Clock,
  CheckSquare
} from "lucide-react";

interface CorrectiveActionItem {
  id: string;
  descripcion: string;
  analisis_causa_raiz?: string;
  fecha_planificada: string;
  fecha_implementacion?: string;
  responsable_id?: string;
}

interface NonConformityItem {
  id: string;
  title: string;
  description: string;
  origin: string;
  estado: string;
  fecha_deteccion: string;
  five_whys?: string; // JSON string
  ishikawa?: string; // JSON string
  fecha_cierre?: string;
  cierre_comentarios?: string;
  corrective_actions: CorrectiveActionItem[];
}

interface IshikawaStructure {
  metodo: string[];
  maquina: string[];
  material: string[];
  manoObra: string[];
  medicion: string[];
  medioAmbiente: string[];
}

const initialIshikawa: IshikawaStructure = {
  metodo: [],
  maquina: [],
  material: [],
  manoObra: [],
  medicion: [],
  medioAmbiente: []
};

export default function ISO9001Page() {
  const { data: session } = useSession();
  const [ncs, setNcs] = useState<NonConformityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Active Tab for detail card
  const [activeTab, setActiveTab] = useState<"analisis" | "acciones" | "cierre">("analisis");
  // Sub-analysis tab: 5whys vs ishikawa
  const [analysisType, setAnalysisType] = useState<"5whys" | "ishikawa">("5whys");

  // Selected NC for details
  const [selectedNc, setSelectedNc] = useState<NonConformityItem | null>(null);

  // New NC Form state
  const [ncTitle, setNcTitle] = useState("");
  const [ncDesc, setNcDesc] = useState("");
  const [ncOrigin, setNcOrigin] = useState("interno");
  const [submittingNC, setSubmittingNC] = useState(false);

  // New Corrective Action Form state
  const [actionDesc, setActionDesc] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  // 5 Whys State variables
  const [whys, setWhys] = useState<string[]>(["", "", "", "", ""]);

  // Ishikawa state
  const [ishikawaData, setIshikawaData] = useState<IshikawaStructure>(initialIshikawa);
  const [selectedIshikawaCategory, setSelectedIshikawaCategory] = useState<keyof IshikawaStructure>("metodo");
  const [newCauseText, setNewCauseText] = useState("");

  // Closing parameters
  const [closeComments, setCloseComments] = useState("");
  const [submittingClose, setSubmittingClose] = useState(false);

  const fetchNonConformities = async () => {
    try {
      if (!session?.user) return;
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/iso9001/non-conformities`, {
        headers: {
          Authorization: `Bearer ${(session as any).accessToken}`,
        },
      });

      if (!res.ok) {
        throw new Error("No se pudo obtener el catálogo de desviaciones.");
      }

      const data = await res.json();
      setNcs(data);
      
      // Keep selected NC data updated
      if (selectedNc) {
        const updated = data.find((n: any) => n.id === selectedNc.id);
        if (updated) {
          setSelectedNc(updated);
        }
      }
    } catch (err: any) {
      setError(err.message || "Error al cargar no conformidades.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNonConformities();
  }, [session]);

  // Load selected NC data into interactive analysis inputs
  useEffect(() => {
    if (selectedNc) {
      // 5 Whys
      try {
        if (selectedNc.five_whys) {
          const parsed = JSON.parse(selectedNc.five_whys);
          if (Array.isArray(parsed)) {
            const padded = [...parsed];
            while (padded.length < 5) padded.push("");
            setWhys(padded);
          } else {
            setWhys([selectedNc.five_whys, "", "", "", ""]);
          }
        } else {
          setWhys(["", "", "", "", ""]);
        }
      } catch {
        setWhys([selectedNc.five_whys || "", "", "", "", ""]);
      }

      // Ishikawa
      try {
        if (selectedNc.ishikawa) {
          const parsed = JSON.parse(selectedNc.ishikawa);
          setIshikawaData({
            metodo: parsed.metodo || [],
            maquina: parsed.maquina || [],
            material: parsed.material || [],
            manoObra: parsed.manoObra || [],
            medicion: parsed.medicion || [],
            medioAmbiente: parsed.medioAmbiente || []
          });
        } else {
          setIshikawaData(initialIshikawa);
        }
      } catch {
        setIshikawaData(initialIshikawa);
      }

      setCloseComments(selectedNc.cierre_comentarios || "");
    }
  }, [selectedNc]);

  const handleNCCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ncTitle.trim() || !ncDesc.trim()) return;

    try {
      setSubmittingNC(true);
      setError(null);
      setSuccess(null);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/iso9001/non-conformities`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any).accessToken}`,
        },
        body: JSON.stringify({
          title: ncTitle,
          description: ncDesc,
          origin: ncOrigin,
        }),
      });

      if (!res.ok) {
        throw new Error("No se pudo registrar la No Conformidad.");
      }

      const created = await res.json();
      setNcTitle("");
      setNcDesc("");
      setNcOrigin("interno");
      setSuccess("No Conformidad registrada con éxito en el SGI.");

      await fetchNonConformities();
      setSelectedNc(created);
    } catch (err: any) {
      setError(err.message || "Error al crear No Conformidad");
    } finally {
      setSubmittingNC(false);
    }
  };

  const handleSaveAnalysis = async () => {
    if (!selectedNc) return;
    try {
      setError(null);
      setSuccess(null);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/iso9001/non-conformities/${selectedNc.id}/analysis`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any).accessToken}`,
        },
        body: JSON.stringify({
          five_whys: JSON.stringify(whys.filter(w => w.trim() !== "")),
          ishikawa: JSON.stringify(ishikawaData),
        }),
      });

      if (!res.ok) {
        throw new Error("No se pudo registrar el análisis de causas.");
      }

      setSuccess("Análisis de causa raíz (CAPA) guardado exitosamente.");
      await fetchNonConformities();
    } catch (err: any) {
      setError(err.message || "Error al guardar el análisis.");
    }
  };

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNc || !actionDesc.trim() || !targetDate) return;

    try {
      setSubmittingAction(true);
      setError(null);
      setSuccess(null);

      // Concatenate standard cause text for retro-compatibility, or use primary root cause
      const primaryRootCause = whys.filter(w => w.trim() !== "").pop() || "Ishikawa Analizado";

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/iso9001/corrective-actions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any).accessToken}`,
        },
        body: JSON.stringify({
          non_conformity_id: selectedNc.id,
          descripcion: actionDesc,
          analisis_causa_raiz: `Causa Raíz: ${primaryRootCause}`,
          fecha_planificada: new Date(targetDate).toISOString(),
        }),
      });

      if (!res.ok) {
        throw new Error("No se pudo agendar la acción correctiva.");
      }

      setActionDesc("");
      setTargetDate("");
      setSuccess("Acción correctiva agregada y planificada correctamente.");
      await fetchNonConformities();
    } catch (err: any) {
      setError(err.message || "Error al registrar plan de acción");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleImplementAction = async (actionId: string) => {
    try {
      setError(null);
      setSuccess(null);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/iso9001/corrective-actions/${actionId}/implement`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${(session as any).accessToken}`,
        },
      });

      if (!res.ok) {
        throw new Error("No se pudo registrar la implementación de la acción.");
      }

      setSuccess("Acción correctiva marcada como IMPLEMENTADA exitosamente.");
      await fetchNonConformities();
    } catch (err: any) {
      setError(err.message || "Error al implementar acción.");
    }
  };

  const handleCloseNC = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNc || !closeComments.trim()) return;

    try {
      setSubmittingClose(true);
      setError(null);
      setSuccess(null);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/iso9001/non-conformities/${selectedNc.id}/close`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any).accessToken}`,
        },
        body: JSON.stringify({
          cierre_comentarios: closeComments
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "No se pudo realizar el cierre formal.");
      }

      setSuccess("¡No Conformidad cerrada y archivada formalmente en el SGI!");
      await fetchNonConformities();
    } catch (err: any) {
      setError(err.message || "Error al cerrar No Conformidad.");
    } finally {
      setSubmittingClose(false);
    }
  };

  // Add cause to selected Ishikawa category
  const handleAddIshikawaCause = () => {
    if (!newCauseText.trim()) return;
    setIshikawaData(prev => ({
      ...prev,
      [selectedIshikawaCategory]: [...prev[selectedIshikawaCategory], newCauseText.trim()]
    }));
    setNewCauseText("");
  };

  // Remove cause from Ishikawa category
  const handleRemoveIshikawaCause = (cat: keyof IshikawaStructure, index: number) => {
    setIshikawaData(prev => ({
      ...prev,
      [cat]: prev[cat].filter((_, i) => i !== index)
    }));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "cerrada":
        return (
          <span className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 w-fit">
            <CheckCircle2 className="w-3 h-3 text-green-600" /> Cerrada
          </span>
        );
      case "resuelta":
        return (
          <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 w-fit">
            <CheckSquare className="w-3 h-3 text-blue-600" /> Resuelta
          </span>
        );
      case "analizada":
        return (
          <span className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 w-fit">
            <Sliders className="w-3 h-3 text-amber-600" /> Analizada
          </span>
        );
      default:
        return (
          <span className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 w-fit animate-pulse">
            <AlertOctagon className="w-3 h-3 text-red-600" /> Abierta
          </span>
        );
    }
  };

  // UI category mappings for Ishikawa
  const ishikawaCategories: { key: keyof IshikawaStructure; label: string; desc: string }[] = [
    { key: "metodo", label: "Método", desc: "Procedimientos, normas, flujo operativo" },
    { key: "maquina", label: "Máquina", desc: "Equipos, herramientas, mantenimiento" },
    { key: "material", label: "Material", desc: "Insumos, calidad de materia prima" },
    { key: "manoObra", label: "Mano de Obra", desc: "Competencias, capacitación, fatiga" },
    { key: "medicion", label: "Medición", desc: "Calibración, indicadores, inspecciones" },
    { key: "medioAmbiente", label: "Medio Ambiente", desc: "Clima, orden, ruido, iluminación" }
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-3xl font-bold font-heading tracking-tight flex items-center gap-2 text-primary">
            <ShieldAlert className="w-8 h-8 text-primary" /> Desviaciones y CAPA
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestión completa de No Conformidades y Acciones Correctivas (ISO 9001 Cláusula 10.2).
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs bg-muted/50 p-2.5 rounded-xl border border-border">
          <TrendingUp className="w-4 h-4 text-secondary" />
          <span className="font-semibold">Mejora Continua:</span>
          <span>{ncs.filter(n => n.estado === "cerrada").length} / {ncs.length} Cerradas</span>
        </div>
      </div>

      {/* Global Alerts */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 p-4 rounded-r-xl text-sm text-red-800 dark:text-red-300 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div><strong>Error:</strong> {error}</div>
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border-l-4 border-emerald-500 p-4 rounded-r-xl text-sm text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <div><strong>Éxito:</strong> {success}</div>
        </div>
      )}

      {/* Primary Layout Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Left Side: Ledger / Directory of deviations */}
        <div className="xl:col-span-4 space-y-6">
          
          {/* Form to declare dynamic deviation */}
          <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-border shadow-sm space-y-4">
            <h3 className="font-bold text-sm tracking-wide uppercase text-primary flex items-center gap-2 border-b border-border pb-3">
              <Plus className="w-4 h-4 text-secondary" /> Declarar Desviación
            </h3>
            
            <form onSubmit={handleNCCreate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Hallazgo / Título Corto
                </label>
                <input
                  type="text"
                  required
                  value={ncTitle}
                  onChange={(e) => setNcTitle(e.target.value)}
                  placeholder="Ej: Desviación en frecuencia de calibración"
                  className="w-full px-3.5 py-2 border border-input rounded-lg text-sm bg-muted/20 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Origen del Hallazgo
                </label>
                <select
                  value={ncOrigin}
                  onChange={(e) => setNcOrigin(e.target.value)}
                  className="w-full px-3.5 py-2 border border-input rounded-lg text-sm bg-muted/20 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                >
                  <option value="interno">Auditoría Interna</option>
                  <option value="auditoria">Auditoría Externa</option>
                  <option value="externo">Reclamo / Incidente Externo</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Descripción Detallada y Evidencias
                </label>
                <textarea
                  rows={3}
                  required
                  value={ncDesc}
                  onChange={(e) => setNcDesc(e.target.value)}
                  placeholder="Se constató que el sensor de emisiones no cuenta con etiqueta..."
                  className="w-full px-3.5 py-2 border border-input rounded-lg text-sm bg-muted/20 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>

              <button
                type="submit"
                disabled={submittingNC}
                className="w-full py-2.5 px-4 bg-primary text-white font-bold rounded-lg text-xs hover:bg-primary/95 shadow transition disabled:opacity-50 flex items-center justify-center gap-1"
              >
                <Check className="w-4 h-4" />
                {submittingNC ? "Procesando..." : "Ingresar en Libro SGI"}
              </button>
            </form>
          </div>

          {/* Directory of No Conformities */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm tracking-wide uppercase text-muted-foreground flex items-center gap-2 pl-1">
              <FolderOpen className="w-4 h-4 text-primary" /> Libro de Registro ({ncs.length})
            </h3>

            {loading ? (
              <div className="p-8 text-center text-xs text-muted-foreground bg-white dark:bg-zinc-950 border border-border rounded-xl shadow-sm animate-pulse">
                Cargando libro de desviaciones...
              </div>
            ) : ncs.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground bg-white dark:bg-zinc-950 border border-border rounded-xl shadow-sm space-y-2">
                <CheckCircle2 className="w-8 h-8 text-secondary mx-auto" />
                <p className="font-bold text-sm">Libro Limpio</p>
                <p>No se registran desviaciones abiertas en este tenant.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {ncs.map((nc) => {
                  const isSelected = selectedNc?.id === nc.id;
                  return (
                    <div
                      key={nc.id}
                      onClick={() => setSelectedNc(nc)}
                      className={`bg-white dark:bg-zinc-950 border rounded-xl p-4 shadow-sm hover:shadow-md cursor-pointer transition-all flex items-start justify-between gap-3 ${
                        isSelected
                          ? "border-primary ring-2 ring-primary/10 bg-primary/5"
                          : "border-border hover:border-muted-foreground"
                      }`}
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getStatusBadge(nc.estado)}
                          <span className="bg-muted text-muted-foreground text-[9px] font-bold px-2 py-0.5 rounded-full capitalize">
                            {nc.origin}
                          </span>
                        </div>
                        <h4 className="font-bold text-xs leading-snug text-foreground line-clamp-1">{nc.title}</h4>
                        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">{nc.description}</p>
                        
                        <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground pt-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(nc.fecha_deteccion).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{nc.corrective_actions.length} acciones</span>
                        </div>
                      </div>

                      <ChevronRight className={`w-4 h-4 text-muted-foreground self-center transition-transform ${isSelected ? "translate-x-1 text-primary" : ""}`} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Right Side: Visual CAPA Console */}
        <div className="xl:col-span-8">
          {selectedNc ? (
            <div className="bg-white dark:bg-zinc-950 border border-border rounded-xl shadow-sm overflow-hidden flex flex-col h-full animate-fade-in">
              
              {/* Selected NC Header & Stepper */}
              <div className="bg-muted/30 p-6 border-b border-border space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <span className="text-[10px] font-bold text-secondary uppercase tracking-widest bg-secondary/10 px-2 py-1 rounded-md w-fit">
                    Detalle CAPA
                  </span>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Detectada el: {new Date(selectedNc.fecha_deteccion).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-foreground leading-snug">{selectedNc.title}</h2>
                  <p className="text-xs text-muted-foreground leading-relaxed bg-white dark:bg-zinc-900 p-3 rounded-lg border border-border">
                    {selectedNc.description}
                  </p>
                </div>

                {/* 4-Step Lifecyle Stepper */}
                <div className="pt-2">
                  <div className="flex items-center justify-between max-w-lg mx-auto text-xs font-semibold relative">
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2 z-0" />
                    
                    {/* Step 1: Abierta */}
                    <div className="z-10 flex flex-col items-center gap-1">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition ${
                        selectedNc.estado === "abierta" 
                          ? "bg-red-500 text-white border-red-500 ring-4 ring-red-500/20" 
                          : "bg-green-500 text-white border-green-500"
                      }`}>
                        1
                      </div>
                      <span className="text-[10px] text-muted-foreground">Abierta</span>
                    </div>

                    {/* Step 2: Analizada */}
                    <div className="z-10 flex flex-col items-center gap-1">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition ${
                        selectedNc.estado === "analizada"
                          ? "bg-amber-500 text-white border-amber-500 ring-4 ring-amber-500/20"
                          : ["resuelta", "cerrada"].includes(selectedNc.estado)
                          ? "bg-green-500 text-white border-green-500"
                          : "bg-white dark:bg-zinc-900 text-muted-foreground border-border"
                      }`}>
                        2
                      </div>
                      <span className="text-[10px] text-muted-foreground">Analizada</span>
                    </div>

                    {/* Step 3: Resuelta */}
                    <div className="z-10 flex flex-col items-center gap-1">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition ${
                        selectedNc.estado === "resuelta"
                          ? "bg-blue-500 text-white border-blue-500 ring-4 ring-blue-500/20"
                          : selectedNc.estado === "cerrada"
                          ? "bg-green-500 text-white border-green-500"
                          : "bg-white dark:bg-zinc-900 text-muted-foreground border-border"
                      }`}>
                        3
                      </div>
                      <span className="text-[10px] text-muted-foreground">Resuelta</span>
                    </div>

                    {/* Step 4: Cerrada */}
                    <div className="z-10 flex flex-col items-center gap-1">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition ${
                        selectedNc.estado === "cerrada"
                          ? "bg-green-600 text-white border-green-600 ring-4 ring-green-600/20"
                          : "bg-white dark:bg-zinc-900 text-muted-foreground border-border"
                      }`}>
                        4
                      </div>
                      <span className="text-[10px] text-muted-foreground">Cerrada</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Main Panel Tabs */}
              <div className="border-b border-border bg-muted/10 flex">
                <button
                  onClick={() => setActiveTab("analisis")}
                  className={`flex-1 py-3 text-xs font-bold tracking-wider uppercase border-b-2 text-center transition flex items-center justify-center gap-1.5 ${
                    activeTab === "analisis"
                      ? "border-primary text-primary bg-white dark:bg-zinc-950"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Activity className="w-4 h-4" /> 1. Análisis Causa Raíz
                </button>
                <button
                  onClick={() => setActiveTab("acciones")}
                  className={`flex-1 py-3 text-xs font-bold tracking-wider uppercase border-b-2 text-center transition flex items-center justify-center gap-1.5 ${
                    activeTab === "acciones"
                      ? "border-primary text-primary bg-white dark:bg-zinc-950"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Sliders className="w-4 h-4" /> 2. Plan de Acción ({selectedNc.corrective_actions.length})
                </button>
                <button
                  onClick={() => setActiveTab("cierre")}
                  className={`flex-1 py-3 text-xs font-bold tracking-wider uppercase border-b-2 text-center transition flex items-center justify-center gap-1.5 ${
                    activeTab === "cierre"
                      ? "border-primary text-primary bg-white dark:bg-zinc-950"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <CheckSquare className="w-4 h-4" /> 3. Verificación & Cierre
                </button>
              </div>

              {/* Tab Contents */}
              <div className="p-6 flex-1 overflow-y-auto">
                
                {/* TAB 1: CAUSE ANALYSIS (5 WHYS & ISHIKAWA) */}
                {activeTab === "analisis" && (
                  <div className="space-y-6">
                    
                    {/* Toggle Buttons */}
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <h4 className="text-sm font-bold text-foreground">
                        Metodología de Análisis
                      </h4>
                      <div className="flex bg-muted p-1 rounded-lg border border-border">
                        <button
                          type="button"
                          onClick={() => setAnalysisType("5whys")}
                          className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                            analysisType === "5whys"
                              ? "bg-white dark:bg-zinc-950 text-primary shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          5 Porqués
                        </button>
                        <button
                          type="button"
                          onClick={() => setAnalysisType("ishikawa")}
                          className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                            analysisType === "ishikawa"
                              ? "bg-white dark:bg-zinc-950 text-primary shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          Ishikawa (6 Ms)
                        </button>
                      </div>
                    </div>

                    {/* Render 5 WHYS METHODOLOGY */}
                    {analysisType === "5whys" && (
                      <div className="space-y-4">
                        <div className="bg-amber-500/10 text-amber-800 dark:text-amber-300 p-4 rounded-xl border border-amber-500/20 text-xs flex gap-2">
                          <HelpCircle className="w-5 h-5 text-amber-500 shrink-0" />
                          <p className="leading-relaxed">
                            <strong>Metodología de los 5 Porqués:</strong> Pregúntate repetidamente &quot;¿por qué?&quot; para descender desde el síntoma directo hasta la falla sistémica o causa raíz real que originó la desviación.
                          </p>
                        </div>

                        <div className="space-y-3 max-w-2xl mx-auto">
                          {whys.map((why, index) => {
                            // Show each input only if the previous one has content
                            if (index > 0 && whys[index - 1].trim() === "") return null;
                            return (
                              <div key={index} className="flex gap-3 items-center animate-fade-in">
                                <span className="w-12 text-right text-xs font-bold text-muted-foreground uppercase tracking-widest shrink-0">
                                  ¿Por qué {index + 1}?
                                </span>
                                <div className="flex-1 relative">
                                  <input
                                    type="text"
                                    value={why}
                                    onChange={(e) => {
                                      const updated = [...whys];
                                      updated[index] = e.target.value;
                                      setWhys(updated);
                                    }}
                                    placeholder={
                                      index === 0
                                        ? "Falla inmediata directa..."
                                        : index === 4
                                        ? "Falla sistémica o de control raíz..."
                                        : "Causa del nivel anterior..."
                                    }
                                    className="w-full px-4 py-2 border border-input rounded-xl text-xs bg-muted/20 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Render ISHIKAWA DIAGRAM CANVAS */}
                    {analysisType === "ishikawa" && (
                      <div className="space-y-6">
                        <div className="bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 p-4 rounded-xl border border-emerald-500/20 text-xs flex gap-2">
                          <Info className="w-5 h-5 text-emerald-600 shrink-0" />
                          <p className="leading-relaxed">
                            <strong>Diagrama de Ishikawa (Espina de Pescado):</strong> Clasifica las causas potenciales en las 6 dimensiones tradicionales de producción y servicio. Haz clic en las etiquetas del diagrama o en la lista inferior para ingresar causas.
                          </p>
                        </div>

                        {/* Interactive SVG Fishbone Diagram */}
                        <div className="bg-slate-50 dark:bg-zinc-900 p-4 rounded-xl border border-border overflow-x-auto">
                          <svg
                            viewBox="0 0 700 360"
                            className="w-full min-w-[600px] h-[300px] select-none text-foreground"
                          >
                            {/* Central Spine */}
                            <line
                              x1="40"
                              y1="180"
                              x2="590"
                              y2="180"
                              stroke="currentColor"
                              strokeWidth="4"
                              strokeDasharray="none"
                            />
                            
                            {/* Fish Tail */}
                            <path
                              d="M 20 130 L 40 180 L 20 230 Z"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                            />

                            {/* Fish Head Polygon */}
                            <path
                              d="M 590 180 L 660 130 Q 690 180 660 230 Z"
                              fill="currentColor"
                              className="text-primary/10"
                              stroke="currentColor"
                              strokeWidth="3"
                            />
                            <text
                              x="640"
                              y="185"
                              textAnchor="middle"
                              className="text-[9px] font-extrabold tracking-wider fill-primary"
                            >
                              PROBLEMA
                            </text>

                            {/* Top 3 bones (Método, Máquina, Material) */}
                            {/* Método bone */}
                            <line
                              x1="180"
                              y1="180"
                              x2="130"
                              y2="50"
                              stroke={selectedIshikawaCategory === "metodo" ? "#003F87" : "currentColor"}
                              strokeWidth={selectedIshikawaCategory === "metodo" ? "3" : "2"}
                              className="cursor-pointer hover:stroke-primary transition-all"
                              onClick={() => setSelectedIshikawaCategory("metodo")}
                            />
                            
                            {/* Máquina bone */}
                            <line
                              x1="340"
                              y1="180"
                              x2="290"
                              y2="50"
                              stroke={selectedIshikawaCategory === "maquina" ? "#003F87" : "currentColor"}
                              strokeWidth={selectedIshikawaCategory === "maquina" ? "3" : "2"}
                              className="cursor-pointer hover:stroke-primary transition-all"
                              onClick={() => setSelectedIshikawaCategory("maquina")}
                            />

                            {/* Material bone */}
                            <line
                              x1="500"
                              y1="180"
                              x2="450"
                              y2="50"
                              stroke={selectedIshikawaCategory === "material" ? "#003F87" : "currentColor"}
                              strokeWidth={selectedIshikawaCategory === "material" ? "3" : "2"}
                              className="cursor-pointer hover:stroke-primary transition-all"
                              onClick={() => setSelectedIshikawaCategory("material")}
                            />

                            {/* Bottom 3 bones (Mano de Obra, Medición, Medio Ambiente) */}
                            {/* Mano de Obra bone */}
                            <line
                              x1="180"
                              y1="180"
                              x2="130"
                              y2="310"
                              stroke={selectedIshikawaCategory === "manoObra" ? "#003F87" : "currentColor"}
                              strokeWidth={selectedIshikawaCategory === "manoObra" ? "3" : "2"}
                              className="cursor-pointer hover:stroke-primary transition-all"
                              onClick={() => setSelectedIshikawaCategory("manoObra")}
                            />

                            {/* Medición bone */}
                            <line
                              x1="340"
                              y1="180"
                              x2="290"
                              y2="310"
                              stroke={selectedIshikawaCategory === "medicion" ? "#003F87" : "currentColor"}
                              strokeWidth={selectedIshikawaCategory === "medicion" ? "3" : "2"}
                              className="cursor-pointer hover:stroke-primary transition-all"
                              onClick={() => setSelectedIshikawaCategory("medicion")}
                            />

                            {/* Medio Ambiente bone */}
                            <line
                              x1="500"
                              y1="180"
                              x2="450"
                              y2="310"
                              stroke={selectedIshikawaCategory === "medioAmbiente" ? "#003F87" : "currentColor"}
                              strokeWidth={selectedIshikawaCategory === "medioAmbiente" ? "3" : "2"}
                              className="cursor-pointer hover:stroke-primary transition-all"
                              onClick={() => setSelectedIshikawaCategory("medioAmbiente")}
                            />

                            {/* TEXT LABELS */}
                            {/* Top Category Labels */}
                            <text
                              x="130"
                              y="35"
                              textAnchor="middle"
                              className={`text-[10px] font-bold cursor-pointer transition-colors ${
                                selectedIshikawaCategory === "metodo" ? "fill-primary font-black" : "fill-muted-foreground hover:fill-foreground"
                              }`}
                              onClick={() => setSelectedIshikawaCategory("metodo")}
                            >
                              Método ({ishikawaData.metodo.length})
                            </text>
                            <text
                              x="290"
                              y="35"
                              textAnchor="middle"
                              className={`text-[10px] font-bold cursor-pointer transition-colors ${
                                selectedIshikawaCategory === "maquina" ? "fill-primary font-black" : "fill-muted-foreground hover:fill-foreground"
                              }`}
                              onClick={() => setSelectedIshikawaCategory("maquina")}
                            >
                              Máquina ({ishikawaData.maquina.length})
                            </text>
                            <text
                              x="450"
                              y="35"
                              textAnchor="middle"
                              className={`text-[10px] font-bold cursor-pointer transition-colors ${
                                selectedIshikawaCategory === "material" ? "fill-primary font-black" : "fill-muted-foreground hover:fill-foreground"
                              }`}
                              onClick={() => setSelectedIshikawaCategory("material")}
                            >
                              Material ({ishikawaData.material.length})
                            </text>

                            {/* Bottom Category Labels */}
                            <text
                              x="130"
                              y="330"
                              textAnchor="middle"
                              className={`text-[10px] font-bold cursor-pointer transition-colors ${
                                selectedIshikawaCategory === "manoObra" ? "fill-primary font-black" : "fill-muted-foreground hover:fill-foreground"
                              }`}
                              onClick={() => setSelectedIshikawaCategory("manoObra")}
                            >
                              Mano de Obra ({ishikawaData.manoObra.length})
                            </text>
                            <text
                              x="290"
                              y="330"
                              textAnchor="middle"
                              className={`text-[10px] font-bold cursor-pointer transition-colors ${
                                selectedIshikawaCategory === "medicion" ? "fill-primary font-black" : "fill-muted-foreground hover:fill-foreground"
                              }`}
                              onClick={() => setSelectedIshikawaCategory("medicion")}
                            >
                              Medición ({ishikawaData.medicion.length})
                            </text>
                            <text
                              x="450"
                              y="330"
                              textAnchor="middle"
                              className={`text-[10px] font-bold cursor-pointer transition-colors ${
                                selectedIshikawaCategory === "medioAmbiente" ? "fill-primary font-black" : "fill-muted-foreground hover:fill-foreground"
                              }`}
                              onClick={() => setSelectedIshikawaCategory("medioAmbiente")}
                            >
                              Medio Ambiente ({ishikawaData.medioAmbiente.length})
                            </text>

                            {/* Render up to 2 causes directly on the skeleton for visuals */}
                            {ishikawaData.metodo.slice(0, 2).map((c, i) => (
                              <text key={i} x="110" y={80 + i * 20} className="text-[8px] fill-primary italic font-medium">{c}</text>
                            ))}
                            {ishikawaData.maquina.slice(0, 2).map((c, i) => (
                              <text key={i} x="270" y={80 + i * 20} className="text-[8px] fill-primary italic font-medium">{c}</text>
                            ))}
                            {ishikawaData.material.slice(0, 2).map((c, i) => (
                              <text key={i} x="430" y={80 + i * 20} className="text-[8px] fill-primary italic font-medium">{c}</text>
                            ))}
                            {ishikawaData.manoObra.slice(0, 2).map((c, i) => (
                              <text key={i} x="110" y={230 + i * 20} className="text-[8px] fill-primary italic font-medium">{c}</text>
                            ))}
                            {ishikawaData.medicion.slice(0, 2).map((c, i) => (
                              <text key={i} x="270" y={230 + i * 20} className="text-[8px] fill-primary italic font-medium">{c}</text>
                            ))}
                            {ishikawaData.medioAmbiente.slice(0, 2).map((c, i) => (
                              <text key={i} x="430" y={230 + i * 20} className="text-[8px] fill-primary italic font-medium">{c}</text>
                            ))}
                          </svg>
                        </div>

                        {/* Interactive inputs to feed Ishikawa category */}
                        <div className="bg-white dark:bg-zinc-900 border border-border p-5 rounded-xl space-y-4 shadow-sm">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
                            <div className="space-y-1">
                              <span className="text-[9px] font-extrabold uppercase tracking-widest text-secondary block">
                                Categoria Seleccionada
                              </span>
                              <h5 className="font-bold text-sm text-primary">
                                {ishikawaCategories.find(c => c.key === selectedIshikawaCategory)?.label}
                              </h5>
                              <p className="text-[10px] text-muted-foreground">
                                {ishikawaCategories.find(c => c.key === selectedIshikawaCategory)?.desc}
                              </p>
                            </div>
                            
                            {/* Input to add cause */}
                            <div className="flex gap-2 items-center sm:max-w-xs w-full">
                              <input
                                type="text"
                                value={newCauseText}
                                onChange={(e) => setNewCauseText(e.target.value)}
                                placeholder="Escribe una causa potencial..."
                                className="w-full px-3 py-1.5 border border-input rounded-lg text-xs bg-muted/20 focus:outline-none"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleAddIshikawaCause();
                                  }
                                }}
                              />
                              <button
                                type="button"
                                onClick={handleAddIshikawaCause}
                                className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90 shadow-sm transition"
                              >
                                Agregar
                              </button>
                            </div>
                          </div>

                          {/* List of Causes for selected Category */}
                          <div className="space-y-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                              Causas potenciales cargadas ({ishikawaData[selectedIshikawaCategory].length}):
                            </span>
                            {ishikawaData[selectedIshikawaCategory].length === 0 ? (
                              <p className="text-xs text-muted-foreground italic py-1 pl-1">
                                No se han registrado causas bajo esta categoría. Usa el casillero de arriba para agregarlas.
                              </p>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {ishikawaData[selectedIshikawaCategory].map((cause, index) => (
                                  <div
                                    key={index}
                                    className="bg-muted border border-border rounded-lg pl-3 pr-2 py-1 flex items-center gap-1.5 text-xs animate-fade-in"
                                  >
                                    <span className="font-medium">{cause}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveIshikawaCause(selectedIshikawaCategory, index)}
                                      className="text-red-500 hover:text-red-700 font-bold ml-1 rounded hover:bg-red-50 dark:hover:bg-red-950/20 px-1 text-[11px]"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                      </div>
                    )}

                    {/* Common Save Analysis Button */}
                    {selectedNc.estado === "abierta" && (
                      <div className="border-t border-border pt-4 flex justify-end">
                        <button
                          type="button"
                          onClick={handleSaveAnalysis}
                          className="py-2 px-5 bg-secondary text-white font-bold rounded-lg text-xs hover:opacity-95 shadow transition"
                        >
                          Guardar Análisis de Causa Raíz (Fijar Estado &quot;Analizada&quot;)
                        </button>
                      </div>
                    )}

                  </div>
                )}

                {/* TAB 2: CORRECTIVE ACTIONS (PLAN DE ACCIÓN) */}
                {activeTab === "acciones" && (
                  <div className="space-y-8">
                    
                    {/* Add action form */}
                    {selectedNc.estado !== "cerrada" && (
                      <div className="bg-slate-50 dark:bg-zinc-900 border border-border p-5 rounded-xl space-y-4">
                        <h4 className="text-xs font-extrabold uppercase tracking-widest text-primary flex items-center gap-1">
                          <Activity className="w-4 h-4 text-secondary" /> Planificar Nueva Acción Correctiva
                        </h4>
                        
                        <form onSubmit={handleActionSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1 md:col-span-2">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                              Descripción Detallada de la Acción
                            </label>
                            <input
                              type="text"
                              required
                              value={actionDesc}
                              onChange={(e) => setActionDesc(e.target.value)}
                              placeholder="Ej: Modificar e incorporar la calibración del sensor en el plan de mantenimiento anual"
                              className="w-full px-3.5 py-2 border border-input rounded-lg text-xs bg-white dark:bg-zinc-950 focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                              Fecha Límite Planificada
                            </label>
                            <input
                              type="date"
                              required
                              value={targetDate}
                              onChange={(e) => setTargetDate(e.target.value)}
                              className="w-full px-3.5 py-2 border border-input rounded-lg text-xs bg-white dark:bg-zinc-950 focus:outline-none"
                            />
                          </div>

                          <div className="md:col-span-2 flex justify-end pt-2">
                            <button
                              type="submit"
                              disabled={submittingAction || !actionDesc.trim() || !targetDate}
                              className="py-2 px-5 bg-secondary text-white font-bold rounded-lg text-xs hover:opacity-95 shadow transition disabled:opacity-50"
                            >
                              {submittingAction ? "Agendando..." : "Asignar Acción Correctiva"}
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    {/* Action list */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
                        Cronograma de Mitigación y Ejecución CAPA
                      </h4>

                      {selectedNc.corrective_actions.length === 0 ? (
                        <div className="p-8 text-center text-xs text-muted-foreground bg-muted/20 border-2 border-dashed border-border rounded-xl">
                          No se han programado acciones correctivas para esta desviación todavía.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {selectedNc.corrective_actions.map((act) => {
                            const isImplemented = !!act.fecha_implementacion;
                            return (
                              <div
                                key={act.id}
                                className={`border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                                  isImplemented
                                    ? "bg-green-50/20 border-green-500/30"
                                    : "bg-white dark:bg-zinc-900 border-border shadow-sm"
                                }`}
                              >
                                <div className="space-y-2 flex-1">
                                  <div className="flex items-center gap-2">
                                    {isImplemented ? (
                                      <span className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <Check className="w-3 h-3 text-green-600" /> Implementada
                                      </span>
                                    ) : (
                                      <span className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                                        <Clock className="w-3 h-3 text-amber-600" /> Pendiente Ejecución
                                      </span>
                                    )}
                                  </div>
                                  
                                  <h5 className="font-bold text-xs leading-normal">{act.descripcion}</h5>
                                  
                                  {act.analisis_causa_raiz && (
                                    <p className="text-[10px] text-muted-foreground leading-normal bg-muted/50 p-2 rounded border border-border max-w-xl">
                                      {act.analisis_causa_raiz}
                                    </p>
                                  )}

                                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground flex-wrap">
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-3.5 h-3.5" />
                                      Planificada: {new Date(act.fecha_planificada).toLocaleDateString()}
                                    </span>
                                    {isImplemented && (
                                      <span className="flex items-center gap-1 text-green-600 font-medium">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        Completada: {new Date(act.fecha_implementacion!).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Quick action completion triggers */}
                                {!isImplemented && selectedNc.estado !== "cerrada" && (
                                  <button
                                    type="button"
                                    onClick={() => handleImplementAction(act.id)}
                                    className="py-1.5 px-3 border border-green-500 text-green-600 font-bold rounded-lg text-[10px] hover:bg-green-500 hover:text-white transition flex items-center gap-1 shadow-sm shrink-0"
                                  >
                                    <Check className="w-3.5 h-3.5" /> Marcar Ejecutada
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                  </div>
                )}

                {/* TAB 3: CLOSURE & VERIFICATION */}
                {activeTab === "cierre" && (
                  <div className="space-y-6">
                    
                    <div className="border-b border-border pb-4">
                      <h4 className="text-sm font-bold text-foreground">
                        Verificación de Eficacia (Cierre Formal)
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        De acuerdo con la norma ISO 9001 (10.2.1.d), se debe verificar la eficacia de cualquier acción correctiva tomada antes de dar por cerrado un hallazgo. Esto asegura que la causa raíz haya sido mitigada y no haya reincidencias de la desviación.
                      </p>
                    </div>

                    {/* Pre-closing Verification Indicators */}
                    <div className="space-y-3 bg-muted/20 p-5 rounded-xl border border-border max-w-xl">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                        Requisitos de Cierre:
                      </h5>
                      
                      {/* Check 1: Causa Raíz cargada */}
                      <div className="flex items-center gap-2 text-xs">
                        {selectedNc.five_whys || selectedNc.ishikawa ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                        )}
                        <span className={selectedNc.five_whys || selectedNc.ishikawa ? "text-foreground" : "text-muted-foreground"}>
                          Análisis de Causa Raíz cargado y archivado.
                        </span>
                      </div>

                      {/* Check 2: Al menos una acción correctiva programada */}
                      <div className="flex items-center gap-2 text-xs">
                        {selectedNc.corrective_actions.length > 0 ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                        )}
                        <span className={selectedNc.corrective_actions.length > 0 ? "text-foreground" : "text-muted-foreground"}>
                          Al menos una Acción Correctiva programada en el plan de mitigación.
                        </span>
                      </div>

                      {/* Check 3: Todas las acciones ejecutadas */}
                      <div className="flex items-center gap-2 text-xs">
                        {selectedNc.corrective_actions.length > 0 && selectedNc.corrective_actions.every(a => a.fecha_implementacion) ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                        )}
                        <span className={selectedNc.corrective_actions.length > 0 && selectedNc.corrective_actions.every(a => a.fecha_implementacion) ? "text-foreground" : "text-muted-foreground"}>
                          Todas las Acciones Correctivas programadas figuran como <strong>Implementadas</strong>.
                        </span>
                      </div>
                    </div>

                    {/* Cierre Formal Panel */}
                    {selectedNc.estado === "cerrada" ? (
                      <div className="bg-green-50/30 border border-green-500/30 p-5 rounded-xl space-y-4 max-w-xl">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-6 h-6 text-green-600" />
                          <h5 className="font-bold text-sm text-green-800 dark:text-green-300">
                            Hallazgo Cerrado con Éxito
                          </h5>
                        </div>
                        <div className="space-y-2 text-xs leading-relaxed text-muted-foreground">
                          <p>
                            <strong>Fecha de Cierre:</strong> {new Date(selectedNc.fecha_cierre!).toLocaleString()}
                          </p>
                          <div className="bg-white dark:bg-zinc-900 border border-border p-3 rounded-lg">
                            <span className="font-bold block uppercase tracking-wider text-[9px] mb-1">Evidencia / Comentarios de Verificación:</span>
                            {selectedNc.cierre_comentarios}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleCloseNC} className="space-y-4 max-w-xl pt-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                            Reporte de Verificación de Eficacia (Comentarios de Cierre)
                          </label>
                          <textarea
                            rows={3}
                            required
                            value={closeComments}
                            onChange={(e) => setCloseComments(e.target.value)}
                            placeholder="Describa brevemente cómo se comprobó la eficacia (Ej: Se revisó la calibración y el sensor arrojó lecturas dentro del rango óptimo, sin registrar anomalías en los últimos 3 meses)..."
                            className="w-full px-3.5 py-2 border border-input rounded-xl text-xs bg-muted/20 focus:outline-none"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={
                            submittingClose ||
                            !closeComments.trim() ||
                            selectedNc.corrective_actions.length === 0 ||
                            !selectedNc.corrective_actions.every(a => a.fecha_implementacion)
                          }
                          className="py-2.5 px-5 bg-green-600 text-white font-bold rounded-lg text-xs hover:bg-green-700 shadow transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                        >
                          <CheckSquare className="w-4 h-4" />
                          {submittingClose ? "Verificando..." : "Verificar Eficacia y Cerrar No Conformidad"}
                        </button>

                        {(selectedNc.corrective_actions.length === 0 || !selectedNc.corrective_actions.every(a => a.fecha_implementacion)) && (
                          <p className="text-[10px] text-red-500 font-medium leading-relaxed bg-red-50 dark:bg-red-950/20 p-2.5 rounded-lg border border-red-500/10">
                            * El botón de cierre permanecerá desactivado hasta que se cumplan al 100% todos los requisitos de cierre e implementación de acciones correctivas programadas.
                          </p>
                        )}
                      </form>
                    )}

                  </div>
                )}

              </div>

            </div>
          ) : (
            <div className="bg-muted/10 border-2 border-dashed border-border rounded-xl p-12 text-center text-xs text-muted-foreground min-h-[400px] flex flex-col justify-center items-center gap-3">
              <FolderOpen className="w-12 h-12 text-muted-foreground/30 animate-bounce" />
              <h4 className="font-bold text-sm text-foreground">Libro de Desviaciones CAPA</h4>
              <p className="max-w-md leading-relaxed">
                Selecciona una No Conformidad en la lista lateral para cargar su consola de operaciones, programar su análisis causa raíz interactivo o verificar y cerrar el hallazgo formalmente.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
