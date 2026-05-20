"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { 
  Activity, 
  Plus, 
  Trash2, 
  Target, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Calendar, 
  ChevronRight, 
  X, 
  BarChart3,
  Percent,
  ListTodo
} from "lucide-react";

interface Medicion {
  id: string;
  indicador_id: string;
  periodo: string;
  valor_real: number;
  comentarios: string | null;
}

interface KPI {
  id: string;
  codigo: string;
  nombre: string;
  formula: string;
  meta: number;
  unidad: string;
  frecuencia: string;
  mediciones: Medicion[];
}

export default function KPIsPage() {
  const { data: session } = useSession();
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected KPI for details and charting
  const [selectedKPI, setSelectedKPI] = useState<KPI | null>(null);

  // Modals
  const [isKPIModalOpen, setIsKPIModalOpen] = useState(false);
  const [isMedicionModalOpen, setIsMedicionModalOpen] = useState(false);

  // Form states - KPI Create
  const [newKPICodigo, setNewKPICodigo] = useState("");
  const [newKPINombre, setNewKPINombre] = useState("");
  const [newKPIFormula, setNewKPIFormula] = useState("");
  const [newKPIMeta, setNewKPIMeta] = useState<number>(0);
  const [newKPIUnidad, setNewKPIUnidad] = useState("%");
  const [newKPIFrecuencia, setNewKPIFrecuencia] = useState("mensual");

  // Form states - Medicion Add
  const [newMedPeriodo, setNewMedPeriodo] = useState("");
  const [newMedValor, setNewMedValor] = useState<number>(0);
  const [newMedComentarios, setNewMedComentarios] = useState("");

  const fetchData = async () => {
    if (!session?.user) return;
    setLoading(true);
    setError(null);
    try {
      const headers = { Authorization: `Bearer ${(session as any).accessToken}` };
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

      const res = await fetch(`${apiUrl}/api/v1/kpis`, { headers });
      if (!res.ok) throw new Error("Error al obtener los indicadores de calidad.");
      const data = await res.json();
      setKpis(data);
      
      // Keep selected KPI updated or default to first
      if (data.length > 0) {
        if (selectedKPI) {
          const updated = data.find((k: KPI) => k.id === selectedKPI.id);
          setSelectedKPI(updated || data[0]);
        } else {
          setSelectedKPI(data[0]);
        }
      } else {
        setSelectedKPI(null);
      }
    } catch (err: any) {
      setError(err.message || "Error al cargar la consola de KPIs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [session]);

  const handleCreateKPI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKPICodigo || !newKPINombre || !newKPIFormula || newKPIMeta <= 0) return;

    try {
      setError(null);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/kpis`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any).accessToken}`,
        },
        body: JSON.stringify({
          codigo: newKPICodigo,
          nombre: newKPINombre,
          formula: newKPIFormula,
          meta: newKPIMeta,
          unidad: newKPIUnidad,
          frecuencia: newKPIFrecuencia,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Error al crear el indicador.");
      }

      // Reset & Refresh
      setNewKPICodigo("");
      setNewKPINombre("");
      setNewKPIFormula("");
      setNewKPIMeta(0);
      setNewKPIUnidad("%");
      setNewKPIFrecuencia("mensual");
      setIsKPIModalOpen(false);
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreateMedicion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKPI || !newMedPeriodo || newMedValor < 0) return;

    try {
      setError(null);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/kpis/${selectedKPI.id}/mediciones`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${(session as any).accessToken}`,
          },
          body: JSON.stringify({
            periodo: newMedPeriodo,
            valor_real: newMedValor,
            comentarios: newMedComentarios || null,
          }),
        }
      );

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Error al registrar la medición.");
      }

      // Reset & Refresh
      setNewMedPeriodo("");
      setNewMedValor(0);
      setNewMedComentarios("");
      setIsMedicionModalOpen(false);
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteKPI = async (id: string) => {
    if (!confirm("¿Está seguro de que desea eliminar este KPI? Se perderán todas sus mediciones históricas.")) return;

    try {
      setError(null);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/kpis/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${(session as any).accessToken}`,
        },
      });

      if (!res.ok) throw new Error("Error al eliminar el indicador.");

      setSelectedKPI(null);
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteMedicion = async (kpiId: string, medicionId: string) => {
    if (!confirm("¿Desea eliminar esta medición?")) return;

    try {
      setError(null);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/kpis/${kpiId}/mediciones/${medicionId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${(session as any).accessToken}`,
          },
        }
      );

      if (!res.ok) throw new Error("Error al eliminar la medición.");

      await fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Helper: Semaphoric Status
  const getStatusColor = (val: number, meta: number) => {
    if (val >= meta) return { text: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20", label: "Conforme" };
    if (val >= meta * 0.9) return { text: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20", label: "En Riesgo" };
    return { text: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20", label: "Crítico" };
  };

  // Statistics calculation for the current active tenant
  const totalKPIs = kpis.length;
  const compliantKPIs = kpis.filter(k => {
    if (k.mediciones.length === 0) return false;
    const sorted = [...k.mediciones].sort((a, b) => a.periodo.localeCompare(b.periodo));
    const latestVal = sorted[sorted.length - 1].valor_real;
    return latestVal >= k.meta;
  }).length;
  const criticalKPIs = kpis.filter(k => {
    if (k.mediciones.length === 0) return false;
    const sorted = [...k.mediciones].sort((a, b) => a.periodo.localeCompare(b.periodo));
    const latestVal = sorted[sorted.length - 1].valor_real;
    return latestVal < k.meta * 0.9;
  }).length;

  const compliancePercentage = totalKPIs > 0 ? Math.round((compliantKPIs / totalKPIs) * 100) : 0;

  // Chart Rendering calculations
  const renderSVGChart = (kpi: KPI) => {
    if (kpi.mediciones.length === 0) {
      return (
        <div className="h-64 flex flex-col items-center justify-center text-muted-foreground border border-dashed border-border rounded-2xl bg-zinc-950/10 backdrop-blur-sm p-6">
          <TrendingUp className="w-12 h-12 text-zinc-600 mb-3 animate-pulse" />
          <p className="font-semibold text-sm">Sin Mediciones Registradas</p>
          <p className="text-xs text-zinc-500 text-center mt-1">
            Agregue una medición para visualizar la evolución del indicador en tiempo real.
          </p>
        </div>
      );
    }

    const sortedMeds = [...kpi.mediciones].sort((a, b) => a.periodo.localeCompare(b.periodo));
    
    // SVG Settings
    const svgWidth = 600;
    const svgHeight = 250;
    const paddingLeft = 50;
    const paddingRight = 30;
    const paddingTop = 30;
    const paddingBottom = 40;

    const chartWidth = svgWidth - paddingLeft - paddingRight;
    const chartHeight = svgHeight - paddingTop - paddingBottom;

    // Value scaling
    const values = sortedMeds.map(m => m.valor_real);
    const maxVal = Math.max(...values, kpi.meta);
    const minVal = Math.min(...values, kpi.meta);
    
    const range = maxVal - minVal;
    const yMax = maxVal + (range * 0.1 || 10);
    const yMin = Math.max(0, minVal - (range * 0.1 || 10));
    const yRange = yMax - yMin;

    // Coordinate mapping functions
    const getX = (index: number) => {
      if (sortedMeds.length <= 1) return paddingLeft + chartWidth / 2;
      return paddingLeft + (index / (sortedMeds.length - 1)) * chartWidth;
    };

    const getY = (value: number) => {
      return svgHeight - paddingBottom - ((value - yMin) / yRange) * chartHeight;
    };

    // Construct paths
    let linePathD = "";
    let areaPathD = "";

    if (sortedMeds.length > 0) {
      // Line path starting point
      linePathD = `M ${getX(0)} ${getY(sortedMeds[0].valor_real)}`;
      areaPathD = `M ${getX(0)} ${getY(0)}`; // Starting at zero ground level (or bottom of chart)

      sortedMeds.forEach((m, idx) => {
        const x = getX(idx);
        const y = getY(m.valor_real);
        
        if (idx > 0) {
          linePathD += ` L ${x} ${y}`;
        }
        areaPathD += ` L ${x} ${y}`;
      });

      // Close the area path down to ground and back to start
      const lastX = getX(sortedMeds.length - 1);
      const groundY = svgHeight - paddingBottom;
      areaPathD += ` L ${lastX} ${groundY} L ${getX(0)} ${groundY} Z`;
    }

    const metaY = getY(kpi.meta);

    return (
      <div className="relative bg-zinc-950/20 backdrop-blur-md rounded-2xl border border-white/5 p-6 shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 p-4 bg-emerald-500/10 text-emerald-400 border-l border-b border-emerald-500/20 rounded-bl-xl text-xs font-mono font-bold">
          Meta: {kpi.meta} {kpi.unidad}
        </div>
        <h4 className="text-xs text-zinc-400 font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-secondary" />
          Evolución Histórica de {kpi.codigo}
        </h4>

        <svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="overflow-visible select-none">
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const yVal = yMin + ratio * yRange;
            const y = getY(yVal);
            return (
              <g key={i}>
                <line 
                  x1={paddingLeft} 
                  y1={y} 
                  x2={svgWidth - paddingRight} 
                  y2={y} 
                  stroke="rgba(255,255,255,0.05)" 
                  strokeDasharray="4 4" 
                />
                <text 
                  x={paddingLeft - 8} 
                  y={y + 4} 
                  fill="#71717a" 
                  fontSize="10" 
                  textAnchor="end"
                  className="font-mono"
                >
                  {Math.round(yVal)}
                </text>
              </g>
            );
          })}

          {/* Target Meta line */}
          <line 
            x1={paddingLeft} 
            y1={metaY} 
            x2={svgWidth - paddingRight} 
            y2={metaY} 
            stroke="#ef4444" 
            strokeWidth="1.5" 
            strokeDasharray="5 5" 
          />
          <text 
            x={svgWidth - paddingRight - 4} 
            y={metaY - 6} 
            fill="#ef4444" 
            fontSize="10" 
            textAnchor="end" 
            className="font-semibold"
          >
            Meta ({kpi.meta})
          </text>

          {/* Area under the curves */}
          {sortedMeds.length > 0 && (
            <path d={areaPathD} fill="url(#areaGrad)" />
          )}

          {/* Line Connecting Points */}
          {sortedMeds.length > 0 && (
            <path d={linePathD} fill="none" stroke="url(#lineGrad)" strokeWidth="3" strokeLinecap="round" />
          )}

          {/* Points */}
          {sortedMeds.map((med, idx) => {
            const x = getX(idx);
            const y = getY(med.valor_real);
            const isTargetMet = med.valor_real >= kpi.meta;
            return (
              <g key={med.id} className="group cursor-pointer">
                <circle 
                  cx={x} 
                  cy={y} 
                  r="6" 
                  fill={isTargetMet ? "#10b981" : "#f59e0b"} 
                  stroke="#18181b" 
                  strokeWidth="2" 
                  className="transition-transform duration-200 hover:scale-150" 
                />
                <text 
                  x={x} 
                  y={y - 12} 
                  fill="#ffffff" 
                  fontSize="10" 
                  fontWeight="bold" 
                  textAnchor="middle"
                  className="opacity-0 group-hover:opacity-100 transition-opacity bg-black duration-200"
                >
                  {med.valor_real}{kpi.unidad}
                </text>
              </g>
            );
          })}

          {/* X axis labels */}
          {sortedMeds.map((med, idx) => {
            const x = getX(idx);
            return (
              <text 
                key={med.id} 
                x={x} 
                y={svgHeight - 12} 
                fill="#a1a1aa" 
                fontSize="10" 
                textAnchor="middle"
                className="font-semibold"
              >
                {med.periodo}
              </text>
            );
          })}
        </svg>
      </div>
    );
  };

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-12">
      {/* Upper header action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-secondary/15 rounded-2xl flex items-center justify-center border border-secondary/25 shadow-inner">
              <Activity className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">KPIs e Indicadores de Calidad</h1>
              <p className="text-sm text-muted-foreground">
                Gestione y controle métricas del SGI bajo Cláusula 9.1 de ISO 9001:2015.
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsKPIModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-secondary text-primary-foreground font-semibold shadow hover:bg-secondary/90 hover:scale-[1.02] active:scale-95 transition-all text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Definir Nuevo KPI</span>
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

      {/* KPI Cards summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-white/5 p-6 shadow flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <ListTodo className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-zinc-500 block uppercase font-bold tracking-wider">KPIs Definidos</span>
            <span className="text-2xl font-bold block text-white mt-1">{totalKPIs}</span>
          </div>
        </div>

        <div className="bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-white/5 p-6 shadow flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-zinc-500 block uppercase font-bold tracking-wider">KPIs en Meta</span>
            <span className="text-2xl font-bold block text-white mt-1">{compliantKPIs}</span>
          </div>
        </div>

        <div className="bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-white/5 p-6 shadow flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-zinc-500 block uppercase font-bold tracking-wider">KPIs en Alerta</span>
            <span className="text-2xl font-bold block text-white mt-1">{criticalKPIs}</span>
          </div>
        </div>

        <div className="bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-white/5 p-6 shadow flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
            <Percent className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-zinc-500 block uppercase font-bold tracking-wider">Desempeño Global</span>
            <span className="text-2xl font-bold block text-white mt-1">{compliancePercentage}%</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-medium">Cargando consola de KPIs del SGI...</p>
        </div>
      ) : kpis.length === 0 ? (
        <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-12 text-center max-w-xl mx-auto shadow-2xl">
          <Activity className="w-16 h-16 text-zinc-700 mx-auto mb-4 animate-bounce" />
          <h3 className="text-lg font-bold text-white mb-2">No se han definido KPIs estratégicos</h3>
          <p className="text-zinc-500 text-sm mb-6 leading-relaxed">
            Comience a estructurar el ciclo estratégico ISO 9001 registrando los indicadores y metas clave de la organización.
          </p>
          <button
            onClick={() => setIsKPIModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-secondary text-primary-foreground font-bold shadow hover:bg-secondary/90 transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Definir Primer KPI</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar selector */}
          <div className="lg:col-span-4 space-y-4">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Listado de Indicadores</h3>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {kpis.map((kpi) => {
                const isSelected = selectedKPI?.id === kpi.id;
                const sorted = [...kpi.mediciones].sort((a, b) => a.periodo.localeCompare(b.periodo));
                const latestMed = sorted[sorted.length - 1];
                const stats = latestMed ? getStatusColor(latestMed.valor_real, kpi.meta) : null;

                return (
                  <div
                    key={kpi.id}
                    onClick={() => setSelectedKPI(kpi)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-secondary/10 border-secondary shadow-lg shadow-secondary/5 text-white"
                        : "bg-zinc-900/30 border-white/5 text-zinc-400 hover:bg-zinc-900/60 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-bold bg-white/10 px-2 py-0.5 rounded text-secondary-foreground">
                        {kpi.codigo}
                      </span>
                      {stats ? (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${stats.bg} ${stats.text}`}>
                          {stats.label}
                        </span>
                      ) : (
                        <span className="text-[10px] bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          Sin datos
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-sm line-clamp-1">{kpi.nombre}</h4>
                    <div className="flex items-center justify-between mt-3 text-xs text-zinc-500">
                      <span>Meta: {kpi.meta}{kpi.unidad}</span>
                      <span>Real: {latestMed ? `${latestMed.valor_real}${kpi.unidad}` : "N/D"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* KPI detail content */}
          {selectedKPI && (
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl relative">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-white/5 pb-6 mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-xs font-extrabold bg-secondary text-primary-foreground px-3 py-1 rounded-md">
                        {selectedKPI.codigo}
                      </span>
                      <span className="text-zinc-500 text-xs font-semibold capitalize">
                        Frecuencia {selectedKPI.frecuencia}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-white">{selectedKPI.nombre}</h2>
                    <p className="text-xs text-zinc-400 mt-2 font-mono bg-zinc-950/40 p-2.5 rounded-lg inline-block border border-white/5">
                      Fórmula: <span className="text-secondary">{selectedKPI.formula}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-start">
                    <button
                      onClick={() => setIsMedicionModalOpen(true)}
                      className="px-4 py-2.5 rounded-xl bg-emerald-500 text-white font-semibold text-xs shadow hover:bg-emerald-600 transition-all flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Registrar Medición</span>
                    </button>
                    <button
                      onClick={() => handleDeleteKPI(selectedKPI.id)}
                      className="p-2.5 rounded-xl bg-zinc-800 text-rose-500 border border-white/5 hover:bg-rose-500/10 hover:border-rose-500/20 hover:text-rose-400 transition-all"
                      title="Eliminar Indicador"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* SVG Graph wrapper */}
                <div className="mb-8">
                  {renderSVGChart(selectedKPI)}
                </div>

                {/* Measurements logs table */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Historial de Mediciones</h3>
                  {selectedKPI.mediciones.length === 0 ? (
                    <p className="text-zinc-500 text-xs italic">Aún no se han cargado logs históricos de mediciones.</p>
                  ) : (
                    <div className="border border-white/5 rounded-2xl overflow-hidden bg-zinc-950/20">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-white/5 text-zinc-400 font-bold border-b border-white/5">
                            <th className="p-4">Período</th>
                            <th className="p-4">Valor Real</th>
                            <th className="p-4">Cumplimiento</th>
                            <th className="p-4">Comentarios</th>
                            <th className="p-4 text-center">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-zinc-300">
                          {[...selectedKPI.mediciones]
                            .sort((a, b) => b.periodo.localeCompare(a.periodo))
                            .map((med) => {
                              const stats = getStatusColor(med.valor_real, selectedKPI.meta);
                              return (
                                <tr key={med.id} className="hover:bg-white/5 transition-colors">
                                  <td className="p-4 font-mono font-bold">{med.periodo}</td>
                                  <td className="p-4 font-semibold text-white">
                                    {med.valor_real}{selectedKPI.unidad}
                                  </td>
                                  <td className="p-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider ${stats.bg} ${stats.text}`}>
                                      {stats.label}
                                    </span>
                                  </td>
                                  <td className="p-4 text-zinc-400 italic max-w-xs truncate">
                                    {med.comentarios || "Sin comentarios"}
                                  </td>
                                  <td className="p-4 text-center">
                                    <button
                                      onClick={() => handleDeleteMedicion(selectedKPI.id, med.id)}
                                      className="text-rose-500 hover:text-rose-400 font-bold p-1 rounded transition-colors"
                                    >
                                      Eliminar
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: CREATE KPI */}
      {isKPIModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-secondary" />
                Definir Indicador (KPI)
              </h2>
              <button 
                onClick={() => setIsKPIModalOpen(false)}
                className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateKPI} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Código del KPI *</label>
                <input
                  type="text"
                  placeholder="Ej: KPI-IND-01"
                  required
                  value={newKPICodigo}
                  onChange={(e) => setNewKPICodigo(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/10 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Nombre del KPI *</label>
                <input
                  type="text"
                  placeholder="Ej: Tasa de Conformidad de Ensayos"
                  required
                  value={newKPINombre}
                  onChange={(e) => setNewKPINombre(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/10 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Fórmula de Cálculo *</label>
                <input
                  type="text"
                  placeholder="Ej: (Ensayos Conformes / Ensayos Totales) * 100"
                  required
                  value={newKPIFormula}
                  onChange={(e) => setNewKPIFormula(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/10 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Meta Esperada *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="95.0"
                    required
                    value={newKPIMeta || ""}
                    onChange={(e) => setNewKPIMeta(parseFloat(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/10 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Unidad *</label>
                  <input
                    type="text"
                    placeholder="%"
                    required
                    value={newKPIUnidad}
                    onChange={(e) => setNewKPIUnidad(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/10 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Frecuencia de Medición *</label>
                <select
                  value={newKPIFrecuencia}
                  onChange={(e) => setNewKPIFrecuencia(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/10 text-white text-sm focus:outline-none focus:border-secondary transition-all"
                >
                  <option value="mensual">Mensual</option>
                  <option value="trimestral">Trimestral</option>
                  <option value="semestral">Semestral</option>
                  <option value="anual">Anual</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsKPIModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-secondary text-primary-foreground font-semibold text-xs shadow hover:bg-secondary/90 transition-all"
                >
                  Guardar Indicador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD MEASUREMENT */}
      {isMedicionModalOpen && selectedKPI && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                Registrar Medición - {selectedKPI.codigo}
              </h2>
              <button 
                onClick={() => setIsMedicionModalOpen(false)}
                className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMedicion} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">
                  Período de Medición *
                </label>
                <input
                  type="text"
                  placeholder="Ej: 2026-05"
                  required
                  value={newMedPeriodo}
                  onChange={(e) => setNewMedPeriodo(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/10 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all font-mono"
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  Use el formato AAAA-MM (Ej: 2026-05) o AAAA-T1/2/3/4 para trimestres.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">
                  Valor Real Registrado ({selectedKPI.unidad}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.0"
                  required
                  value={newMedValor || ""}
                  onChange={(e) => setNewMedValor(parseFloat(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/10 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">
                  Comentarios y Observaciones
                </label>
                <textarea
                  placeholder="Describa la causa raíz de desvíos, acciones preventivas, o notas de la medición..."
                  value={newMedComentarios}
                  onChange={(e) => setNewMedComentarios(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/10 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsMedicionModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white font-semibold text-xs shadow hover:bg-emerald-600 transition-all"
                >
                  Guardar Medición
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
