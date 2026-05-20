"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { 
  ClipboardCheck, 
  Plus, 
  Check, 
  AlertTriangle, 
  X, 
  Info,
  Calendar,
  AlertCircle,
  TrendingUp,
  FileCheck2,
  FolderOpen
} from "lucide-react";

interface Diagnostico {
  id: string;
  nombre: string;
  normas_incluidas: string[];
  estado: string;
  fecha_inicio: string;
}

interface DiagnosticoItem {
  id: string;
  diagnostico_id: string;
  norma: string;
  clausula: string;
  clausula_descripcion: string;
  pregunta: string;
  estado: string | null;
  observacion: string | null;
  prioridad: string;
}

interface Summary {
  total_items: number;
  cumple: number;
  cumple_parcialmente: number;
  no_cumple: number;
  no_aplica: number;
  evaluados: number;
  porcentaje_cumplimiento: number;
  clasificacion: string;
  color: string;
}

export default function DiagnosticosPage() {
  const { data: session } = useSession();
  const [diagnosticos, setDiagnosticos] = useState<Diagnostico[]>([]);
  const [selectedDiagId, setSelectedDiagId] = useState<string | null>(null);
  const [selectedDiag, setSelectedDiag] = useState<Diagnostico | null>(null);
  const [items, setItems] = useState<DiagnosticoItem[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Modal for new diagnosis
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDiagName, setNewDiagName] = useState("");
  const [selectedNormas, setSelectedNormas] = useState<string[]>(["ISO 9001:2015"]);

  // Filter state
  const [activeNormaTab, setActiveNormaTab] = useState<string>("Todas");

  useEffect(() => {
    fetchDiagnosticos();
  }, [session]);

  useEffect(() => {
    if (selectedDiagId) {
      fetchDiagnosticoDetail(selectedDiagId);
    }
  }, [selectedDiagId]);

  const fetchDiagnosticos = async () => {
    try {
      if (!session?.user) return;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/diagnosticos`, {
        headers: {
          Authorization: `Bearer ${(session as any).accessToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setDiagnosticos(data);
        if (data.length > 0 && !selectedDiagId) {
          setSelectedDiagId(data[data.length - 1].id);
        } else if (data.length === 0) {
          setLoading(false);
        }
      }
    } catch (err) {
      console.error("Failed to load diagnosticos", err);
    }
  };

  const fetchDiagnosticoDetail = async (id: string) => {
    setLoading(true);
    try {
      const headers = {
        Authorization: `Bearer ${(session as any).accessToken}`,
      };
      
      // Fetch details
      const detailRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/diagnosticos/${id}`, { headers });
      const summaryRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/diagnosticos/${id}/resumen`, { headers });
      
      if (detailRes.ok && summaryRes.ok) {
        const detailData = await detailRes.json();
        const summaryData = await summaryRes.json();
        
        setSelectedDiag(detailData);
        setItems(detailData.items || []);
        setSummary(summaryData);
      }
    } catch (err) {
      console.error("Failed to load diagnosis detail", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDiagnostico = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDiagName || selectedNormas.length === 0) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/diagnosticos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any).accessToken}`,
        },
        body: JSON.stringify({
          nombre: newDiagName,
          normas_incluidas: selectedNormas,
        }),
      });

      if (res.ok) {
        const newDiag = await res.json();
        setDiagnosticos((prev) => [...prev, newDiag]);
        setSelectedDiagId(newDiag.id);
        setIsModalOpen(false);
        setNewDiagName("");
        setSelectedNormas(["ISO 9001:2015"]);
      }
    } catch (err) {
      console.error("Failed to create diagnosis", err);
    }
  };

  const handleUpdateItemState = async (itemId: string, newState: string) => {
    if (!selectedDiagId) return;

    // Optimistic UI update
    const previousItems = [...items];
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, estado: newState } : item))
    );

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/diagnosticos/${selectedDiagId}/items/${itemId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${(session as any).accessToken}`,
          },
          body: JSON.stringify({
            estado: newState,
          }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to update item");
      }

      // Re-trigger summary calculation
      const summaryRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/diagnosticos/${selectedDiagId}/resumen`,
        {
          headers: { Authorization: `Bearer ${(session as any).accessToken}` },
        }
      );
      if (summaryRes.ok) {
        setSummary(await summaryRes.json());
      }
    } catch (err) {
      console.error(err);
      // Rollback on error
      setItems(previousItems);
    }
  };

  const handleNormaCheckboxChange = (norma: string) => {
    setSelectedNormas((prev) =>
      prev.includes(norma) ? prev.filter((n) => n !== norma) : [...prev, norma]
    );
  };

  const filteredItems = items.filter(
    (item) => activeNormaTab === "Todas" || item.norma === activeNormaTab
  );

  return (
    <div className="space-y-8 animate-fade-in text-zinc-900 dark:text-zinc-50">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-heading flex items-center gap-2">
            <ClipboardCheck className="w-8 h-8 text-primary" />
            M01 · Diagnóstico & Análisis de Brechas
          </h1>
          <p className="text-muted-foreground text-sm">
            Evalúa el nivel de cumplimiento inicial de la organización frente a las normas ISO.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-semibold transition shadow-md hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Nuevo Diagnóstico
        </button>
      </div>

      {diagnosticos.length === 0 ? (
        <div className="bg-white dark:bg-zinc-950 border border-border rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4 shadow-sm">
          <FolderOpen className="w-16 h-16 text-muted-foreground/30 mx-auto" />
          <h3 className="text-lg font-bold">No hay diagnósticos iniciados</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Inicia un diagnóstico para evaluar el estado inicial de la organización frente a las normas ISO 9001:2015, ISO 14001:2015 o ISO 45001:2018.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition"
          >
            <Plus className="w-4 h-4" />
            Comenzar Evaluación
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar / Left list */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-zinc-950 border border-border rounded-xl p-4 shadow-sm space-y-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                Evaluaciones Realizadas
              </h3>
              <div className="space-y-1.5 max-h-[350px] overflow-y-auto pr-1">
                {diagnosticos.map((diag) => (
                  <button
                    key={diag.id}
                    onClick={() => setSelectedDiagId(diag.id)}
                    className={`w-full text-left p-3 rounded-lg border text-sm transition flex flex-col gap-1.5 ${
                      selectedDiagId === diag.id
                        ? "bg-primary/5 border-primary text-primary font-semibold"
                        : "border-border hover:bg-muted/10"
                    }`}
                  >
                    <span>{diag.nombre}</span>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-normal">
                      <span className="bg-muted px-1.5 py-0.5 rounded font-mono uppercase">
                        {diag.normas_incluidas.length} {diag.normas_incluidas.length === 1 ? "norma" : "normas"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(diag.fecha_inicio).toLocaleDateString()}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Compliance summary card */}
            {summary && (
              <div className="bg-white dark:bg-zinc-950 border border-border rounded-xl p-6 shadow-sm space-y-6">
                <div className="text-center space-y-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Nivel de Cumplimiento
                  </span>
                  <div className="text-5xl font-extrabold tracking-tight">
                    {summary.porcentaje_cumplimiento}%
                  </div>
                  
                  {/* Traffic Light State Label */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-xs uppercase ${
                      summary.color === "verde"
                        ? "text-green-700 bg-green-50 border border-green-200"
                        : summary.color === "amarillo"
                        ? "text-amber-700 bg-amber-50 border border-amber-200"
                        : "text-red-700 bg-red-50 border border-red-200"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        summary.color === "verde"
                          ? "bg-green-600"
                          : summary.color === "amarillo"
                          ? "bg-amber-600"
                          : "bg-red-600"
                      }`}
                    />
                    {summary.clasificacion}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      summary.color === "verde"
                        ? "bg-green-600"
                        : summary.color === "amarillo"
                        ? "bg-amber-500"
                        : "bg-red-600"
                    }`}
                    style={{ width: `${summary.porcentaje_cumplimiento}%` }}
                  />
                </div>

                {/* Distribution Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-green-50/50 dark:bg-green-950/10 rounded-lg border border-green-100 dark:border-green-900/30">
                    <span className="text-green-800 dark:text-green-400 font-medium block">Cumple</span>
                    <span className="text-lg font-bold block">{summary.cumple}</span>
                  </div>
                  <div className="p-3 bg-amber-50/50 dark:bg-amber-950/10 rounded-lg border border-amber-100 dark:border-amber-900/30">
                    <span className="text-amber-800 dark:text-amber-400 font-medium block">Parcial</span>
                    <span className="text-lg font-bold block">{summary.cumple_parcialmente}</span>
                  </div>
                  <div className="p-3 bg-red-50/50 dark:bg-red-950/10 rounded-lg border border-red-100 dark:border-red-900/30">
                    <span className="text-red-800 dark:text-red-400 font-medium block">No cumple</span>
                    <span className="text-lg font-bold block">{summary.no_cumple}</span>
                  </div>
                  <div className="p-3 bg-zinc-50/50 dark:bg-zinc-900/20 rounded-lg border border-zinc-200/50 dark:border-zinc-800">
                    <span className="text-muted-foreground font-medium block">No aplica</span>
                    <span className="text-lg font-bold block">{summary.no_aplica}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right main table / items evaluation */}
          <div className="lg:col-span-8 space-y-6">
            {loading ? (
              <div className="bg-white dark:bg-zinc-950 border border-border rounded-xl p-12 text-center shadow-sm">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                <span className="text-sm text-muted-foreground">Cargando evaluación...</span>
              </div>
            ) : (
              selectedDiag && (
                <div className="bg-white dark:bg-zinc-950 border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
                  {/* Detail Header Banner */}
                  <div className="p-6 border-b border-border bg-muted/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold">{selectedDiag.nombre}</h2>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                        {selectedDiag.normas_incluidas.map((norma) => (
                          <span key={norma} className="bg-primary/10 text-primary px-2 py-0.5 rounded font-semibold uppercase tracking-wider text-[9px]">
                            {norma}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Standard Tabs */}
                  <div className="flex border-b border-border px-6 overflow-x-auto gap-2 bg-muted/10">
                    {["Todas", ...selectedDiag.normas_incluidas].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveNormaTab(tab)}
                        className={`py-3 px-4 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
                          activeNormaTab === tab
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  {/* Questionnaire body */}
                  <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
                    {filteredItems.length === 0 ? (
                      <div className="p-12 text-center text-sm text-muted-foreground">
                        No hay preguntas asociadas a este filtro.
                      </div>
                    ) : (
                      filteredItems.map((item) => (
                        <div key={item.id} className="p-6 space-y-4 hover:bg-muted/5 transition">
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-primary uppercase bg-primary/10 px-1.5 py-0.5 rounded">
                                Cláusula {item.clausula} · {item.norma}
                              </span>
                              {item.clausula_descripcion && (
                                <span className="block text-xs font-semibold text-muted-foreground italic">
                                  {item.clausula_descripcion}
                                </span>
                              )}
                              <h4 className="text-sm font-medium leading-relaxed mt-1">
                                {item.pregunta}
                              </h4>
                            </div>
                          </div>

                          {/* Evaluation states selectors */}
                          <div className="flex flex-wrap gap-2 pt-2">
                            <button
                              onClick={() => handleUpdateItemState(item.id, "cumple")}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition shadow-sm ${
                                item.estado === "cumple"
                                  ? "text-green-700 bg-green-50 border-green-300 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/50"
                                  : "bg-surface border-border hover:bg-muted"
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" /> Cumple
                            </button>
                            <button
                              onClick={() => handleUpdateItemState(item.id, "cumple_parcialmente")}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition shadow-sm ${
                                item.estado === "cumple_parcialmente"
                                  ? "text-amber-700 bg-amber-50 border-amber-300 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50"
                                  : "bg-surface border-border hover:bg-muted"
                              }`}
                            >
                              <AlertTriangle className="w-3.5 h-3.5" /> Parcial
                            </button>
                            <button
                              onClick={() => handleUpdateItemState(item.id, "no_cumple")}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition shadow-sm ${
                                item.estado === "no_cumple"
                                  ? "text-red-700 bg-red-50 border-red-300 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/50"
                                  : "bg-surface border-border hover:bg-muted"
                              }`}
                            >
                              <AlertCircle className="w-3.5 h-3.5" /> No cumple
                            </button>
                            <button
                              onClick={() => handleUpdateItemState(item.id, "no_aplica")}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition shadow-sm ${
                                item.estado === "no_aplica"
                                  ? "text-zinc-700 bg-zinc-100 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300"
                                  : "bg-surface border-border hover:bg-muted"
                              }`}
                            >
                              <Info className="w-3.5 h-3.5" /> No aplica
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Modal for new evaluation */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-zinc-950 border border-border rounded-2xl shadow-2xl overflow-hidden animate-slide-in">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-md font-bold flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-primary" />
                Nuevo Diagnóstico Inicial (SGI)
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-muted rounded-full transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleCreateDiagnostico} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  Nombre de la Evaluación
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Diagnóstico Inicial 2026"
                  value={newDiagName}
                  onChange={(e) => setNewDiagName(e.target.value)}
                  className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase block">
                  Normas a Incluir
                </label>
                <div className="space-y-2">
                  {["ISO 9001:2015", "ISO 14001:2015", "ISO 45001:2018"].map((norma) => (
                    <label
                      key={norma}
                      className="flex items-center gap-3 p-3 bg-muted/20 hover:bg-muted/40 border border-border rounded-lg text-sm cursor-pointer transition"
                    >
                      <input
                        type="checkbox"
                        checked={selectedNormas.includes(norma)}
                        onChange={() => handleNormaCheckboxChange(norma)}
                        className="rounded border-border text-primary focus:ring-primary w-4 h-4"
                      />
                      <span className="font-medium">{norma}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 text-xs font-semibold border border-border rounded-lg hover:bg-muted transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newDiagName || selectedNormas.length === 0}
                  className="flex-1 py-2 text-xs font-semibold bg-primary hover:bg-primary/90 text-white rounded-lg transition disabled:opacity-50"
                >
                  Generar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
