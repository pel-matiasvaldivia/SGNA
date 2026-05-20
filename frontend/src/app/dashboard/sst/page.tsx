"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { HardHat, Plus, AlertTriangle, ShieldAlert, Activity, CheckCircle2, Clock, MapPin, Users } from "lucide-react";

interface Incidente {
  id: string;
  tipo: string;
  gravedad: string;
  descripcion: string;
  fecha_incidente: string;
  ubicacion: string | null;
  personas_involucradas: string | null;
  estado_investigacion: string;
}

export default function SSTPage() {
  const { data: session } = useSession();
  const [incidentes, setIncidentes] = useState<Incidente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTipo, setNewTipo] = useState("acto_inseguro");
  const [newGravedad, setNewGravedad] = useState("baja");
  const [newDesc, setNewDesc] = useState("");
  const [newUbicacion, setNewUbicacion] = useState("");

  const fetchData = async () => {
    if (!session?.user) return;
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/sst/incidentes`, {
        headers: { Authorization: `Bearer ${(session as any).accessToken}` },
      });
      if (!res.ok) throw new Error("Error fetching incidentes");
      const data = await res.json();
      setIncidentes(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [session]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/sst/incidentes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any).accessToken}`,
        },
        body: JSON.stringify({
          tipo: newTipo,
          gravedad: newGravedad,
          descripcion: newDesc,
          fecha_incidente: new Date().toISOString(),
          ubicacion: newUbicacion || null,
        }),
      });
      if (!res.ok) throw new Error("Error creando incidente");
      setIsModalOpen(false);
      setNewDesc("");
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Bird Pyramid Calculations
  const fatales = incidentes.filter(i => i.tipo === "accidente_fatal").length;
  const tiempoPerdido = incidentes.filter(i => i.tipo === "accidente_con_tiempo_perdido").length;
  const casiAccidente = incidentes.filter(i => i.tipo === "casi_accidente").length;
  const actosInseguros = incidentes.filter(i => i.tipo === "acto_inseguro" || i.tipo === "condicion_insegura").length;

  const total = incidentes.length || 1; // avoid division by zero

  const columns = [
    { id: "reportado", title: "Reportados", color: "bg-red-50 dark:bg-red-950/20 text-red-700" },
    { id: "en_investigacion", title: "En Investigación", color: "bg-amber-50 dark:bg-amber-950/20 text-amber-700" },
    { id: "plan_accion", title: "Plan de Acción", color: "bg-blue-50 dark:bg-blue-950/20 text-blue-700" },
    { id: "cerrado", title: "Cerrados", color: "bg-green-50 dark:bg-green-950/20 text-green-700" },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading flex items-center gap-2">
            <HardHat className="w-8 h-8 text-secondary" /> Seguridad y Salud (ISO 45001)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestión integral de incidentes, actos inseguros y control de riesgos operativos.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-secondary text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:opacity-90 transition shadow-lg"
        >
          <AlertTriangle className="w-4 h-4" /> Reportar Incidente
        </button>
      </div>

      {error && <div className="text-red-500 bg-red-50 p-4 rounded-xl text-sm font-semibold">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bird's Pyramid SVG - WOW Factor */}
        <div className="lg:col-span-1 bg-white dark:bg-zinc-950 border border-border p-6 rounded-2xl shadow-sm flex flex-col items-center justify-center">
          <h3 className="font-bold text-lg mb-6 w-full text-center">Pirámide de Bird (Riesgos SST)</h3>
          <div className="relative w-64 h-64 mb-4">
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl transition-all duration-500">
              {/* Fatales (Top) */}
              <polygon points="50,0 40,25 60,25" fill="#ef4444" className="opacity-90 hover:opacity-100 transition cursor-pointer" />
              <text x="50" y="18" fill="white" fontSize="6" textAnchor="middle" fontWeight="bold">{fatales}</text>
              
              {/* Tiempo Perdido */}
              <polygon points="40,26 30,50 70,50 60,26" fill="#f97316" className="opacity-90 hover:opacity-100 transition cursor-pointer" />
              <text x="50" y="42" fill="white" fontSize="6" textAnchor="middle" fontWeight="bold">{tiempoPerdido}</text>
              
              {/* Casi Accidentes */}
              <polygon points="30,51 20,75 80,75 70,51" fill="#eab308" className="opacity-90 hover:opacity-100 transition cursor-pointer" />
              <text x="50" y="67" fill="white" fontSize="6" textAnchor="middle" fontWeight="bold">{casiAccidente}</text>

              {/* Actos/Condiciones Inseguras (Base) */}
              <polygon points="20,76 10,100 90,100 80,76" fill="#3b82f6" className="opacity-90 hover:opacity-100 transition cursor-pointer" />
              <text x="50" y="92" fill="white" fontSize="6" textAnchor="middle" fontWeight="bold">{actosInseguros}</text>
            </svg>
          </div>
          <div className="w-full space-y-2 text-xs font-semibold text-muted-foreground mt-4">
            <div className="flex justify-between items-center"><span className="text-red-500 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span>Accidentes Fatales</span> <span>1 ideal</span></div>
            <div className="flex justify-between items-center"><span className="text-orange-500 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500"></span>Acc. Tiempo Perdido</span> <span>10</span></div>
            <div className="flex justify-between items-center"><span className="text-yellow-500 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500"></span>Casi Accidentes</span> <span>30</span></div>
            <div className="flex justify-between items-center"><span className="text-blue-500 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span>Actos Inseguros</span> <span>600</span></div>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="lg:col-span-2 bg-muted/20 border border-border p-6 rounded-2xl shadow-inner overflow-x-auto">
          <h3 className="font-bold text-lg mb-6">Investigación y Seguimiento (Kanban)</h3>
          {loading ? (
            <div className="animate-pulse flex gap-4">
              {[1,2,3,4].map(i => <div key={i} className="bg-white/50 h-64 w-64 rounded-xl"></div>)}
            </div>
          ) : (
            <div className="flex gap-4 min-w-max pb-4">
              {columns.map(col => (
                <div key={col.id} className="w-72 flex flex-col gap-3">
                  <div className={`px-4 py-2 rounded-lg font-bold text-sm shadow-sm ${col.color}`}>
                    {col.title} ({incidentes.filter(i => i.estado_investigacion === col.id).length})
                  </div>
                  <div className="flex-1 space-y-3 min-h-[400px]">
                    {incidentes.filter(i => i.estado_investigacion === col.id).map(inc => (
                      <div key={inc.id} className="bg-white dark:bg-zinc-950 p-4 rounded-xl border border-border shadow-sm hover:shadow-md transition cursor-grab">
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${inc.gravedad === 'critica' ? 'bg-red-100 text-red-700' : inc.gravedad === 'alta' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                            {inc.gravedad}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{new Date(inc.fecha_incidente).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm font-semibold mb-3 line-clamp-2">{inc.descripcion}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" /> <span className="truncate">{inc.ubicacion || 'Sin ubicación'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-zinc-950 max-w-md w-full rounded-2xl shadow-2xl p-6 relative">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-rose-600">
              <ShieldAlert className="w-6 h-6" /> Reporte Rápido de Incidente
            </h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Tipo de Evento</label>
                <select value={newTipo} onChange={e => setNewTipo(e.target.value)} className="w-full p-2 border rounded-lg bg-muted/20 text-sm">
                  <option value="acto_inseguro">Acto Inseguro</option>
                  <option value="condicion_insegura">Condición Insegura</option>
                  <option value="casi_accidente">Casi Accidente (Near Miss)</option>
                  <option value="accidente_con_tiempo_perdido">Accidente con Tiempo Perdido (LTI)</option>
                  <option value="accidente_fatal">Accidente Fatal</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Gravedad Percibida</label>
                <select value={newGravedad} onChange={e => setNewGravedad(e.target.value)} className="w-full p-2 border rounded-lg bg-muted/20 text-sm">
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                  <option value="critica">Crítica</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Ubicación / Sector</label>
                <input type="text" required value={newUbicacion} onChange={e => setNewUbicacion(e.target.value)} className="w-full p-2 border rounded-lg bg-muted/20 text-sm" placeholder="Ej: Nave Industrial 2, Pasillo A" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Descripción de los hechos</label>
                <textarea required value={newDesc} onChange={e => setNewDesc(e.target.value)} className="w-full p-2 border rounded-lg bg-muted/20 text-sm h-24" placeholder="Describa qué sucedió, cómo y quiénes estuvieron involucrados..."></textarea>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-muted rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-sm font-bold bg-rose-600 text-white hover:bg-rose-700 rounded-lg shadow-md transition">Reportar Ahora</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
