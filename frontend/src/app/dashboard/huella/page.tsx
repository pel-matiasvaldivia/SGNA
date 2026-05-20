"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { 
  Leaf, 
  Zap, 
  Flame, 
  Truck, 
  Plus, 
  Trash2, 
  Calculator, 
  FileText, 
  ArrowRight, 
  Calendar, 
  TrendingUp, 
  Info, 
  X,
  ShieldCheck,
  ChevronRight
} from "lucide-react";

interface Emision {
  id: string;
  periodo: string;
  alcance: number;
  categoria: string;
  subcategoria: string | null;
  fuente: string;
  cantidad: number;
  unidad: string;
  factor_emision: number;
  co2_equivalente: number;
  evidencia_documento_id: string | null;
  notas: string | null;
  created_at: string;
}

interface Resumen {
  total_co2e: number;
  desglose_alcances: { [key: string]: number };
  porcentajes_alcances: { [key: string]: number };
  emisiones_por_categoria: { [key: string]: number };
  historico_mensual: { periodo: string; co2e: number }[];
}

interface Documento {
  id: string;
  title: string;
  type: string;
  status: string;
}

export default function HuellaPage() {
  const { data: session } = useSession();
  const [emisiones, setEmisiones] = useState<Emision[]>([]);
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form calculator states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [periodoInput, setPeriodoInput] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
  });
  const [alcance, setAlcance] = useState<number>(1);
  const [categoria, setCategoria] = useState<string>("");
  const [subcategoria, setSubcategoria] = useState<string>("");
  const [fuente, setFuente] = useState<string>("");
  const [cantidad, setCantidad] = useState<number>(0);
  const [unidad, setUnidad] = useState<string>("");
  const [factorEmision, setFactorEmision] = useState<number>(0);
  const [notas, setNotas] = useState<string>("");
  const [evidenciaDocId, setEvidenciaDocId] = useState<string>("");

  // Categories metadata mapping
  const alcancesMeta: {
    [key: number]: {
      label: string;
      icon: any;
      color: string;
      bgColor: string;
      borderColor: string;
      categorias: {
        [key: string]: {
          subcategorias: {
            [key: string]: { unidad: string; factor: number };
          };
        };
      };
    };
  } = {
    1: {
      label: "Alcance 1 (Directas)",
      icon: Flame,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/25",
      categorias: {
        "Combustión Fija (Calderas/Generadores)": {
          subcategorias: {
            "Gas Natural": { unidad: "m³", factor: 2.02 },
            "Gas Licuado (GLP)": { unidad: "kg", factor: 2.95 },
            "Diesel / Gasoil (Generación)": { unidad: "litros", factor: 2.68 }
          }
        },
        "Combustión Móvil (Vehículos Propios)": {
          subcategorias: {
            "Gasolina / Nafta": { unidad: "litros", factor: 2.31 },
            "Diesel / Gasoil (Transporte)": { unidad: "litros", factor: 2.68 }
          }
        },
        "Emisiones Fugitivas (Refrigeración)": {
          subcategorias: {
            "Gas R-410A": { unidad: "kg", factor: 2088.0 },
            "Gas R-134a": { unidad: "kg", factor: 1430.0 }
          }
        }
      }
    },
    2: {
      label: "Alcance 2 (Energía Adquirida)",
      icon: Zap,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/25",
      categorias: {
        "Electricidad Adquirida": {
          subcategorias: {
            "Red Eléctrica Nacional": { unidad: "kWh", factor: 0.35 },
            "Energía de Fuente Renovable": { unidad: "kWh", factor: 0.0 }
          }
        },
        "Energía Térmica o Vapor Adquirido": {
          subcategorias: {
            "Vapor Importado de Terceros": { unidad: "MJ", factor: 0.06 }
          }
        }
      }
    },
    3: {
      label: "Alcance 3 (Otras Indirectas)",
      icon: Truck,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/25",
      categorias: {
        "Viajes de Negocios": {
          subcategorias: {
            "Vuelo Comercial (Corto Alcance)": { unidad: "km", factor: 0.15 },
            "Vuelo Comercial (Largo Alcance)": { unidad: "km", factor: 0.11 },
            "Taxi o Transporte Público": { unidad: "km", factor: 0.18 }
          }
        },
        "Logística y Terceros": {
          subcategorias: {
            "Distribución Terrestre (Terceros)": { unidad: "km", factor: 0.22 }
          }
        },
        "Residuos de la Operación": {
          subcategorias: {
            "Residuos Sólidos Urbanos": { unidad: "kg", factor: 0.52 },
            "Residuos Peligrosos": { unidad: "kg", factor: 1.14 }
          }
        }
      }
    }
  };

  // Set default category and subcategory on scope change
  useEffect(() => {
    const defaultCat = Object.keys(alcancesMeta[alcance].categorias)[0];
    setCategoria(defaultCat);
  }, [alcance]);

  // Set default subcategory, unit and emission factor on category change
  useEffect(() => {
    if (categoria && alcancesMeta[alcance].categorias[categoria]) {
      const defaultSub = Object.keys(alcancesMeta[alcance].categorias[categoria].subcategorias)[0];
      setSubcategoria(defaultSub);
    }
  }, [categoria, alcance]);

  // Set unit and factor on subcategory change
  useEffect(() => {
    if (categoria && subcategoria && alcancesMeta[alcance].categorias[categoria]?.subcategorias[subcategoria]) {
      const meta = alcancesMeta[alcance].categorias[categoria].subcategorias[subcategoria];
      setUnidad(meta.unidad);
      setFactorEmision(meta.factor);
    }
  }, [subcategoria, categoria, alcance]);

  const fetchData = async () => {
    if (!session?.user) return;
    setLoading(true);
    setError(null);
    try {
      const headers = { Authorization: `Bearer ${(session as any).accessToken}` };
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

      // 1. Fetch emissions
      const resEmisiones = await fetch(`${apiUrl}/api/v1/huella/emisiones`, { headers });
      if (!resEmisiones.ok) throw new Error("Error al obtener inventario de emisiones.");
      const ems = await resEmisiones.json();
      setEmisiones(ems);

      // 2. Fetch summary stats
      const resResumen = await fetch(`${apiUrl}/api/v1/huella/resumen`, { headers });
      if (!resResumen.ok) throw new Error("Error al obtener estadísticas de huella.");
      const resData = await resResumen.json();
      setResumen(resData);

      // 3. Fetch DMS documents for evidence linking
      const resDocs = await fetch(`${apiUrl}/api/v1/documents/list`, { headers });
      if (resDocs.ok) {
        const docs = await resDocs.json();
        // filter by type 'evidencia' or 'informe'
        setDocumentos(docs.filter((d: any) => d.status === "aprobado"));
      }
    } catch (err: any) {
      setError(err.message || "Error al cargar los datos del módulo de Huella de Carbono.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [session]);

  const handleCreateEmision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cantidad <= 0 || factorEmision <= 0 || !fuente) return;

    try {
      setError(null);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/huella/emisiones`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any).accessToken}`,
        },
        body: JSON.stringify({
          periodo: periodoInput,
          alcance,
          categoria,
          subcategoria,
          fuente,
          cantidad,
          unidad,
          factor_emision: factorEmision,
          notas: notas || null,
          evidencia_documento_id: evidenciaDocId || null
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setFuente("");
        setCantidad(0);
        setNotas("");
        setEvidenciaDocId("");
        await fetchData();
      } else {
        const errData = await res.json();
        throw new Error(errData.detail || "Error al registrar emisión.");
      }
    } catch (err: any) {
      setError(err.message || "Error al guardar el registro.");
    }
  };

  const handleDeleteEmision = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar este registro de emisión de carbono?")) return;

    try {
      setError(null);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/huella/emisiones/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${(session as any).accessToken}` },
      });

      if (res.ok) {
        await fetchData();
      } else {
        throw new Error("Error al eliminar el registro.");
      }
    } catch (err: any) {
      setError(err.message || "Error en la operación");
    }
  };

  // Real-time calculation formula display
  const calculatedCO2e = alcance === 0 ? 0 : (cantidad * factorEmision);
  const calculatedCO2eTons = (unidad.toLowerCase().includes("t") ? calculatedCO2e : calculatedCO2e / 1000.0).toFixed(4);

  // SVG Donut Chart helper calculations
  const scopesData = resumen?.desglose_alcances || { "Alcance 1": 0, "Alcance 2": 0, "Alcance 3": 0 };
  const scopesPct = resumen?.porcentajes_alcances || { "Alcance 1": 0, "Alcance 2": 0, "Alcance 3": 0 };
  const totalVal = resumen?.total_co2e || 0;
  
  let currentAngle = 0;
  const donutSlices = Object.entries(scopesData).map(([key, val]) => {
    const pct = totalVal > 0 ? (val / totalVal) * 100 : 0;
    const angle = totalVal > 0 ? (val / totalVal) * 360 : 0;
    const startAngle = currentAngle;
    currentAngle += angle;
    
    // Convert polar coordinates to Cartesian coordinates for SVG path drawing
    const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
      const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
      return {
        x: centerX + radius * Math.cos(angleInRadians),
        y: centerY + radius * Math.sin(angleInRadians)
      };
    };

    const getArcPath = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
      const start = polarToCartesian(x, y, radius, endAngle);
      const end = polarToCartesian(x, y, radius, startAngle);
      const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
      return [
        "M", start.x, start.y,
        "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
      ].join(" ");
    };

    const colorMap: { [key: string]: string } = {
      "Alcance 1": "#EF4444", // Red
      "Alcance 2": "#F59E0B", // Amber
      "Alcance 3": "#3B82F6"  // Blue
    };

    return {
      key,
      val,
      pct,
      path: getArcPath(100, 100, 70, startAngle, startAngle + angle),
      color: colorMap[key] || "#10B981"
    };
  });

  return (
    <div className="space-y-8 animate-fade-in text-zinc-900 dark:text-zinc-50 font-sans">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight font-heading flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/20">
              <Leaf className="w-8 h-8 animate-pulse" />
            </div>
            M10/11/12 · Inventario & Huella de Carbono SGI
          </h1>
          <p className="text-muted-foreground text-sm mt-1.5 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Monitoreo y cálculo estructurado de GEI bajo directrices de la norma ISO 14064 y GHG Protocol.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition shadow-[0_4px_20px_-4px_rgba(16,185,129,0.3)] hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4.5 h-4.5" />
          Registrar Medición de Carbono
        </button>
      </div>

      {error && (
        <div className="bg-red-500/5 dark:bg-red-950/10 border border-red-500/20 p-4 rounded-xl text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
          <Info className="w-5 h-5 flex-shrink-0" />
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card Total CO2e */}
        <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-300">
            <Leaf className="w-24 h-24 text-emerald-500" />
          </div>
          <div className="space-y-2">
            <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">Huella de Carbono Total</span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
                {resumen?.total_co2e.toFixed(2) || "0.00"}
              </span>
              <span className="text-xs font-semibold text-muted-foreground">tCO₂e</span>
            </div>
          </div>
          <div className="border-t border-border pt-4 mt-6 flex items-center gap-2 text-xs text-muted-foreground">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span>Consolidado general del periodo</span>
          </div>
        </div>

        {/* Card Scope 1 */}
        <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-red-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
            <Flame className="w-24 h-24 text-red-500" />
          </div>
          <div className="space-y-2">
            <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-red-500" /> Alcance 1 (Directas)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-red-500">
                {scopesData["Alcance 1"]?.toFixed(2) || "0.00"}
              </span>
              <span className="text-xs font-semibold text-muted-foreground">tCO₂e</span>
            </div>
          </div>
          <div className="mt-6 space-y-1.5">
            <div className="flex justify-between text-[10px] text-muted-foreground font-bold">
              <span>CONTRIBUCIÓN</span>
              <span>{scopesPct["Alcance 1"] || "0"}%</span>
            </div>
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-red-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${scopesPct["Alcance 1"] || 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card Scope 2 */}
        <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-amber-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
            <Zap className="w-24 h-24 text-amber-500" />
          </div>
          <div className="space-y-2">
            <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" /> Alcance 2 (Energía)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-amber-500">
                {scopesData["Alcance 2"]?.toFixed(2) || "0.00"}
              </span>
              <span className="text-xs font-semibold text-muted-foreground">tCO₂e</span>
            </div>
          </div>
          <div className="mt-6 space-y-1.5">
            <div className="flex justify-between text-[10px] text-muted-foreground font-bold">
              <span>CONTRIBUCIÓN</span>
              <span>{scopesPct["Alcance 2"] || "0"}%</span>
            </div>
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${scopesPct["Alcance 2"] || 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card Scope 3 */}
        <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-blue-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
            <Truck className="w-24 h-24 text-blue-500" />
          </div>
          <div className="space-y-2">
            <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-blue-500" /> Alcance 3 (Indirectas)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-blue-500">
                {scopesData["Alcance 3"]?.toFixed(2) || "0.00"}
              </span>
              <span className="text-xs font-semibold text-muted-foreground">tCO₂e</span>
            </div>
          </div>
          <div className="mt-6 space-y-1.5">
            <div className="flex justify-between text-[10px] text-muted-foreground font-bold">
              <span>CONTRIBUCIÓN</span>
              <span>{scopesPct["Alcance 3"] || "0"}%</span>
            </div>
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-blue-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${scopesPct["Alcance 3"] || 0}%` }}
              />
            </div>
          </div>
        </div>

      </div>

      {/* Graphs Visual Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Scope distribution donut */}
        <div className="lg:col-span-5 bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-border shadow-sm space-y-6 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-primary uppercase tracking-wider">Desglose por Alcance Normativo</h3>
            <p className="text-xs text-muted-foreground">Distribución proporcional de emisiones de gases de efecto invernadero (tCO₂e).</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-4">
            <div className="relative w-48 h-48 flex-shrink-0">
              {totalVal === 0 ? (
                <svg viewBox="0 0 200 200" className="w-full h-full">
                  <circle cx="100" cy="100" r="70" fill="none" stroke="#E4E4E7" strokeWidth="24" />
                </svg>
              ) : (
                <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
                  {donutSlices.map((slice) => (
                    slice.val > 0 && (
                      <path
                        key={slice.key}
                        d={slice.path}
                        fill="none"
                        stroke={slice.color}
                        strokeWidth="24"
                        className="hover:opacity-85 transition-opacity cursor-pointer"
                      >
                        <title>{`${slice.key}: ${slice.val.toFixed(2)} tCO2e (${slice.pct.toFixed(1)}%)`}</title>
                      </path>
                    )
                  ))}
                </svg>
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white dark:bg-zinc-950 rounded-full m-[34px] border border-border">
                <span className="text-[10px] font-extrabold uppercase text-muted-foreground">Consolidado</span>
                <span className="text-xl font-extrabold tracking-tight text-primary mt-0.5">{totalVal.toFixed(2)}</span>
                <span className="text-[9px] text-muted-foreground font-bold">tCO₂e</span>
              </div>
            </div>

            <div className="flex flex-col gap-3.5 w-full">
              {donutSlices.map((slice) => (
                <div key={slice.key} className="flex items-center justify-between text-xs border-b border-zinc-100 dark:border-zinc-900 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: slice.color }} />
                    <span className="font-semibold text-muted-foreground">{slice.key}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold block">{slice.val.toFixed(2)} t</span>
                    <span className="text-[10px] text-muted-foreground">{slice.pct.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scope temporal bar graph */}
        <div className="lg:col-span-7 bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-border shadow-sm space-y-6 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-primary uppercase tracking-wider">Evolución Mensual de Emisiones</h3>
            <p className="text-xs text-muted-foreground">Histórico cronológico de la huella de carbono acumulada en el tenant.</p>
          </div>

          <div className="h-56 w-full flex items-end justify-between gap-2.5 pt-6 border-b border-zinc-200 dark:border-zinc-800 pb-2">
            {!resumen || resumen.historico_mensual.length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-xs text-muted-foreground italic gap-2 pb-6">
                <Leaf className="w-8 h-8 opacity-20 text-emerald-500" />
                No hay datos históricos registrados para este tenant.
              </div>
            ) : (
              resumen.historico_mensual.map((item) => {
                const maxCO2e = Math.max(...resumen.historico_mensual.map(h => h.co2e), 1.0);
                const barHeightPct = (item.co2e / maxCO2e) * 100;

                return (
                  <div key={item.periodo} className="flex flex-col items-center flex-1 group relative h-full justify-end">
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full mb-2 bg-zinc-900 text-white text-[10px] px-2 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg text-center z-10 font-bold whitespace-nowrap min-w-16">
                      <span className="block text-emerald-400">{item.co2e.toFixed(2)} t</span>
                      <span className="text-[8px] opacity-60 font-medium">{item.periodo}</span>
                    </div>

                    <div className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 dark:bg-emerald-400/5 dark:hover:bg-emerald-400/15 border border-emerald-500/10 rounded-t-lg transition-all duration-300 relative flex items-end overflow-hidden cursor-pointer" style={{ height: `${barHeightPct}%`, minHeight: "4%" }}>
                      <div className="w-full bg-emerald-500 dark:bg-emerald-400 h-full origin-bottom transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300" />
                    </div>
                    <span className="text-[9px] font-extrabold text-muted-foreground uppercase font-mono mt-2 tracking-tighter">
                      {item.periodo.split("-")[1]}/{item.periodo.split("-")[0].substring(2)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Inventory & Records list */}
      <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-border shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-border pb-4">
          <div>
            <h3 className="font-bold text-sm text-primary uppercase tracking-wider flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-500" />
              Inventario Físico de Emisiones
            </h3>
            <p className="text-xs text-muted-foreground">Catálogo de registros declarados y validados en la base de datos.</p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-zinc-500 italic">
            Consultando registros en el esquema de base de datos...
          </div>
        ) : emisiones.length === 0 ? (
          <div className="p-12 text-center text-sm text-zinc-500 bg-zinc-50/50 dark:bg-zinc-900/10 rounded-xl border border-border italic space-y-2">
            <Leaf className="w-10 h-10 text-emerald-500/20 mx-auto" />
            <p>No se registran mediciones de carbono en el inventario actual.</p>
            <p className="text-[10px] text-muted-foreground">Use el botón de la parte superior para registrar consumo energético, combustibles o logística.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-muted/40 text-muted-foreground font-bold border-b border-border text-[10px] uppercase tracking-wider">
                  <th className="p-4">Periodo</th>
                  <th className="p-4">Alcance</th>
                  <th className="p-4">Categoría / Subcategoría</th>
                  <th className="p-4">Fuente</th>
                  <th className="p-4 text-right">Cantidad Registrada</th>
                  <th className="p-4 text-right">CO₂ Equivalente</th>
                  <th className="p-4">Evidencia (DMS)</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {emisiones.map((em) => {
                  const meta = alcancesMeta[em.alcance];
                  const Icon = meta.icon;

                  return (
                    <tr key={em.id} className="hover:bg-muted/10 dark:hover:bg-zinc-900/20 transition-colors">
                      <td className="p-4 font-mono font-bold text-zinc-600 dark:text-zinc-300">
                        {new Date(em.periodo + "T00:00:00").toLocaleDateString("es-ES", { month: "short", year: "numeric" }).toUpperCase()}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-bold text-[9px] uppercase ${meta.bgColor} ${meta.color} border ${meta.borderColor}`}>
                          <Icon className="w-3 h-3" /> {meta.label.split(" ")[0]} {meta.label.split(" ")[1]}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold block">{em.categoria}</span>
                        <span className="text-[10px] text-muted-foreground">{em.subcategoria || "N/A"}</span>
                      </td>
                      <td className="p-4 font-medium text-muted-foreground truncate max-w-[150px]">{em.fuente}</td>
                      <td className="p-4 text-right font-mono font-bold">
                        {Number(em.cantidad).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {em.unidad}
                      </td>
                      <td className="p-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {Number(em.co2_equivalente).toLocaleString("es-ES", { minimumFractionDigits: 4, maximumFractionDigits: 4 })} t
                      </td>
                      <td className="p-4">
                        {em.evidencia_documento_id ? (
                          <div className="flex items-center gap-1.5 text-emerald-600 font-semibold max-w-[150px] truncate" title="Documento enlazado de evidencia">
                            <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>Enlazada</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/40 italic">Ninguna</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleDeleteEmision(em.id)}
                          className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition"
                          title="Eliminar registro"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Modal / Slide-over custom interactive Carbon Calculator */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-zinc-950 border border-border rounded-2xl shadow-2xl overflow-hidden animate-slide-in relative">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-md font-bold flex items-center gap-2 text-emerald-600">
                <Leaf className="w-5 h-5" />
                Calculadora & Medición de Carbono
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-muted rounded-full transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleCreateEmision} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              
              {/* Form Section 1: Period and Scope */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Periodo de la Medición</label>
                  <input
                    type="date"
                    required
                    value={periodoInput}
                    onChange={(e) => setPeriodoInput(e.target.value)}
                    className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Fuente de Emisión</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Planta A, Generador Eléctrico, etc."
                    value={fuente}
                    onChange={(e) => setFuente(e.target.value)}
                    className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Scope Selector */}
              <div className="space-y-1.5 border-t border-border pt-4">
                <label className="text-[10px] font-bold text-zinc-500 uppercase block">Alcance Normativo (GHG Protocol)</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[1, 2, 3].map((sc) => {
                    const ScIcon = alcancesMeta[sc].icon;
                    const meta = alcancesMeta[sc];
                    return (
                      <button
                        key={sc}
                        type="button"
                        onClick={() => setAlcance(sc)}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center cursor-pointer transition-all duration-200 ${
                          alcance === sc
                            ? `${meta.bgColor} border-emerald-500 ${meta.color} font-bold ring-1 ring-emerald-500`
                            : "bg-muted/10 border-border hover:bg-muted/30"
                        }`}
                      >
                        <ScIcon className="w-5 h-5 mb-1" />
                        <span className="text-xs">{meta.label.split(" ")[0]} {meta.label.split(" ")[1]}</span>
                        <span className="text-[8px] font-medium text-muted-foreground uppercase tracking-wider block mt-0.5">
                          {sc === 1 ? "Directas" : sc === 2 ? "Electricidad" : "Logística"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Categories */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border pt-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block">Categoría de Emisión</label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-emerald-500"
                  >
                    {Object.keys(alcancesMeta[alcance].categorias).map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block">Subcategoría y Factor Estándar</label>
                  <select
                    value={subcategoria}
                    onChange={(e) => setSubcategoria(e.target.value)}
                    className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-emerald-500"
                  >
                    {categoria && alcancesMeta[alcance].categorias[categoria] &&
                      Object.keys(alcancesMeta[alcance].categorias[categoria].subcategorias).map((sub) => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))
                    }
                  </select>
                </div>
              </div>

              {/* Quantity, factor and dynamic calculation display */}
              <div className="grid grid-cols-3 gap-4 border-t border-border pt-4 bg-zinc-50 dark:bg-zinc-900/40 p-4 rounded-xl">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block">Cantidad Consumida</label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="0.0001"
                    placeholder="Cantidad..."
                    value={cantidad || ""}
                    onChange={(e) => setCantidad(parseFloat(e.target.value) || 0)}
                    className="w-full text-sm bg-white dark:bg-zinc-950 border border-border rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-emerald-500 font-mono font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block">Unidad de Medida</label>
                  <input
                    type="text"
                    disabled
                    value={unidad}
                    className="w-full text-sm bg-muted/60 border border-border rounded-lg px-3.5 py-2.5 focus:outline-none font-bold text-zinc-500 text-center"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block">FE (kg CO₂e/U)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="FE..."
                    value={factorEmision || ""}
                    onChange={(e) => setFactorEmision(parseFloat(e.target.value) || 0)}
                    className="w-full text-sm bg-white dark:bg-zinc-950 border border-border rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-emerald-500 font-mono font-bold text-center"
                  />
                </div>
              </div>

              {/* Dynamic live calculation feedback */}
              <div className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 p-4 rounded-xl flex items-center justify-between gap-4 font-mono">
                <div className="text-xs">
                  <span className="block opacity-75 uppercase text-[9px] font-bold tracking-wider font-sans mb-0.5">Fórmula de Cálculo</span>
                  <span>({cantidad} {unidad} * {factorEmision} kg CO₂e) {!unidad.toLowerCase().includes("t") && "/ 1000"}</span>
                </div>
                <div className="text-right">
                  <span className="block opacity-75 uppercase text-[9px] font-bold tracking-wider font-sans mb-0.5">Emisión Estimada</span>
                  <span className="text-lg font-bold">{calculatedCO2eTons} tCO₂e</span>
                </div>
              </div>

              {/* Link document evidence option */}
              <div className="grid grid-cols-1 gap-4 border-t border-border pt-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" /> Vinculación de Documento de Evidencia (DMS)
                  </label>
                  <select
                    value={evidenciaDocId}
                    onChange={(e) => setEvidenciaDocId(e.target.value)}
                    className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- No adjuntar evidencia --</option>
                    {documentos.map((doc) => (
                      <option key={doc.id} value={doc.id}>{doc.title} (v{doc.type})</option>
                    ))}
                  </select>
                  <p className="text-[9px] text-muted-foreground">Vincule un documento ya aprobado en el DMS (ej. facturas de servicios, certificados) para justificar auditorías.</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">Notas Adicionales</label>
                <textarea
                  placeholder="Detalles complementarios, notas de auditoría o comentarios..."
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  rows={2}
                  className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Form Action buttons */}
              <div className="pt-4 flex gap-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 text-xs font-bold border border-border rounded-xl hover:bg-muted transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={cantidad <= 0 || factorEmision <= 0 || !fuente}
                  className="flex-1 py-3 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition disabled:opacity-50"
                >
                  Confirmar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
