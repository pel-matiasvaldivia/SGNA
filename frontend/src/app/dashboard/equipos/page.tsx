"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { 
  Sliders, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  Wrench, 
  Calendar, 
  User, 
  FileText, 
  X, 
  Clock, 
  Cpu, 
  Building,
  MapPin,
  ChevronRight,
  ShieldCheck,
  AlertCircle
} from "lucide-react";

interface Documento {
  id: string;
  title: string;
  type: string;
  status: string;
}

interface Calibracion {
  id: string;
  equipo_id: string;
  fecha_calibracion: string;
  resultado: string; // aprobado, rechazado
  patron_utilizado: string | null;
  certificado_documento_id: string | null;
  realizado_por: string;
  comentarios: string | null;
}

interface Equipo {
  id: string;
  codigo: string;
  nombre: string;
  marca: string | null;
  modelo: string | null;
  numero_serie: string | null;
  ubicacion: string | null;
  frecuencia_calibracion_meses: number;
  fecha_ultima_calibracion: string | null;
  fecha_proxima_calibracion: string | null;
  estado: string; // operativo, vencido, fuera_servicio
  responsable_id: string | null;
  calibraciones: Calibracion[];
}

export default function EquiposCalibracionPage() {
  const { data: session } = useSession();
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected Equipment for drawer
  const [selectedEquipo, setSelectedEquipo] = useState<Equipo | null>(null);

  // Modals
  const [isEquipoModalOpen, setIsEquipoModalOpen] = useState(false);
  const [isCalibrarModalOpen, setIsCalibrarModalOpen] = useState(false);

  // Form states - Equipo Create
  const [newCodigo, setNewCodigo] = useState("");
  const [newNombre, setNewNombre] = useState("");
  const [newMarca, setNewMarca] = useState("");
  const [newModelo, setNewModelo] = useState("");
  const [newSerie, setNewSerie] = useState("");
  const [newUbicacion, setNewUbicacion] = useState("");
  const [newFrecuencia, setNewFrecuencia] = useState<number>(12);

  // Form states - Calibrar
  const [newCalFecha, setNewCalFecha] = useState("");
  const [newCalResultado, setNewCalResultado] = useState("aprobado");
  const [newCalPatron, setNewCalPatron] = useState("");
  const [newCalCertificadoId, setNewCalCertificadoId] = useState("");
  const [newCalRealizadoPor, setNewCalRealizadoPor] = useState("");
  const [newCalComentarios, setNewCalComentarios] = useState("");

  const fetchData = async () => {
    if (!session?.user) return;
    setLoading(true);
    setError(null);
    try {
      const headers = { Authorization: `Bearer ${(session as any).accessToken}` };
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

      // 1. Fetch Equipos
      const resEquipos = await fetch(`${apiUrl}/api/v1/equipos/`, { headers });
      if (!resEquipos.ok) throw new Error("Error al obtener el inventario de equipos.");
      const dataEquipos = await resEquipos.json();
      setEquipos(dataEquipos);

      // Update selected equipment
      if (dataEquipos.length > 0) {
        if (selectedEquipo) {
          const updated = dataEquipos.find((e: Equipo) => e.id === selectedEquipo.id);
          setSelectedEquipo(updated || dataEquipos[0]);
        } else {
          setSelectedEquipo(dataEquipos[0]);
        }
      } else {
        setSelectedEquipo(null);
      }

      // 2. Fetch DMS Documents for linking certificates
      try {
        const resDocs = await fetch(`${apiUrl}/api/v1/documents`, { headers });
        if (resDocs.ok) {
          const dataDocs = await resDocs.json();
          // Filter evidence or approved documents if necessary
          setDocumentos(dataDocs);
        }
      } catch (docErr) {
        console.warn("No se pudieron cargar los documentos del DMS", docErr);
      }

    } catch (err: any) {
      setError(err.message || "Error al cargar la consola de calibración.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [session]);

  const handleCreateEquipo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCodigo || !newNombre || newFrecuencia <= 0) return;

    try {
      setError(null);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/equipos/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any).accessToken}`,
        },
        body: JSON.stringify({
          codigo: newCodigo,
          nombre: newNombre,
          marca: newMarca || null,
          modelo: newModelo || null,
          numero_serie: newSerie || null,
          ubicacion: newUbicacion || null,
          frecuencia_calibracion_meses: newFrecuencia,
          estado: "operativo"
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Error al registrar el equipo.");
      }

      // Reset & Refresh
      setNewCodigo("");
      setNewNombre("");
      setNewMarca("");
      setNewModelo("");
      setNewSerie("");
      setNewUbicacion("");
      setNewFrecuencia(12);
      setIsEquipoModalOpen(false);
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCalibrateEquipo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEquipo || !newCalFecha || !newCalRealizadoPor) return;

    try {
      setError(null);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/equipos/${selectedEquipo.id}/calibrar`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${(session as any).accessToken}`,
          },
          body: JSON.stringify({
            fecha_calibracion: new Date(newCalFecha).toISOString(),
            resultado: newCalResultado,
            patron_utilizado: newCalPatron || null,
            certificado_documento_id: newCalCertificadoId || null,
            realizado_por: newCalRealizadoPor,
            comentarios: newCalComentarios || null,
          }),
        }
      );

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Error al registrar la calibración.");
      }

      // Reset & Refresh
      setNewCalFecha("");
      setNewCalResultado("aprobado");
      setNewCalPatron("");
      setNewCalCertificadoId("");
      setNewCalRealizadoPor("");
      setNewCalComentarios("");
      setIsCalibrarModalOpen(false);
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Status and Semaphores
  const getStatusColor = (estado: string, proxCal: string | null) => {
    if (estado === "fuera_servicio") {
      return { text: "text-zinc-400", bg: "bg-zinc-800/80 border-zinc-700", label: "Fuera de Servicio" };
    }
    if (estado === "vencido") {
      return { text: "text-rose-400 animate-pulse", bg: "bg-rose-500/10 border-rose-500/20", label: "Calibración Vencida" };
    }

    if (proxCal) {
      const remainingDays = Math.ceil((new Date(proxCal).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      if (remainingDays <= 0) {
        return { text: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20", label: "Calibración Vencida" };
      }
      if (remainingDays <= 30) {
        return { text: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", label: `Próximo a Vencer (${remainingDays}d)` };
      }
      return { text: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", label: `Vigente (${remainingDays}d restantes)` };
    }

    return { text: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", label: "Operativo (Sin Calibrar)" };
  };

  // Metrics calculations
  const totalEquipos = equipos.length;
  const calibrados = equipos.filter(e => e.estado === "operativo" && e.fecha_proxima_calibracion && new Date(e.fecha_proxima_calibracion) > new Date()).length;
  const vencidos = equipos.filter(e => e.estado === "vencido" || (e.fecha_proxima_calibracion && new Date(e.fecha_proxima_calibracion) <= new Date())).length;
  const fueraServicio = equipos.filter(e => e.estado === "fuera_servicio").length;

  const complianceRate = totalEquipos > 0 ? Math.round((calibrados / (totalEquipos - fueraServicio)) * 100) : 100;

  // Custom Semicircular SVG Gauge rendering
  const renderSVGGauge = (percent: number) => {
    // Math coordinates for Gauge needle
    // percent: 0 to 100
    // Angle varies from -180 deg (0%) to 0 deg (100%)
    const needleAngle = -180 + (percent / 100) * 180;
    
    // Gauge color gradient stops based on level
    let gaugeColor = "#10b981"; // green
    if (percent < 50) gaugeColor = "#ef4444"; // red
    else if (percent < 80) gaugeColor = "#f59e0b"; // yellow

    return (
      <div className="relative bg-zinc-950/20 backdrop-blur-md rounded-2xl border border-white/5 p-6 shadow-xl overflow-hidden flex flex-col items-center justify-center">
        <h4 className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-4">
          Conformidad General de Calibración
        </h4>
        <div className="relative w-48 h-28 overflow-hidden flex items-end justify-center">
          <svg width="190" height="120" viewBox="0 0 200 120" className="overflow-visible select-none">
            <defs>
              <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>

            {/* Gray Background Arc */}
            <path 
              d="M 30,110 A 70,70 0 0,1 170,110" 
              fill="none" 
              stroke="rgba(255,255,255,0.06)" 
              strokeWidth="14" 
              strokeLinecap="round" 
            />

            {/* Compliant Color Gradient Arc */}
            <path 
              d="M 30,110 A 70,70 0 0,1 170,110" 
              fill="none" 
              stroke="url(#gaugeGrad)" 
              strokeWidth="14" 
              strokeLinecap="round" 
              strokeDasharray="220" 
              strokeDashoffset={220 - (percent / 100) * 220}
              className="transition-all duration-1000 ease-out"
            />

            {/* Center Pin */}
            <circle cx="100" cy="110" r="7" fill="#18181b" stroke="#ffffff" strokeWidth="2.5" />

            {/* Needles rotating */}
            <line 
              x1="100" 
              y1="110" 
              x2="100" 
              y2="50" 
              stroke="#ffffff" 
              strokeWidth="3.5" 
              strokeLinecap="round"
              className="transition-transform duration-1000 ease-out origin-[100px_110px]"
              style={{ transform: `rotate(${needleAngle}deg)` }}
            />
          </svg>
          
          <div className="absolute bottom-0 text-center">
            <span className="text-3xl font-extrabold text-white block">{percent}%</span>
            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Calibrados</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-12">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-secondary/15 rounded-2xl flex items-center justify-center border border-secondary/25 shadow-inner">
              <Sliders className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Calibración e Instrumentos</h1>
              <p className="text-sm text-muted-foreground">
                Gestione la calibración y validez de sus equipos de medición bajo Cláusula 7.1.5 de ISO 9001:2015.
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsEquipoModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-secondary text-primary-foreground font-semibold shadow hover:bg-secondary/90 hover:scale-[1.02] active:scale-95 transition-all text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Ingresar Equipo</span>
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

      {/* Dashboard analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Stats summary cards */}
          <div className="bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-white/5 p-6 shadow flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-zinc-500 block uppercase font-bold tracking-wider">Equipos en Inventario</span>
              <span className="text-2xl font-bold block text-white mt-1">{totalEquipos}</span>
            </div>
          </div>

          <div className="bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-white/5 p-6 shadow flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-zinc-500 block uppercase font-bold tracking-wider">Calibración Vigente</span>
              <span className="text-2xl font-bold block text-white mt-1">{calibrados}</span>
            </div>
          </div>

          <div className="bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-white/5 p-6 shadow flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <span className="text-xs text-zinc-500 block uppercase font-bold tracking-wider">Calibración Vencida</span>
              <span className="text-2xl font-bold block text-white mt-1">{vencidos}</span>
            </div>
          </div>

          <div className="bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-white/5 p-6 shadow flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-zinc-500 block uppercase font-bold tracking-wider">Fuera de Servicio</span>
              <span className="text-2xl font-bold block text-white mt-1">{fueraServicio}</span>
            </div>
          </div>
        </div>

        {/* Custom SVG Gauge component */}
        <div className="lg:col-span-4">
          {renderSVGGauge(complianceRate)}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-medium">Cargando inventario de equipos del SGI...</p>
        </div>
      ) : equipos.length === 0 ? (
        <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-12 text-center max-w-xl mx-auto shadow-2xl">
          <Wrench className="w-16 h-16 text-zinc-700 mx-auto mb-4 animate-bounce" />
          <h3 className="text-lg font-bold text-white mb-2">No se han ingresado equipos de medición</h3>
          <p className="text-zinc-500 text-sm mb-6 leading-relaxed">
            Registre balanzas, calibradores, termómetros u otros instrumentos del negocio para organizar su control metrológico sistemático.
          </p>
          <button
            onClick={() => setIsEquipoModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-secondary text-primary-foreground font-bold shadow hover:bg-secondary/90 transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Ingresar Primer Equipo</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Equipment List table grid */}
          <div className="lg:col-span-8 space-y-4">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Inventario General</h3>
            <div className="bg-zinc-900/30 backdrop-blur-md border border-white/5 rounded-3xl shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-white/5 text-zinc-400 font-bold border-b border-white/5 uppercase tracking-wider text-[10px]">
                      <th className="p-4">Código</th>
                      <th className="p-4">Instrumento / Nombre</th>
                      <th className="p-4">Marca y Modelo</th>
                      <th className="p-4">Ubicación</th>
                      <th className="p-4">Estado</th>
                      <th className="p-4 text-right">Detalle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-zinc-300">
                    {equipos.map((e) => {
                      const isSelected = selectedEquipo?.id === e.id;
                      const stats = getStatusColor(e.estado, e.fecha_proxima_calibracion);
                      return (
                        <tr 
                          key={e.id} 
                          onClick={() => setSelectedEquipo(e)}
                          className={`hover:bg-white/5 transition-colors cursor-pointer ${
                            isSelected ? "bg-secondary/5 text-white font-semibold" : ""
                          }`}
                        >
                          <td className="p-4 font-mono font-bold">
                            <span className="bg-white/10 px-2 py-0.5 rounded text-white text-[10px]">
                              {e.codigo}
                            </span>
                          </td>
                          <td className="p-4 font-bold text-white text-sm">{e.nombre}</td>
                          <td className="p-4 text-zinc-400">
                            {e.marca || "N/A"} {e.modelo ? `/ ${e.modelo}` : ""}
                          </td>
                          <td className="p-4 text-zinc-400 flex items-center gap-1 mt-1.5">
                            <MapPin className="w-3.5 h-3.5 text-zinc-600" />
                            {e.ubicacion || "Sin ubicar"}
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider ${stats.bg} ${stats.text}`}>
                              {stats.label}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <ChevronRight className="w-4 h-4 text-zinc-500 ml-auto" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Drawer Detail */}
          {selectedEquipo && (
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-3xl p-6 shadow-2xl space-y-6">
                <div className="border-b border-white/5 pb-4">
                  <span className="font-mono text-xs font-extrabold bg-secondary text-primary-foreground px-2 py-0.5 rounded">
                    {selectedEquipo.codigo}
                  </span>
                  <h2 className="text-lg font-bold text-white mt-2">{selectedEquipo.nombre}</h2>
                  <p className="text-xs text-zinc-500 mt-1">
                    Número de Serie: <span className="text-zinc-300 font-mono">{selectedEquipo.numero_serie || "Sin registrar"}</span>
                  </p>
                </div>

                {/* Device summary list */}
                <div className="space-y-4 text-xs">
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-zinc-500">Intervalo Calibración:</span>
                    <span className="text-white font-semibold">{selectedEquipo.frecuencia_calibracion_meses} meses</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-zinc-500">Última Calibración:</span>
                    <span className="text-white font-semibold">
                      {selectedEquipo.fecha_ultima_calibracion 
                        ? new Date(selectedEquipo.fecha_ultima_calibracion).toLocaleDateString("es-ES") 
                        : "No calibrado"}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-zinc-500">Próximo Vencimiento:</span>
                    <span className="text-rose-400 font-semibold font-mono">
                      {selectedEquipo.fecha_proxima_calibracion 
                        ? new Date(selectedEquipo.fecha_proxima_calibracion).toLocaleDateString("es-ES") 
                        : "N/A"}
                    </span>
                  </div>
                </div>

                {/* Action button */}
                {selectedEquipo.estado !== "fuera_servicio" && (
                  <button
                    onClick={() => setIsCalibrarModalOpen(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-500 text-white font-semibold text-xs shadow hover:bg-emerald-600 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Registrar Calibración / Controles</span>
                  </button>
                )}

                {/* HISTORIAL DE CALIBRACIONES */}
                <div className="space-y-3 pt-4 border-t border-white/5">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-secondary" />
                    Historial de Ensayos ({selectedEquipo.calibraciones?.length || 0})
                  </h4>
                  
                  {(!selectedEquipo.calibraciones || selectedEquipo.calibraciones.length === 0) ? (
                    <p className="text-zinc-500 text-xs italic">Aún no se han logueado controles ni calibraciones.</p>
                  ) : (
                    <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                      {selectedEquipo.calibraciones.map((cal) => {
                        const isApp = cal.resultado === "aprobado";
                        // Find document title in docs
                        const certDoc = documentos.find(d => d.id === cal.certificado_documento_id);

                        return (
                          <div 
                            key={cal.id} 
                            className={`p-3 rounded-xl border ${
                              isApp 
                                ? "bg-emerald-500/5 border-emerald-500/10" 
                                : "bg-rose-500/5 border-rose-500/10"
                            }`}
                          >
                            <div className="flex justify-between items-center mb-1 text-xs">
                              <span className="font-semibold text-zinc-300">
                                {new Date(cal.fecha_calibracion).toLocaleDateString("es-ES")}
                              </span>
                              <span className={`font-bold text-[9px] uppercase tracking-wider ${isApp ? "text-emerald-400" : "text-rose-400"}`}>
                                {cal.resultado}
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-500">Realizado por: <span className="text-zinc-300">{cal.realizado_por}</span></p>
                            {cal.patron_utilizado && (
                              <p className="text-[10px] text-zinc-500">Patrón: <span className="text-zinc-400 italic">{cal.patron_utilizado}</span></p>
                            )}
                            {certDoc && (
                              <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-1.5 text-[10px] text-secondary">
                                <FileText className="w-3.5 h-3.5 text-secondary" />
                                <span className="font-semibold truncate" title={certDoc.title}>{certDoc.title}</span>
                              </div>
                            )}
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

      {/* MODAL: REGISTRAR EQUIPO */}
      {isEquipoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Wrench className="w-5 h-5 text-secondary" />
                Ingresar Equipo / Instrumento
              </h2>
              <button 
                onClick={() => setIsEquipoModalOpen(false)}
                className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEquipo} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Código Interno *</label>
                  <input
                    type="text"
                    placeholder="Ej: BAL-01"
                    required
                    value={newCodigo}
                    onChange={(e) => setNewCodigo(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/10 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Frecuencia (Meses) *</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="12"
                    required
                    value={newFrecuencia || ""}
                    onChange={(e) => setNewFrecuencia(parseInt(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/10 text-white text-sm focus:outline-none focus:border-secondary transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Nombre / Instrumento *</label>
                <input
                  type="text"
                  placeholder="Ej: Balanza Analítica Digital de Alta Precisión"
                  required
                  value={newNombre}
                  onChange={(e) => setNewNombre(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/10 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Marca</label>
                  <input
                    type="text"
                    placeholder="Ej: Ohaus"
                    value={newMarca}
                    onChange={(e) => setNewMarca(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/10 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Modelo</label>
                  <input
                    type="text"
                    placeholder="Ej: Pioneer PX"
                    value={newModelo}
                    onChange={(e) => setNewModelo(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/10 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Nº de Serie</label>
                  <input
                    type="text"
                    placeholder="Ej: SN-4929420-OH"
                    value={newSerie}
                    onChange={(e) => setNewSerie(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/10 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Ubicación Física</label>
                  <input
                    type="text"
                    placeholder="Ej: Laboratorio Control de Calidad"
                    value={newUbicacion}
                    onChange={(e) => setNewUbicacion(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/10 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsEquipoModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-secondary text-primary-foreground font-bold text-xs shadow hover:bg-secondary/90 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Registrar Equipo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR CALIBRACION */}
      {isCalibrarModalOpen && selectedEquipo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-secondary" />
                Registrar Calibración: {selectedEquipo.codigo}
              </h2>
              <button 
                onClick={() => setIsCalibrarModalOpen(false)}
                className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCalibrateEquipo} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Fecha Ensayo *</label>
                  <input
                    type="date"
                    required
                    value={newCalFecha}
                    onChange={(e) => setNewCalFecha(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/10 text-white text-sm focus:outline-none focus:border-secondary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Resultado *</label>
                  <select
                    value={newCalResultado}
                    onChange={(e) => setNewCalResultado(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/10 text-white text-sm focus:outline-none focus:border-secondary transition-all"
                  >
                    <option value="aprobado">Aprobado / Conforme</option>
                    <option value="rechazado">Rechazado / Fuera Tolerancia</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Realizado por (Laboratorio/Técnico) *</label>
                <input
                  type="text"
                  placeholder="Ej: INTI / Laboratorio Metrológico Externo S.A."
                  required
                  value={newCalRealizadoPor}
                  onChange={(e) => setNewCalRealizadoPor(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/10 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Patrón Utilizado de Referencia</label>
                <input
                  type="text"
                  placeholder="Ej: Juego de Pesas Clase E2"
                  value={newCalPatron}
                  onChange={(e) => setNewCalPatron(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/10 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
                />
              </div>

              {/* DMS CERTIFICATE SELECTOR */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Certificado Oficial (DMS)</label>
                <select
                  value={newCalCertificadoId}
                  onChange={(e) => setNewCalCertificadoId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/10 text-white text-sm focus:outline-none focus:border-secondary transition-all"
                >
                  <option value="">-- No vincular documento del DMS --</option>
                  {documentos.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title} ({d.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Comentarios Adicionales</label>
                <textarea
                  placeholder="Ingrese anotaciones, desviaciones o hallazgos durante el ensayo metrológico..."
                  rows={2}
                  value={newCalComentarios}
                  onChange={(e) => setNewCalComentarios(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/10 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsCalibrarModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-secondary text-primary-foreground font-bold text-xs shadow hover:bg-secondary/90 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Loguear Calibración
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
