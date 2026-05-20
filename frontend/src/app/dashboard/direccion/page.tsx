"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { 
  FileSignature, 
  Plus, 
  Trash2, 
  Calendar, 
  Users, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Lock, 
  X,
  FileCheck2,
  ListRestart,
  ArrowRight,
  ShieldAlert,
  Fingerprint
} from "lucide-react";

interface Revision {
  id: string;
  titulo: string;
  fecha_reunion: string;
  asistentes: string;
  entradas_revision: string;
  decisiones_acuerdos: string;
  estado: string; // planificada, cerrada
  firma_responsable_hash: string | null;
}

export default function RevisionDireccionPage() {
  const { data: session } = useSession();
  const [revisiones, setRevisiones] = useState<Revision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected Acta
  const [selectedRevision, setSelectedRevision] = useState<Revision | null>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);

  // Form states - Create
  const [newTitulo, setNewTitulo] = useState("");
  const [newFecha, setNewFecha] = useState("");
  const [newAsistentes, setNewAsistentes] = useState("");
  const [newEntradas, setNewEntradas] = useState(JSON.stringify({
    auditorias: "Resultados satisfactorios de auditorías internas de calidad...",
    capas: "Desvíos de procesos cerrados a tiempo, 90% efectividad...",
    objetivos: "Cumplimiento del 95% en metas operativas del SGI...",
    contexto: "Cambios menores en el marco legal del sector...",
    riesgos: "Matriz de mitigación implementada correctamente..."
  }, null, 2));
  const [newDecisiones, setNewDecisiones] = useState("");

  // Form states - Close/Sign
  const [firmaEmail, setFirmaEmail] = useState("");

  const fetchData = async () => {
    if (!session?.user) return;
    setLoading(true);
    setError(null);
    try {
      const headers = { Authorization: `Bearer ${(session as any).accessToken}` };
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

      const res = await fetch(`${apiUrl}/api/v1/revisiones`, { headers });
      if (!res.ok) throw new Error("Error al obtener las revisiones por la dirección.");
      const data = await res.json();
      setRevisiones(data);

      if (data.length > 0) {
        if (selectedRevision) {
          const updated = data.find((r: Revision) => r.id === selectedRevision.id);
          setSelectedRevision(updated || data[0]);
        } else {
          setSelectedRevision(data[0]);
        }
      } else {
        setSelectedRevision(null);
      }
    } catch (err: any) {
      setError(err.message || "Error al cargar la consola de revisiones.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [session]);

  const handleCreateRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitulo || !newFecha || !newAsistentes || !newEntradas || !newDecisiones) return;

    try {
      setError(null);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/revisiones`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any).accessToken}`,
        },
        body: JSON.stringify({
          titulo: newTitulo,
          fecha_reunion: newFecha,
          asistentes: newAsistentes,
          entradas_revision: newEntradas,
          decisiones_acuerdos: newDecisiones,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Error al planificar la revisión.");
      }

      // Reset & Refresh
      setNewTitulo("");
      setNewFecha("");
      setNewAsistentes("");
      setNewDecisiones("");
      setIsCreateModalOpen(false);
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCloseRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRevision || !firmaEmail) return;

    try {
      setError(null);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/revisiones/${selectedRevision.id}/close`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${(session as any).accessToken}`,
          },
          body: JSON.stringify({
            firma_email: firmaEmail,
          }),
        }
      );

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Error al cerrar formalmente el acta.");
      }

      setFirmaEmail("");
      setIsCloseModalOpen(false);
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteRevision = async (id: string) => {
    if (!confirm("¿Está seguro de que desea eliminar esta revisión planificada?")) return;

    try {
      setError(null);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/revisiones/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${(session as any).accessToken}`,
        },
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Error al eliminar el acta.");
      }

      setSelectedRevision(null);
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Helper parser for SGI inputs structured string/JSON
  const parseInputs = (rawText: string) => {
    try {
      const parsed = JSON.parse(rawText);
      if (typeof parsed === "object" && parsed !== null) {
        return parsed;
      }
    } catch (e) {
      // not JSON, fallback to plain text list
    }
    return {
      "Puntos del Orden del Día / Auditorías & CAPAs / Desempeño SGI": rawText
    };
  };

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-12">
      {/* Top action header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-secondary/15 rounded-2xl flex items-center justify-center border border-secondary/25 shadow-inner">
              <FileSignature className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Revisión por la Dirección</h1>
              <p className="text-sm text-muted-foreground">
                Planifique sesiones gerenciales de revisión de calidad y cierre actas con firmas criptográficas (ISO 9001 Cl. 9.3).
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-secondary text-primary-foreground font-semibold shadow hover:bg-secondary/90 hover:scale-[1.02] active:scale-95 transition-all text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Planificar Reunión</span>
        </button>
      </div>

      {/* Error block */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Ha ocurrido un error:</span> {error}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-medium">Cargando actas de revisión gerencial...</p>
        </div>
      ) : revisiones.length === 0 ? (
        <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-12 text-center max-w-xl mx-auto shadow-2xl">
          <FileSignature className="w-16 h-16 text-zinc-700 mx-auto mb-4 animate-bounce" />
          <h3 className="text-lg font-bold text-white mb-2">Sin Actas de Revisión registradas</h3>
          <p className="text-zinc-500 text-sm mb-6 leading-relaxed">
            Las revisiones periódicas de la dirección gerencial son obligatorias para cumplir con los estándares de control de mejora de ISO 9001:2015.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-secondary text-primary-foreground font-bold shadow hover:bg-secondary/90 transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Planificar Primera Sesión</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Timeline and sidebar lists */}
          <div className="lg:col-span-4 space-y-6">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Sesiones SGI</h3>
            
            <div className="relative pl-6 border-l border-zinc-800 space-y-8">
              {revisiones
                .sort((a, b) => b.fecha_reunion.localeCompare(a.fecha_reunion))
                .map((rev) => {
                  const isSelected = selectedRevision?.id === rev.id;
                  const isClosed = rev.estado === "cerrada";

                  return (
                    <div 
                      key={rev.id} 
                      onClick={() => setSelectedRevision(rev)}
                      className={`relative group cursor-pointer transition-all ${
                        isSelected 
                          ? "bg-secondary/10 border border-secondary/30 p-4 rounded-2xl text-white shadow-lg" 
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      {/* Timeline dot */}
                      <span className={`absolute -left-[31px] top-4 w-3.5 h-3.5 rounded-full border-2 bg-zinc-950 transition-all ${
                        isClosed 
                          ? "border-emerald-500 bg-emerald-500/20" 
                          : "border-amber-500 bg-amber-500/20"
                      } ${isSelected ? "scale-125 ring-4 ring-secondary/25" : ""}`} />

                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-[10px] font-bold text-zinc-500 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {rev.fecha_reunion}
                        </span>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          isClosed 
                            ? "bg-emerald-500/10 text-emerald-400" 
                            : "bg-amber-500/10 text-amber-400"
                        }`}>
                          {rev.estado}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm leading-snug line-clamp-2">{rev.titulo}</h4>
                      <p className="text-xs text-zinc-500 mt-2 line-clamp-1">
                        Asistentes: {rev.asistentes}
                      </p>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Details layout view */}
          {selectedRevision && (
            <div className="lg:col-span-8">
              <div className="bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
                
                {/* Visual cryptographic seal overlay if CLOSED */}
                {selectedRevision.estado === "cerrada" && (
                  <div className="absolute top-4 right-4 md:top-8 md:right-8 bg-emerald-500/10 border border-emerald-500/25 p-3 rounded-2xl flex items-center gap-3 backdrop-blur-md shadow-lg transform rotate-2 max-w-xs z-10">
                    <Fingerprint className="w-10 h-10 text-emerald-400 shrink-0 animate-pulse" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider block">Sello Digital SGI</span>
                      <span className="font-mono text-[9px] text-zinc-400 block truncate">{selectedRevision.firma_responsable_hash}</span>
                      <span className="text-[8px] text-zinc-500 block uppercase font-semibold">ISO 9001 Cl. 9.3 Validated</span>
                    </div>
                  </div>
                )}

                <div className="border-b border-white/5 pb-6 mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-[10px] px-2.5 py-1 rounded-md font-extrabold uppercase tracking-widest ${
                      selectedRevision.estado === "cerrada"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-amber-500/10 text-amber-400"
                    }`}>
                      {selectedRevision.estado === "cerrada" ? "Acta Cerrada y Firmada" : "En Planificación / Abierta"}
                    </span>
                    <span className="text-zinc-500 text-xs font-mono">
                      ID: {selectedRevision.id.substring(0, 8)}...
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white pr-24">{selectedRevision.titulo}</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 text-sm text-zinc-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-zinc-500" />
                      <span>Reunión programada para: <strong className="text-white font-mono">{selectedRevision.fecha_reunion}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-zinc-500" />
                      <span className="truncate">Asistentes: <strong className="text-white">{selectedRevision.asistentes}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Cl. 9.3.2 Inputs list */}
                  <div>
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-secondary" />
                      Entradas para la Revisión (ISO 9001 Cl. 9.3.2)
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(parseInputs(selectedRevision.entradas_revision)).map(([section, value]) => (
                        <div key={section} className="p-4 rounded-xl bg-zinc-950/40 border border-white/5 space-y-1">
                          <span className="text-[10px] font-bold text-secondary uppercase tracking-wider block">
                            {section.replace(/_/g, " ")}
                          </span>
                          <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                            {value as string}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cl. 9.3.3 Decisions & Agreements */}
                  <div className="p-5 rounded-2xl bg-zinc-950/60 border border-white/5 space-y-3">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <FileCheck2 className="w-4 h-4 text-emerald-400" />
                      Decisiones y Acuerdos de la Reunión (ISO 9001 Cl. 9.3.3)
                    </h3>
                    <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line font-medium">
                      {selectedRevision.decisiones_acuerdos}
                    </p>
                  </div>

                  {/* Closing actions block */}
                  <div className="pt-6 border-t border-white/5 flex items-center justify-between gap-4">
                    {selectedRevision.estado === "planificada" ? (
                      <>
                        <div className="text-xs text-zinc-500 flex items-center gap-2 max-w-md">
                          <Lock className="w-4 h-4 text-zinc-600 shrink-0" />
                          <span>
                            Una vez finalizada la sesión de revisión gerencial, cierre el acta formalmente. <strong>Esta acción bloqueará cambios futuros.</strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setIsCloseModalOpen(true)}
                            className="px-5 py-3 rounded-xl bg-emerald-500 text-white font-bold text-xs shadow hover:bg-emerald-600 transition-all flex items-center gap-1.5"
                          >
                            <Fingerprint className="w-4 h-4" />
                            <span>Firmar y Cerrar Acta</span>
                          </button>
                          <button
                            onClick={() => handleDeleteRevision(selectedRevision.id)}
                            className="p-3 rounded-xl bg-zinc-800 text-rose-500 border border-white/5 hover:bg-rose-500/10 hover:border-rose-500/20 hover:text-rose-400 transition-all"
                            title="Eliminar Acta de Reunión"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="w-full flex items-center gap-3 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 text-xs">
                        <CheckCircle className="w-5 h-5 shrink-0" />
                        <div>
                          <strong>Acta bloqueada por sello criptográfico digital del Representante de la Dirección.</strong> Cumple con todos los criterios de no-repudio técnico para auditorías externas ISO 9001.
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: CREATE REVISION */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-secondary" />
                Planificar Reunión de Dirección (SGI)
              </h2>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRevision} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Título de la Sesión *</label>
                  <input
                    type="text"
                    placeholder="Ej: Revisión por la Dirección - Q2 2026"
                    required
                    value={newTitulo}
                    onChange={(e) => setNewTitulo(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/10 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-secondary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Fecha de la Reunión *</label>
                  <input
                    type="date"
                    required
                    value={newFecha}
                    onChange={(e) => setNewFecha(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/10 text-white text-sm focus:outline-none focus:border-secondary transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Nombres/Emails de Asistentes *</label>
                <input
                  type="text"
                  placeholder="Ej: director@empresa.com, gerente.operaciones@empresa.com"
                  required
                  value={newAsistentes}
                  onChange={(e) => setNewAsistentes(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/10 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-secondary transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">
                  Entradas SGI - Objetivos, Desvíos y CAPAs (Formato JSON estructurado)
                </label>
                <textarea
                  required
                  rows={6}
                  value={newEntradas}
                  onChange={(e) => setNewEntradas(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/10 text-white placeholder-zinc-600 text-xs focus:outline-none focus:border-secondary transition-all font-mono"
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  Utilice el formato JSON sugerido para ordenar estructuradamente los reportes operacionales del SGI.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">
                  Decisiones, Acuerdos y Recursos Asignados (ISO 9001 Cl. 9.3.3) *
                </label>
                <textarea
                  placeholder="Escriba los planes estratégicos acordados, asignaciones presupuestarias o cambios planificados para el sistema de gestión..."
                  required
                  rows={4}
                  value={newDecisiones}
                  onChange={(e) => setNewDecisiones(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/10 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-secondary transition-all"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-secondary text-primary-foreground font-semibold text-xs shadow hover:bg-secondary/90 transition-all"
                >
                  Planificar y Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CLOSE AND SIGN */}
      {isCloseModalOpen && selectedRevision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Fingerprint className="w-5 h-5 text-emerald-400" />
                Firma Criptográfica Digital
              </h2>
              <button 
                onClick={() => setIsCloseModalOpen(false)}
                className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs flex gap-3">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <strong>Aviso Legal de Firmas Electrónicas:</strong> Al firmar y cerrar esta sesión de Revisión por la Dirección, declara bajo juramento del SGI que los acuerdos, decisiones y revisiones fueron plasmadas formalmente. <strong>Esta acta quedará permanentemente inalterable y bloqueada.</strong>
              </div>
            </div>

            <form onSubmit={handleCloseRevision} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">
                  Correo Electrónico del Responsable *
                </label>
                <input
                  type="email"
                  placeholder="Ej: director.calidad@empresa.com"
                  required
                  value={firmaEmail}
                  onChange={(e) => setFirmaEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/10 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsCloseModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white font-semibold text-xs shadow hover:bg-emerald-600 transition-all"
                >
                  Confirmar Sello y Firmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
