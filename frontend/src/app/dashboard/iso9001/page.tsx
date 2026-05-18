"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { AlertOctagon, Plus, Calendar, Tag, ShieldAlert, ArrowRight, CheckCircle2, ChevronRight, HelpCircle, Activity } from "lucide-react";

interface CorrectiveActionItem {
  id: string;
  descripcion: string;
  analisis_causa_raiz?: string;
  fecha_planificada: string;
  fecha_implementacion?: string;
}

interface NonConformityItem {
  id: string;
  title: string;
  description: string;
  origin: string;
  estado: string;
  fecha_deteccion: string;
  corrective_actions: CorrectiveActionItem[];
}

export default function ISO9001Page() {
  const { data: session } = useSession();
  const [ncs, setNcs] = useState<NonConformityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // NC Creation Form
  const [ncTitle, setNcTitle] = useState("");
  const [ncDesc, setNcDesc] = useState("");
  const [ncOrigin, setNcOrigin] = useState("interno");
  const [submittingNC, setSubmittingNC] = useState(false);

  // Selected NC for analysis/action planning
  const [selectedNc, setSelectedNc] = useState<NonConformityItem | null>(null);

  // Corrective Action Form
  const [actionDesc, setActionDesc] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  // 5 Whys State variables
  const [why1, setWhy1] = useState("");
  const [why2, setWhy2] = useState("");
  const [why3, setWhy3] = useState("");
  const [why4, setWhy4] = useState("");
  const [why5, setWhy5] = useState("");

  const fetchNonConformities = async () => {
    try {
      if (!session?.user) return;
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/iso9001/non-conformities`, {
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
        if (updated) setSelectedNc(updated);
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

  const handleNCCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ncTitle.trim() || !ncDesc.trim()) return;

    try {
      setSubmittingNC(true);
      setError(null);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/iso9001/non-conformities`, {
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

      // Reset
      setNcTitle("");
      setNcDesc("");
      setNcOrigin("interno");

      await fetchNonConformities();
    } catch (err: any) {
      setError(err.message || "Error al crear No Conformidad");
    } finally {
      setSubmittingNC(false);
    }
  };

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNc || !actionDesc.trim() || !targetDate) return;

    try {
      setSubmittingAction(true);
      setError(null);

      // Construct a single causa_raiz string using the 5 Whys entered by the user
      const fullCausaRaiz = [why1, why2, why3, why4, why5]
        .filter((w) => w.trim() !== "")
        .map((w, index) => `Por qué ${index + 1}: ${w}`)
        .join(" -> ");

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/iso9001/corrective-actions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any).accessToken}`,
        },
        body: JSON.stringify({
          non_conformity_id: selectedNc.id,
          descripcion: actionDesc,
          analisis_causa_raiz: fullCausaRaiz || "Pendiente de análisis",
          fecha_planificada: new Date(targetDate).toISOString(),
        }),
      });

      if (!res.ok) {
        throw new Error("No se pudo agendar la acción correctiva.");
      }

      // Reset forms
      setActionDesc("");
      setTargetDate("");
      setWhy1("");
      setWhy2("");
      setWhy3("");
      setWhy4("");
      setWhy5("");

      await fetchNonConformities();
    } catch (err: any) {
      setError(err.message || "Error al registrar plan de acción");
    } finally {
      setSubmittingAction(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "cerrada":
        return (
          <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full dark:bg-green-900/30 dark:text-green-300">
            Cerrada
          </span>
        );
      case "analizada":
        return (
          <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full dark:bg-blue-900/30 dark:text-blue-300">
            Analizada / Planificada
          </span>
        );
      default:
        return (
          <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded-full dark:bg-red-900/30 dark:text-red-300 animate-pulse">
            Abierta
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-heading">No Conformidades & Acciones Correctivas</h1>
        <p className="text-sm text-muted-foreground">
          Cumplimiento ISO 9001. Registra hallazgos, realiza análisis causa raíz con los 5 Porqués y planifica acciones de mejora continua.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 p-4 rounded-r-lg text-sm text-red-800 dark:text-red-300">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Main Grid split */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Left Column (NC Declaration + List) */}
        <div className="xl:col-span-7 space-y-8">
          
          {/* Declaration form card */}
          <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-border shadow-sm space-y-4">
            <h3 className="font-semibold text-base flex items-center gap-2 border-b border-border pb-3">
              <Plus className="w-5 h-5 text-secondary" /> Declarar Desviación (No Conformidad)
            </h3>
            
            <form onSubmit={handleNCCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                  Hallazgo / Título Corto
                </label>
                <input
                  type="text"
                  required
                  value={ncTitle}
                  onChange={(e) => setNcTitle(e.target.value)}
                  placeholder="Ej: Falla en frecuencia de calibración del sensor CO2"
                  className="w-full px-3.5 py-2 border border-input rounded-lg text-sm bg-muted/20 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                  Origen del Hallazgo
                </label>
                <select
                  value={ncOrigin}
                  onChange={(e) => setNcOrigin(e.target.value)}
                  className="w-full px-3.5 py-2 border border-input rounded-lg text-sm bg-muted/20 focus:outline-none"
                >
                  <option value="auditoria">Auditoría Externa</option>
                  <option value="interno">Auditoría Interna</option>
                  <option value="externo">Reclamo de Cliente / Externo</option>
                </select>
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                  Descripción Detallada de la Evidencia
                </label>
                <textarea
                  rows={3}
                  required
                  value={ncDesc}
                  onChange={(e) => setNcDesc(e.target.value)}
                  placeholder="Se detectó que el instrumento de medición de emisiones no posee etiqueta de calibración anual..."
                  className="w-full px-3.5 py-2 border border-input rounded-lg text-sm bg-muted/20 focus:outline-none"
                />
              </div>

              <div className="md:col-span-2 pt-2">
                <button
                  type="submit"
                  disabled={submittingNC}
                  className="py-2.5 px-4 bg-primary text-white font-semibold rounded-lg text-xs hover:opacity-95 shadow transition disabled:opacity-50"
                >
                  {submittingNC ? "Procesando..." : "Registrar Hallazgo en el Libro ISO"}
                </button>
              </div>
            </form>
          </div>

          {/* List panel */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-muted-foreground flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" /> Libro de Registro de No Conformidades
            </h3>

            {loading ? (
              <div className="p-8 text-center text-xs text-muted-foreground bg-white dark:bg-zinc-950 border border-border rounded-xl shadow-sm">
                Buscando hallazgos...
              </div>
            ) : ncs.length === 0 ? (
              <div className="p-12 text-center text-xs text-muted-foreground bg-white dark:bg-zinc-950 border border-border rounded-xl shadow-sm space-y-2">
                <CheckCircle2 className="w-8 h-8 text-secondary mx-auto" />
                <p className="font-semibold text-sm">Libro de Desviaciones Limpio</p>
                <p>No se registran hallazgos ni desviaciones abiertas en este tenant.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {ncs.map((nc) => {
                  const isSelected = selectedNc?.id === nc.id;
                  return (
                    <div
                      key={nc.id}
                      onClick={() => setSelectedNc(nc)}
                      className={`bg-white dark:bg-zinc-950 border rounded-xl p-5 shadow-sm hover:shadow-md cursor-pointer transition flex items-start justify-between gap-4 ${
                        isSelected ? "border-secondary ring-2 ring-secondary/20" : "border-border"
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getStatusBadge(nc.estado)}
                          <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full capitalize">
                            {nc.origin}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm leading-snug">{nc.title}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-2">{nc.description}</p>
                        
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground pt-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Detección: {new Date(nc.fecha_deteccion).toLocaleDateString()}</span>
                          <span className="mx-2">•</span>
                          <span>Planes correctivos agendados: {nc.corrective_actions.length}</span>
                        </div>
                      </div>

                      <ChevronRight className={`w-5 h-5 text-muted-foreground self-center transition-transform ${isSelected ? "translate-x-1 text-secondary" : ""}`} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Right Column (5 Whys Analysis & Corrective Actions) */}
        <div className="xl:col-span-5">
          {selectedNc ? (
            <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-border shadow-sm space-y-6 h-fit animate-fade-in">
              <div className="border-b border-border pb-4">
                <span className="text-[10px] font-bold text-secondary uppercase tracking-wider block mb-1">
                  Desviación Seleccionada
                </span>
                <h3 className="font-bold text-base leading-snug">{selectedNc.title}</h3>
                <p className="text-xs text-muted-foreground mt-2 bg-muted/40 p-3 rounded-lg border border-border">
                  {selectedNc.description}
                </p>
              </div>

              {/* Corrective actions history */}
              {selectedNc.corrective_actions.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Planes de Acción Establecidos
                  </h4>
                  <div className="space-y-3">
                    {selectedNc.corrective_actions.map((act) => (
                      <div key={act.id} className="p-3 bg-muted/20 border border-border rounded-lg space-y-2 text-xs">
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-semibold text-surface-foreground leading-normal">
                            {act.descripcion}
                          </span>
                        </div>
                        {act.analisis_causa_raiz && (
                          <div className="text-[10px] text-muted-foreground bg-muted/50 p-2 rounded border border-border leading-relaxed">
                            <span className="font-bold block uppercase tracking-wider text-[9px] mb-1">Análisis de Causa Raíz:</span>
                            {act.analisis_causa_raiz}
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Límite de ejecución: {new Date(act.fecha_planificada).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Planning Form (incorporating 5 Whys) */}
              <form onSubmit={handleActionSubmit} className="space-y-4 pt-4 border-t border-border mt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-secondary" /> Planificar Acción Correctiva
                </h4>

                {/* 5 Whys section */}
                <div className="bg-muted/30 p-4 rounded-xl border border-border space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground mb-1">
                    <HelpCircle className="w-4 h-4 text-primary" /> Metodología de los 5 Porqués
                  </div>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex gap-2 items-center">
                      <span className="font-bold text-muted-foreground w-6 text-right">¿1?</span>
                      <input
                        type="text"
                        value={why1}
                        onChange={(e) => setWhy1(e.target.value)}
                        placeholder="¿Por qué ocurrió la falla directa?"
                        className="flex-1 px-3 py-1.5 border border-input rounded-lg bg-white"
                      />
                    </div>
                    {why1.trim() !== "" && (
                      <div className="flex gap-2 items-center">
                        <span className="font-bold text-muted-foreground w-6 text-right">¿2?</span>
                        <input
                          type="text"
                          value={why2}
                          onChange={(e) => setWhy2(e.target.value)}
                          placeholder="¿Por qué sucedió la causa anterior?"
                          className="flex-1 px-3 py-1.5 border border-input rounded-lg bg-white animate-fade-in"
                        />
                      </div>
                    )}
                    {why2.trim() !== "" && (
                      <div className="flex gap-2 items-center">
                        <span className="font-bold text-muted-foreground w-6 text-right">¿3?</span>
                        <input
                          type="text"
                          value={why3}
                          onChange={(e) => setWhy3(e.target.value)}
                          placeholder="¿Por qué sucedió esa causa?"
                          className="flex-1 px-3 py-1.5 border border-input rounded-lg bg-white animate-fade-in"
                        />
                      </div>
                    )}
                    {why3.trim() !== "" && (
                      <div className="flex gap-2 items-center">
                        <span className="font-bold text-muted-foreground w-6 text-right">¿4?</span>
                        <input
                          type="text"
                          value={why4}
                          onChange={(e) => setWhy4(e.target.value)}
                          placeholder="¿Por qué llegamos a este punto?"
                          className="flex-1 px-3 py-1.5 border border-input rounded-lg bg-white animate-fade-in"
                        />
                      </div>
                    )}
                    {why4.trim() !== "" && (
                      <div className="flex gap-2 items-center">
                        <span className="font-bold text-muted-foreground w-6 text-right">¿5?</span>
                        <input
                          type="text"
                          value={why5}
                          onChange={(e) => setWhy5(e.target.value)}
                          placeholder="¿Por qué se omitió el control raíz?"
                          className="flex-1 px-3 py-1.5 border border-input rounded-lg bg-white animate-fade-in"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Plan detail fields */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                    Descripción de la Acción Correctiva
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={actionDesc}
                    onChange={(e) => setActionDesc(e.target.value)}
                    placeholder="Ej: Modificar e incorporar la calibración del sensor en el plan de mantenimiento anual..."
                    className="w-full px-3.5 py-2 border border-input rounded-lg text-sm bg-muted/20 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                    Fecha Objetivo de Implementación
                  </label>
                  <input
                    type="date"
                    required
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-3.5 py-2 border border-input rounded-lg text-sm bg-muted/20 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingAction || !actionDesc.trim() || !targetDate}
                  className="w-full py-2 px-4 bg-secondary text-white font-bold rounded-lg text-xs hover:opacity-95 shadow transition disabled:opacity-50"
                >
                  {submittingAction ? "Agendando..." : "Asignar Acción Correctiva & Cerrar Análisis"}
                </button>
              </form>

            </div>
          ) : (
            <div className="bg-muted/20 border-2 border-dashed border-border rounded-xl p-8 text-center text-xs text-muted-foreground h-48 flex flex-col justify-center items-center gap-2">
              <AlertOctagon className="w-8 h-8 text-muted-foreground/40" />
              <p className="font-semibold">Sin Desviación Seleccionada</p>
              <p>Selecciona una No Conformidad en la lista de la izquierda para planificar su análisis de causa raíz y acciones de mitigación.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
