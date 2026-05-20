"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { 
  Presentation, 
  Printer, 
  Leaf, 
  ShieldCheck, 
  AlertOctagon, 
  Activity, 
  TrendingDown, 
  CheckCircle,
  FileSpreadsheet,
  RefreshCw,
  Target
} from "lucide-react";

interface ReportData {
  gap_analysis: {
    cumple: number;
    cumple_parcialmente: number;
    no_cumple: number;
    no_aplica: number;
  };
  capa: {
    abierta: number;
    analizada: number;
    resuelta: number;
    cerrada: number;
  };
  risks: {
    total: number;
    avg_inherent: number;
    avg_residual: number;
    mitigation_percentage: number;
  };
  carbon_footprint: {
    "1": number;
    "2": number;
    "3": number;
  };
  kpis: {
    total: number;
    cumplidos: number;
    en_alerta: number;
    porcentaje_cumplimiento: number;
  };
}

export default function ReporteSGIPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReportData = async () => {
    if (!session?.user) return;
    setLoading(true);
    setError(null);
    try {
      const headers = { Authorization: `Bearer ${(session as any).accessToken}` };
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

      const res = await fetch(`${apiUrl}/api/v1/reportes/sgi-consolidado`, { headers });
      if (!res.ok) throw new Error("Error al compilar el reporte consolidado SGI.");
      const report = await res.json();
      setData(report);
    } catch (err: any) {
      setError(err.message || "Error al cargar la consola de reportes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [session]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
        <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium">Compilando e integrando base de datos multitenante del SGI...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 max-w-xl mx-auto space-y-4">
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-start gap-3">
          <AlertOctagon className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Error al cargar reportes:</span> {error || "No se recibieron datos operativos."}
          </div>
        </div>
        <button 
          onClick={fetchReportData} 
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-secondary text-primary-foreground font-semibold"
        >
          <RefreshCw className="w-4 h-4" /> Reintentar
        </button>
      </div>
    );
  }

  // --- Calculations for Custom SVG Donut & Bar Charts ---
  // 1. Donut: Gap Analysis
  const gapTotal = data.gap_analysis.cumple + data.gap_analysis.cumple_parcialmente + data.gap_analysis.no_cumple + data.gap_analysis.no_aplica;
  const gapPercent = gapTotal > 0 ? Math.round(((data.gap_analysis.cumple + data.gap_analysis.cumple_parcialmente * 0.5) / gapTotal) * 100) : 0;
  
  // Circumference for strokeDasharray (radius = 50, circumference = 2 * PI * r = 314.16)
  const radius = 50;
  const circ = 2 * Math.PI * radius;
  const gapStrokeDashoffset = circ - (gapPercent / 100) * circ;

  // 2. Bars: CAPAs
  const capaTotal = data.capa.abierta + data.capa.analizada + data.capa.resuelta + data.capa.cerrada;
  const getCapaBarHeight = (val: number) => {
    if (capaTotal === 0) return 10;
    return 10 + (val / capaTotal) * 120; // scale max height to 130px
  };

  // 3. Carbon Footprint Scope Totals
  const carbonTotal = data.carbon_footprint["1"] + data.carbon_footprint["2"] + data.carbon_footprint["3"];

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-16 relative">
      
      {/* CSS overrides for flawless printing */}
      <style jsx global>{`
        @media print {
          /* Hide sidebar and top header */
          aside, header, button, .no-print {
            display: none !important;
          }
          /* Expand main container */
          main, body, html {
            background: #ffffff !important;
            color: #000000 !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            min-height: 100% !important;
          }
          .print-container {
            border: none !important;
            box-shadow: none !important;
            background: #ffffff !important;
            color: #000000 !important;
            padding: 20px !important;
            max-width: 100% !important;
          }
          .print-card {
            background: #ffffff !important;
            border: 1px solid #e4e4e7 !important;
            color: #000000 !important;
            box-shadow: none !important;
            page-break-inside: avoid;
          }
          h1, h2, h3, h4, span, p, td, th {
            color: #000000 !important;
          }
          /* Custom SVG printable fixes */
          svg text {
            fill: #000000 !important;
          }
        }
      `}</style>

      {/* Action panel header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-secondary/15 rounded-2xl flex items-center justify-center border border-secondary/25 shadow-inner">
              <Presentation className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Consola de Reportes del SGI</h1>
              <p className="text-sm text-muted-foreground">
                Informe ejecutivo consolidado en tiempo real de metas, brechas, riesgos y sostenibilidad.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchReportData}
            className="p-3 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white border border-white/5 hover:bg-zinc-700 transition-all"
            title="Refrescar Datos"
          >
            <RefreshCw className="w-4 h-4 animate-spin-hover" />
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-secondary text-primary-foreground font-semibold shadow hover:bg-secondary/90 hover:scale-[1.02] active:scale-95 transition-all text-sm animate-pulse"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Informe SGI</span>
          </button>
        </div>
      </div>

      {/* Main Print Container Wrapper */}
      <div className="print-container space-y-8">
        
        {/* Printable official report header */}
        <div className="hidden print:flex items-center justify-between border-b-2 border-zinc-900 pb-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-zinc-950 rounded-lg flex items-center justify-center font-bold text-white text-sm">
              AeL
            </div>
            <div>
              <h2 className="font-bold text-base tracking-tight text-black">AuditoríasEnLínea</h2>
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-bold">Reporte Consolidado del Sistema de Gestión Integrado (SGI)</span>
            </div>
          </div>
          <div className="text-right text-xs text-zinc-600">
            <p>ISO 9001 / ISO 14064 Compliance</p>
            <p className="font-mono mt-1">Generado: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
          </div>
        </div>

        {/* Global summary widgets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* KPI global performance */}
          <div className="print-card bg-zinc-900/50 backdrop-blur-md rounded-3xl border border-white/5 p-6 shadow-xl flex items-center justify-between gap-4">
            <div>
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block">Desempeño de KPIs</span>
              <h3 className="text-2xl font-black mt-1 text-white">{data.kpis.porcentaje_cumplimiento}%</h3>
              <p className="text-xs text-zinc-400 mt-2">
                {data.kpis.cumplidos} de {data.kpis.total} metas alcanzadas
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center border border-secondary/20">
              <Activity className="w-7 h-7 text-secondary" />
            </div>
          </div>

          {/* Risk mitigation delta */}
          <div className="print-card bg-zinc-900/50 backdrop-blur-md rounded-3xl border border-white/5 p-6 shadow-xl flex items-center justify-between gap-4">
            <div>
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block">Mitigación de Riesgos</span>
              <h3 className="text-2xl font-black mt-1 text-white">-{data.risks.mitigation_percentage}%</h3>
              <p className="text-xs text-zinc-400 mt-2">
                Inherent ({data.risks.avg_inherent}) vs Residual ({data.risks.avg_residual})
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
              <TrendingDown className="w-7 h-7 text-rose-500" />
            </div>
          </div>

          {/* Sustainability scopes */}
          <div className="print-card bg-zinc-900/50 backdrop-blur-md rounded-3xl border border-white/5 p-6 shadow-xl flex items-center justify-between gap-4">
            <div>
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block">Sostenibilidad (Carbono)</span>
              <h3 className="text-2xl font-black mt-1 text-white">{carbonTotal.toFixed(2)} t</h3>
              <p className="text-xs text-zinc-400 mt-2">
                Huella consolidada de alcance 1, 2 y 3
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <Leaf className="w-7 h-7 text-emerald-500" />
            </div>
          </div>
        </div>

        {/* Mid grid visual dashboards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* GAP Analysis Donut Chart */}
          <div className="print-card bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Estado de Cumplimiento de Brechas (Gap Analysis)
            </h3>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-4">
              {/* SVG circular donut chart */}
              <div className="relative w-36 h-36">
                <svg width="100%" height="100%" viewBox="0 0 120 120" className="-rotate-90">
                  <circle 
                    cx="60" 
                    cy="60" 
                    r={radius} 
                    fill="transparent" 
                    stroke="rgba(255,255,255,0.05)" 
                    strokeWidth="12" 
                  />
                  <circle 
                    cx="60" 
                    cy="60" 
                    r={radius} 
                    fill="transparent" 
                    stroke="#10b981" 
                    strokeWidth="12" 
                    strokeDasharray={circ} 
                    strokeDashoffset={gapStrokeDashoffset} 
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-black text-white leading-none">{gapPercent}%</span>
                  <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold mt-1">Cumplido</span>
                </div>
              </div>

              {/* Data breakdowns table */}
              <div className="flex-1 space-y-3 w-full">
                <div className="flex items-center justify-between text-xs border-b border-white/5 pb-2">
                  <span className="flex items-center gap-2 text-zinc-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Cumple
                  </span>
                  <strong className="text-white">{data.gap_analysis.cumple}</strong>
                </div>
                <div className="flex items-center justify-between text-xs border-b border-white/5 pb-2">
                  <span className="flex items-center gap-2 text-zinc-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Cumple Parcialmente
                  </span>
                  <strong className="text-white">{data.gap_analysis.cumple_parcialmente}</strong>
                </div>
                <div className="flex items-center justify-between text-xs border-b border-white/5 pb-2">
                  <span className="flex items-center gap-2 text-zinc-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> No Cumple
                  </span>
                  <strong className="text-white">{data.gap_analysis.no_cumple}</strong>
                </div>
                <div className="flex items-center justify-between text-xs pb-1">
                  <span className="flex items-center gap-2 text-zinc-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-600" /> No Aplica
                  </span>
                  <strong className="text-white">{data.gap_analysis.no_aplica}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* CAPA Status Bar Chart */}
          <div className="print-card bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-amber-500" />
              Ciclo de Desvíos y No Conformidades (CAPA)
            </h3>

            <div className="flex items-end justify-around h-48 py-4 border-b border-white/5 relative">
              
              {/* Back grid line */}
              <div className="absolute left-0 right-0 top-1/4 border-b border-white/5 border-dashed" />
              <div className="absolute left-0 right-0 top-2/4 border-b border-white/5 border-dashed" />
              <div className="absolute left-0 right-0 top-3/4 border-b border-white/5 border-dashed" />

              {/* Bar 1: Abierta */}
              <div className="flex flex-col items-center gap-2 group z-10">
                <span className="text-[10px] font-bold text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity bg-black px-1.5 py-0.5 rounded">
                  {data.capa.abierta}
                </span>
                <div 
                  style={{ height: `${getCapaBarHeight(data.capa.abierta)}px` }}
                  className="w-10 bg-rose-500/20 border border-rose-500/30 rounded-t-xl hover:bg-rose-500/40 transition-all duration-500"
                />
                <span className="text-[9px] uppercase font-bold text-zinc-500">Abiertas</span>
              </div>

              {/* Bar 2: Analizada */}
              <div className="flex flex-col items-center gap-2 group z-10">
                <span className="text-[10px] font-bold text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity bg-black px-1.5 py-0.5 rounded">
                  {data.capa.analizada}
                </span>
                <div 
                  style={{ height: `${getCapaBarHeight(data.capa.analizada)}px` }}
                  className="w-10 bg-amber-500/20 border border-amber-500/30 rounded-t-xl hover:bg-amber-500/40 transition-all duration-500"
                />
                <span className="text-[9px] uppercase font-bold text-zinc-500">Analizadas</span>
              </div>

              {/* Bar 3: Resuelta */}
              <div className="flex flex-col items-center gap-2 group z-10">
                <span className="text-[10px] font-bold text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity bg-black px-1.5 py-0.5 rounded">
                  {data.capa.resuelta}
                </span>
                <div 
                  style={{ height: `${getCapaBarHeight(data.capa.resuelta)}px` }}
                  className="w-10 bg-blue-500/20 border border-blue-500/30 rounded-t-xl hover:bg-blue-500/40 transition-all duration-500"
                />
                <span className="text-[9px] uppercase font-bold text-zinc-500">Resueltas</span>
              </div>

              {/* Bar 4: Cerrada */}
              <div className="flex flex-col items-center gap-2 group z-10">
                <span className="text-[10px] font-bold text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity bg-black px-1.5 py-0.5 rounded">
                  {data.capa.cerrada}
                </span>
                <div 
                  style={{ height: `${getCapaBarHeight(data.capa.cerrada)}px` }}
                  className="w-10 bg-emerald-500/20 border border-emerald-500/30 rounded-t-xl hover:bg-emerald-500/40 transition-all duration-500"
                />
                <span className="text-[9px] uppercase font-bold text-zinc-500">Cerradas</span>
              </div>

            </div>
          </div>

        </div>

        {/* Lower section detail reports */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Risk Mitigations detail */}
          <div className="print-card bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-3xl p-6 shadow-xl space-y-4 lg:col-span-1">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <TrendingDown className="w-4.5 h-4.5 text-rose-500" />
              Gestión de Riesgos (ISO 31000)
            </h4>
            
            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-xl bg-zinc-950/40 border border-white/5 flex justify-between items-center">
                <span className="text-xs text-zinc-500 uppercase font-semibold">Total Riesgos</span>
                <strong className="text-sm text-white">{data.risks.total}</strong>
              </div>
              
              <div className="p-4 rounded-xl bg-zinc-950/40 border border-white/5 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500">Promedio Score Inherente</span>
                  <strong className="text-rose-400">{data.risks.avg_inherent}</strong>
                </div>
                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    style={{ width: `${Math.min(100, (data.risks.avg_inherent / 25) * 100)}%` }} 
                    className="h-full bg-rose-500" 
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950/40 border border-white/5 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500">Promedio Score Residual</span>
                  <strong className="text-emerald-400">{data.risks.avg_residual}</strong>
                </div>
                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    style={{ width: `${Math.min(100, (data.risks.avg_residual / 25) * 100)}%` }} 
                    className="h-full bg-emerald-500" 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sostenibilidad Carbon Scope detail */}
          <div className="print-card bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-3xl p-6 shadow-xl space-y-4 lg:col-span-1">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <Leaf className="w-4.5 h-4.5 text-emerald-400" />
              Sostenibilidad y Huella (ISO 14064)
            </h4>
            
            <div className="space-y-3 pt-2">
              <div className="p-3.5 rounded-xl bg-zinc-950/40 border border-white/5 flex justify-between items-center text-xs">
                <div>
                  <span className="font-semibold text-white block">Alcance 1</span>
                  <span className="text-[10px] text-zinc-500">Combustión y Directas</span>
                </div>
                <strong className="text-white font-mono">{data.carbon_footprint["1"].toFixed(2)} t CO2e</strong>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-950/40 border border-white/5 flex justify-between items-center text-xs">
                <div>
                  <span className="font-semibold text-white block">Alcance 2</span>
                  <span className="text-[10px] text-zinc-500">Energía Eléctrica Adquirida</span>
                </div>
                <strong className="text-white font-mono">{data.carbon_footprint["2"].toFixed(2)} t CO2e</strong>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-950/40 border border-white/5 flex justify-between items-center text-xs">
                <div>
                  <span className="font-semibold text-white block">Alcance 3</span>
                  <span className="text-[10px] text-zinc-500">Logística, Viajes y Residuos</span>
                </div>
                <strong className="text-white font-mono">{data.carbon_footprint["3"].toFixed(2)} t CO2e</strong>
              </div>
            </div>
          </div>

          {/* SGI KPIs execution percentage detail */}
          <div className="print-card bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-3xl p-6 shadow-xl space-y-4 lg:col-span-1">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <Target className="w-4.5 h-4.5 text-secondary" />
              KPIs de Performance de Calidad
            </h4>
            
            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-xl bg-zinc-950/40 border border-white/5 flex justify-between items-center text-xs">
                <span className="text-zinc-500 uppercase font-semibold">Total KPIs Definidos</span>
                <strong className="text-sm text-white">{data.kpis.total}</strong>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-center">
                  <span className="text-[10px] text-zinc-500 block uppercase font-bold">Conformes</span>
                  <strong className="text-lg text-emerald-400 block mt-1">{data.kpis.cumplidos}</strong>
                </div>

                <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/10 text-center">
                  <span className="text-[10px] text-zinc-500 block uppercase font-bold">En Alerta</span>
                  <strong className="text-lg text-rose-400 block mt-1">{data.kpis.en_alerta}</strong>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Printable legal footer stamp */}
        <div className="hidden print:block pt-12 border-t border-zinc-300 text-center text-[10px] text-zinc-500">
          <p>Este informe constituye un extracto oficial firmado digitalmente por los responsables autorizados de la dirección.</p>
          <p className="mt-1 font-semibold uppercase">AuditoríasEnLínea - Confidencial Multitenant SGI Report</p>
        </div>

      </div>

    </div>
  );
}
