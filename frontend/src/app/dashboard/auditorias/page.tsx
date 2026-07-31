"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  FileSearch,
  Plus,
  Trash2,
  Calendar,
  ShieldAlert,
  CheckCircle,
  Clock,
  Compass,
  AlertTriangle,
  Award,
  UserCheck,
  MapPin,
  User as UserIcon,
  Smartphone,
  ListChecks,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface Programa {
  id: string;
  titulo: string;
  objetivos: string;
  alcance: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: string;
}

interface Hallazgo {
  id: string;
  descripcion: string;
  clasificacion: string;
  clausula_referencia: string;
  estado: string;
  programa_id: string;
}

interface TenantUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

interface Asignacion {
  id: string;
  programa_id: string;
  programa_titulo?: string | null;
  auditor_id: string;
  auditor_nombre: string;
  auditor_email: string;
  area: string;
  norma?: string | null;
  fecha_programada: string;
  estado: string;
  notas?: string | null;
  total_puntos?: number | null;
  puntos_respondidos?: number | null;
}

export default function AuditoriasPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;
  // Cualquiera que llegue a esta página tiene el módulo "auditorias" (lo garantiza
  // el layout + el backend), por lo que puede gestionar: auditor líder, supervisor
  // o admin. El backend igualmente exige el módulo en cada endpoint de gestión.
  const canAssign = userRole !== "auditor";
  const [activeTab, setActiveTab] = useState("programas");

  // Programas state
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [newProgTitulo, setNewProgTitulo] = useState("");
  const [newProgObjetivos, setNewProgObjetivos] = useState("");
  const [newProgAlcance, setNewProgAlcance] = useState("");
  const [newProgInicio, setNewProgInicio] = useState("");
  const [newProgFin, setNewProgFin] = useState("");
  const [newProgEstado, setNewProgEstado] = useState("planificado");

  // Hallazgos state
  const [hallazgos, setHallazgos] = useState<Hallazgo[]>([]);
  const [newHallazgoDesc, setNewHallazgoDesc] = useState("");
  const [newHallazgoClas, setNewHallazgoClas] = useState("no_conformidad_menor");
  const [newHallazgoClausula, setNewHallazgoClausula] = useState("");
  const [newHallazgoEstado, setNewHallazgoEstado] = useState("abierto");
  const [newHallazgoProgId, setNewHallazgoProgId] = useState("");

  // Asignaciones state (auditor líder -> auditor de campo)
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [tenantUsers, setTenantUsers] = useState<TenantUser[]>([]);
  const [newAsigProgId, setNewAsigProgId] = useState("");
  const [newAsigAuditor, setNewAsigAuditor] = useState("");
  const [newAsigArea, setNewAsigArea] = useState("");
  const [newAsigNorma, setNewAsigNorma] = useState("ISO 9001");
  const [newAsigFecha, setNewAsigFecha] = useState("");
  const [newAsigNotas, setNewAsigNotas] = useState("");

  // Editor de checklist manual (armar preguntas para una asignación)
  const [openChecklist, setOpenChecklist] = useState<string | null>(null);
  const [puntos, setPuntos] = useState<any[]>([]);
  const [loadingPuntos, setLoadingPuntos] = useState(false);
  const [newPuntoRef, setNewPuntoRef] = useState("");
  const [newPuntoPregunta, setNewPuntoPregunta] = useState("");

  useEffect(() => {
    if (session?.user) {
      fetchProgramas();
      fetchHallazgos();
      fetchAsignaciones();
      if (canAssign) fetchTenantUsers();
    }
  }, [session]);

  const fetchProgramas = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/auditorias/programas`, {
        headers: { Authorization: `Bearer ${(session as any).accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProgramas(data);
        if (data.length > 0 && !newHallazgoProgId) {
          setNewHallazgoProgId(data[0].id);
        }
        if (data.length > 0 && !newAsigProgId) {
          setNewAsigProgId(data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHallazgos = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/auditorias/hallazgos`, {
        headers: { Authorization: `Bearer ${(session as any).accessToken}` },
      });
      if (res.ok) setHallazgos(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAsignaciones = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/auditorias/asignaciones`, {
        headers: { Authorization: `Bearer ${(session as any).accessToken}` },
      });
      if (res.ok) setAsignaciones(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTenantUsers = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/users/`, {
        headers: { Authorization: `Bearer ${(session as any).accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTenantUsers(data);
        if (data.length > 0 && !newAsigAuditor) setNewAsigAuditor(data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateAsignacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAsigProgId || !newAsigAuditor || !newAsigArea || !newAsigFecha) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/auditorias/asignaciones`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any).accessToken}`,
        },
        body: JSON.stringify({
          programa_id: newAsigProgId,
          auditor_id: newAsigAuditor,
          area: newAsigArea,
          norma: newAsigNorma || null,
          fecha_programada: newAsigFecha,
          notas: newAsigNotas || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAsignaciones((prev) => [...prev, data]);
        setNewAsigArea("");
        setNewAsigFecha("");
        setNewAsigNotas("");
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || "No se pudo crear la asignación.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAsignacion = async (id: string) => {
    if (!confirm("¿Desea eliminar esta asignación de auditoría?")) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/auditorias/asignaciones/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${(session as any).accessToken}` },
      });
      if (res.ok) setAsignaciones((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // ---- Checklist manual (puntos de control de una asignación) ----
  const authHeaders = () => ({ Authorization: `Bearer ${(session as any).accessToken}` });

  const toggleChecklist = async (asigId: string) => {
    if (openChecklist === asigId) { setOpenChecklist(null); return; }
    setOpenChecklist(asigId);
    setPuntos([]);
    setNewPuntoRef("");
    setNewPuntoPregunta("");
    setLoadingPuntos(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/auditorias/asignaciones/${asigId}/puntos`, {
        headers: authHeaders(),
      });
      if (res.ok) setPuntos(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPuntos(false);
    }
  };

  const addPunto = async (asigId: string, e: React.FormEvent) => {
    e.preventDefault();
    const pregunta = newPuntoPregunta.trim();
    if (!pregunta) return;
    const orden = puntos.length + 1;
    const clausula = newPuntoRef.trim() || `Ítem ${orden}`;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/auditorias/asignaciones/${asigId}/puntos`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ clausula, pregunta, orden }),
      });
      if (res.ok) {
        const nuevo = await res.json();
        setPuntos((prev) => [...prev, nuevo]);
        setNewPuntoRef("");
        setNewPuntoPregunta("");
        setAsignaciones((prev) => prev.map((a) => a.id === asigId ? { ...a, total_puntos: (a.total_puntos || 0) + 1 } : a));
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || "No se pudo agregar la pregunta.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deletePunto = async (puntoId: string, asigId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/auditorias/puntos/${puntoId}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (res.ok || res.status === 204) {
        setPuntos((prev) => prev.filter((p) => p.id !== puntoId));
        setAsignaciones((prev) => prev.map((a) => a.id === asigId ? { ...a, total_puntos: Math.max(0, (a.total_puntos || 1) - 1) } : a));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreatePrograma = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProgTitulo || !newProgInicio || !newProgFin) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/auditorias/programas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any).accessToken}`,
        },
        body: JSON.stringify({
          titulo: newProgTitulo,
          objetivos: newProgObjetivos,
          alcance: newProgAlcance,
          fecha_inicio: newProgInicio,
          fecha_fin: newProgFin,
          estado: newProgEstado,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setProgramas((prev) => [...prev, data]);
        if (!newHallazgoProgId) {
          setNewHallazgoProgId(data.id);
        }
        setNewProgTitulo("");
        setNewProgObjetivos("");
        setNewProgAlcance("");
        setNewProgInicio("");
        setNewProgFin("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePrograma = async (id: string) => {
    if (!confirm("¿Desea eliminar este programa de auditoría y todos sus hallazgos asociados?")) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/auditorias/programas/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${(session as any).accessToken}` },
      });
      if (res.ok) {
        setProgramas((prev) => prev.filter((p) => p.id !== id));
        setHallazgos((prev) => prev.filter((h) => h.programa_id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateHallazgo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHallazgoDesc || !newHallazgoClausula || !newHallazgoProgId) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/auditorias/hallazgos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any).accessToken}`,
        },
        body: JSON.stringify({
          descripcion: newHallazgoDesc,
          clasificacion: newHallazgoClas,
          clausula_referencia: newHallazgoClausula,
          estado: newHallazgoEstado,
          programa_id: newHallazgoProgId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setHallazgos((prev) => [...prev, data]);
        setNewHallazgoDesc("");
        setNewHallazgoClausula("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteHallazgo = async (id: string) => {
    if (!confirm("¿Desea eliminar este hallazgo?")) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/auditorias/hallazgos/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${(session as any).accessToken}` },
      });
      if (res.ok) {
        setHallazgos((prev) => prev.filter((h) => h.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Helper formatting for classification badges
  const getClassBadge = (clas: string) => {
    switch (clas) {
      case "no_conformidad_mayor":
        return { label: "NC Mayor", color: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/50" };
      case "no_conformidad_menor":
        return { label: "NC Menor", color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50" };
      case "observacion":
        return { label: "Observación", color: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-900/50" };
      default:
        return { label: "Oportunidad de Mejora", color: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/50" };
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-zinc-900 dark:text-zinc-50">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-heading flex items-center gap-2">
          <FileSearch className="w-8 h-8 text-primary" />
          Auditorías Internas
        </h1>
        <p className="text-muted-foreground text-sm">
          Planifique los programas anuales de auditoría del SGI y registre las desviaciones o no conformidades ISO detectadas.
        </p>
      </div>

      {/* Tabs selector */}
      <div className="flex border-b border-border overflow-x-auto gap-1">
        {[
          { id: "programas", name: "Programas de Auditoría", icon: Calendar },
          { id: "asignaciones", name: "Asignaciones de Campo", icon: UserCheck },
          { id: "hallazgos", name: "Hallazgos / Desvíos ISO", icon: ShieldAlert },
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

      {activeTab === "programas" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form */}
          <form onSubmit={handleCreatePrograma} className="lg:col-span-4 bg-white dark:bg-zinc-950 p-6 border border-border rounded-xl shadow-sm space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground border-b pb-2">
              Planificar Auditoría Interna
            </h3>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Título de Auditoría</label>
              <input
                type="text"
                required
                placeholder="Ej: Auditoría Interna Integrada 2026"
                value={newProgTitulo}
                onChange={(e) => setNewProgTitulo(e.target.value)}
                className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Objetivos de Auditoría</label>
              <textarea
                required
                placeholder="Ej: Evaluar la conformidad frente a los requisitos legales e ISO 9001..."
                value={newProgObjetivos}
                onChange={(e) => setNewProgObjetivos(e.target.value)}
                className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary h-20"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Alcance Declarado</label>
              <textarea
                required
                placeholder="Ej: Todos los procesos operativos del site agropecuario..."
                value={newProgAlcance}
                onChange={(e) => setNewProgAlcance(e.target.value)}
                className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary h-20"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Fecha Inicio</label>
                <input
                  type="date"
                  required
                  value={newProgInicio}
                  onChange={(e) => setNewProgInicio(e.target.value)}
                  className="w-full text-xs bg-muted/40 border border-border rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Fecha Fin</label>
                <input
                  type="date"
                  required
                  value={newProgFin}
                  onChange={(e) => setNewProgFin(e.target.value)}
                  className="w-full text-xs bg-muted/40 border border-border rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-primary"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Estado</label>
              <select
                value={newProgEstado}
                onChange={(e) => setNewProgEstado(e.target.value)}
                className="w-full text-xs bg-muted/40 border border-border rounded-lg px-2.5 py-2 focus:outline-none focus:border-primary font-medium"
              >
                <option value="planificado">Planificado</option>
                <option value="en_progreso">En Progreso</option>
                <option value="cerrado">Cerrado</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition shadow-sm"
            >
              Crear Programa
            </button>
          </form>

          {/* List display */}
          <div className="lg:col-span-8 space-y-4">
            {programas.length === 0 ? (
              <div className="bg-white dark:bg-zinc-950 border border-border rounded-xl p-12 text-center text-muted-foreground italic shadow-sm">
                No hay programas de auditoría planificados.
              </div>
            ) : (
              programas.map((p) => (
                <div key={p.id} className="bg-white dark:bg-zinc-950 border border-border rounded-xl p-6 shadow-sm space-y-4 hover:shadow-md transition">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h4 className="font-bold text-base text-primary flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary" />
                        {p.titulo}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[9px] uppercase border ${
                          p.estado === "planificado"
                            ? "text-sky-700 bg-sky-50 border-sky-200"
                            : p.estado === "en_progreso"
                            ? "text-amber-700 bg-amber-50 border-amber-200"
                            : "text-green-700 bg-green-50 border-green-200"
                        }`}>
                          {p.estado}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          Periodo: {new Date(p.fecha_inicio).toLocaleDateString()} al {new Date(p.fecha_fin).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => handleDeletePrograma(p.id)} className="text-red-500 hover:text-red-700 transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
                    <div className="space-y-1">
                      <strong className="block text-primary uppercase text-[9px] tracking-wider">Objetivos del Programa</strong>
                      <p className="text-muted-foreground leading-relaxed italic">{p.objetivos}</p>
                    </div>
                    <div className="space-y-1">
                      <strong className="block text-primary uppercase text-[9px] tracking-wider">Alcance de Evaluación</strong>
                      <p className="text-muted-foreground leading-relaxed italic">{p.alcance}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === "asignaciones" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form: solo auditor líder (admin/superadmin) */}
          {canAssign ? (
            <form onSubmit={handleCreateAsignacion} className="lg:col-span-4 bg-white dark:bg-zinc-950 p-6 border border-border rounded-xl shadow-sm space-y-4 h-fit">
              <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground border-b pb-2 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-primary" /> Asignar Auditoría de Campo
              </h3>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Programa de Auditoría</label>
                <select
                  value={newAsigProgId}
                  onChange={(e) => setNewAsigProgId(e.target.value)}
                  className="w-full text-xs bg-muted/40 border border-border rounded-lg px-2.5 py-2 focus:outline-none focus:border-primary font-medium"
                >
                  {programas.length === 0 ? (
                    <option value="">Debe planificar un programa primero</option>
                  ) : (
                    programas.map((p) => <option key={p.id} value={p.id}>{p.titulo}</option>)
                  )}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Auditor Asignado</label>
                <select
                  value={newAsigAuditor}
                  onChange={(e) => setNewAsigAuditor(e.target.value)}
                  className="w-full text-xs bg-muted/40 border border-border rounded-lg px-2.5 py-2 focus:outline-none focus:border-primary font-medium"
                >
                  {tenantUsers.length === 0 ? (
                    <option value="">No hay usuarios disponibles</option>
                  ) : (
                    tenantUsers.map((u) => (
                      <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>
                    ))
                  )}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Área / Sector a Auditar</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Planta de acopio — Silos 1 a 4"
                  value={newAsigArea}
                  onChange={(e) => setNewAsigArea(e.target.value)}
                  className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Norma / Checklist</label>
                  <select
                    value={newAsigNorma}
                    onChange={(e) => setNewAsigNorma(e.target.value)}
                    className="w-full text-xs bg-muted/40 border border-border rounded-lg px-2.5 py-2 focus:outline-none focus:border-primary font-medium"
                  >
                    <option value="ISO 9001">ISO 9001</option>
                    <option value="ISO 14001">ISO 14001</option>
                    <option value="ISO 45001">ISO 45001</option>
                    <option value="ISO 27001">ISO 27001</option>
                    <option value="">Sin plantilla</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Fecha Programada</label>
                  <input
                    type="date"
                    required
                    value={newAsigFecha}
                    onChange={(e) => setNewAsigFecha(e.target.value)}
                    className="w-full text-xs bg-muted/40 border border-border rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground -mt-1">
                Con una norma se genera un checklist base automático. Con <b>“Sin plantilla”</b> armás
                las preguntas a mano desde cada asignación (botón <b>“Editar preguntas del checklist”</b>).
              </p>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Instrucciones para el Auditor (opcional)</label>
                <textarea
                  placeholder="Ej: Verificar registros de calibración y control de plagas..."
                  value={newAsigNotas}
                  onChange={(e) => setNewAsigNotas(e.target.value)}
                  className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary h-20"
                />
              </div>

              <button
                type="submit"
                disabled={programas.length === 0 || tenantUsers.length === 0}
                className="w-full py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition shadow-sm disabled:opacity-50"
              >
                Asignar Auditoría
              </button>
            </form>
          ) : (
            <div className="lg:col-span-4 bg-white dark:bg-zinc-950 p-6 border border-border rounded-xl shadow-sm h-fit">
              <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground border-b pb-2 flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-primary" /> Auditor de Campo
              </h3>
              <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
                Aquí ves las auditorías que el <strong>auditor líder</strong> asignó a la organización.
                Las tuyas también aparecen en <strong>“Mis Auditorías”</strong>, listas para ejecutar en sitio
                —próximamente desde la app móvil, incluso sin conexión.
              </p>
              <div className="mt-4 flex items-center gap-2 text-[11px] font-semibold text-primary bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
                <Smartphone className="w-4 h-4" /> Ejecución móvil offline — en camino
              </div>
            </div>
          )}

          {/* List of assignments */}
          <div className="lg:col-span-8 space-y-4">
            {asignaciones.length === 0 ? (
              <div className="bg-white dark:bg-zinc-950 border border-border rounded-xl p-12 text-center text-muted-foreground italic shadow-sm">
                No hay auditorías de campo asignadas.
              </div>
            ) : (
              asignaciones.map((a) => {
                const estadoBadge =
                  a.estado === "completada"
                    ? "text-green-700 bg-green-50 border-green-200"
                    : a.estado === "en_progreso"
                    ? "text-amber-700 bg-amber-50 border-amber-200"
                    : "text-sky-700 bg-sky-50 border-sky-200";
                return (
                  <div key={a.id} className="bg-white dark:bg-zinc-950 border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-none">
                          <UserCheck className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-foreground truncate">{a.auditor_nombre}</h4>
                          <p className="text-[11px] text-muted-foreground truncate">{a.auditor_email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-none">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[9px] uppercase border ${estadoBadge}`}>
                          {a.estado.replace("_", " ")}
                        </span>
                        {canAssign && (
                          <button onClick={() => handleDeleteAsignacion(a.id)} className="text-red-500 hover:text-red-700 transition">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 text-xs">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5 text-primary flex-none" />
                        <span className="truncate">{a.area}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5 text-primary flex-none" />
                        <span>{new Date(a.fecha_programada + "T00:00:00").toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <FileSearch className="w-3.5 h-3.5 text-primary flex-none" />
                        <span className="truncate">{a.programa_titulo || "—"}</span>
                      </div>
                    </div>

                    {typeof a.total_puntos === "number" && a.total_puntos > 0 && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-[10px] font-semibold text-muted-foreground mb-1">
                          <span className="inline-flex items-center gap-1.5">
                            {a.norma && <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary">{a.norma}</span>}
                            Checklist
                          </span>
                          <span>{a.puntos_respondidos || 0}/{a.total_puntos} controles</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${Math.round(((a.puntos_respondidos || 0) / a.total_puntos) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {a.notas && (
                      <p className="mt-3 text-xs text-muted-foreground italic border-l-2 border-border pl-3">{a.notas}</p>
                    )}

                    {/* Editor de checklist manual */}
                    {canAssign && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <button
                          onClick={() => toggleChecklist(a.id)}
                          className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
                        >
                          <ListChecks className="w-4 h-4" />
                          {openChecklist === a.id ? "Cerrar checklist" : "Editar preguntas del checklist"}
                          <span className="text-muted-foreground font-normal">({a.total_puntos || 0})</span>
                          {openChecklist === a.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>

                        {openChecklist === a.id && (
                          <div className="mt-3 space-y-3">
                            <p className="text-[11px] text-muted-foreground">
                              Armá la lista de preguntas que el auditor de campo debe verificar en sitio.
                              El auditor responderá <b>Conforme / No conforme / N/A</b>; una respuesta “No conforme” queda registrada como no conformidad.
                            </p>

                            {/* Lista de preguntas */}
                            {loadingPuntos ? (
                              <p className="text-xs text-muted-foreground italic">Cargando preguntas…</p>
                            ) : puntos.length === 0 ? (
                              <p className="text-xs text-muted-foreground italic">Todavía no hay preguntas. Agregá la primera abajo.</p>
                            ) : (
                              <ol className="space-y-1.5">
                                {puntos.map((p, i) => (
                                  <li key={p.id} className="flex items-start gap-2 text-xs bg-muted/30 rounded-lg px-3 py-2">
                                    <span className="font-bold text-primary flex-none">{i + 1}.</span>
                                    <div className="min-w-0 flex-1">
                                      <span className="text-foreground">{p.pregunta}</span>
                                      {p.clausula && <span className="ml-2 text-[10px] text-muted-foreground">[{p.clausula}]</span>}
                                    </div>
                                    <button
                                      onClick={() => deletePunto(p.id, a.id)}
                                      title="Eliminar pregunta"
                                      className="text-red-500 hover:text-red-700 transition flex-none"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </li>
                                ))}
                              </ol>
                            )}

                            {/* Alta de pregunta */}
                            <form onSubmit={(e) => addPunto(a.id, e)} className="flex flex-col sm:flex-row gap-2 items-stretch">
                              <input
                                type="text"
                                value={newPuntoRef}
                                onChange={(e) => setNewPuntoRef(e.target.value)}
                                placeholder="Ref. (ej: EPP-01)"
                                className="sm:w-32 text-xs bg-muted/40 border border-border rounded-lg px-2.5 py-2 focus:outline-none focus:border-primary"
                              />
                              <input
                                type="text"
                                value={newPuntoPregunta}
                                onChange={(e) => setNewPuntoPregunta(e.target.value)}
                                placeholder="Pregunta a verificar (ej: ¿El personal usa casco y calzado de seguridad?)"
                                className="flex-1 text-xs bg-muted/40 border border-border rounded-lg px-2.5 py-2 focus:outline-none focus:border-primary"
                              />
                              <button
                                type="submit"
                                disabled={!newPuntoPregunta.trim()}
                                className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold bg-primary text-white px-3.5 py-2 rounded-lg hover:bg-primary/90 transition disabled:opacity-50"
                              >
                                <Plus className="w-4 h-4" /> Agregar
                              </button>
                            </form>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {activeTab === "hallazgos" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form */}
          <form onSubmit={handleCreateHallazgo} className="lg:col-span-4 bg-white dark:bg-zinc-950 p-6 border border-border rounded-xl shadow-sm space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground border-b pb-2">
              Registrar Hallazgo de Auditoría
            </h3>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Programa de Origen</label>
              <select
                value={newHallazgoProgId}
                onChange={(e) => setNewHallazgoProgId(e.target.value)}
                className="w-full text-xs bg-muted/40 border border-border rounded-lg px-2.5 py-2 focus:outline-none focus:border-primary font-medium"
              >
                {programas.length === 0 ? (
                  <option value="">Debe planificar un programa primero</option>
                ) : (
                  programas.map((p) => (
                    <option key={p.id} value={p.id}>{p.titulo}</option>
                  ))
                )}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Descripción del Hallazgo / Desvío</label>
              <textarea
                required
                placeholder="Ej: Se detectaron registros de calibración vencidos en la báscula de carga..."
                value={newHallazgoDesc}
                onChange={(e) => setNewHallazgoDesc(e.target.value)}
                className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary h-20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Clasificación / Criticidad</label>
              <select
                value={newHallazgoClas}
                onChange={(e) => setNewHallazgoClas(e.target.value)}
                className="w-full text-xs bg-muted/40 border border-border rounded-lg px-2.5 py-2 focus:outline-none focus:border-primary font-medium"
              >
                <option value="no_conformidad_mayor">No Conformidad Mayor (Grave)</option>
                <option value="no_conformidad_menor">No Conformidad Menor (Desvío leve)</option>
                <option value="observacion">Observación de Auditoría</option>
                <option value="oportunidad">Oportunidad de Mejora</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase font-mono">Cláusula ISO Referencia</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: ISO 9001 Cl. 7.1.5"
                  value={newHallazgoClausula}
                  onChange={(e) => setNewHallazgoClausula(e.target.value)}
                  className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Estado del Hallazgo</label>
                <select
                  value={newHallazgoEstado}
                  onChange={(e) => setNewHallazgoEstado(e.target.value)}
                  className="w-full text-xs bg-muted/40 border border-border rounded-lg px-2.5 py-2 focus:outline-none focus:border-primary"
                >
                  <option value="abierto">Abierto</option>
                  <option value="en_tratamiento">En tratamiento</option>
                  <option value="cerrado">Cerrado / Resuelto</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={programas.length === 0}
              className="w-full py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition shadow-sm disabled:opacity-50"
            >
              Registrar Hallazgo
            </button>
          </form>

          {/* List display */}
          <div className="lg:col-span-8 bg-white dark:bg-zinc-950 border border-border rounded-xl shadow-sm overflow-hidden flex flex-col h-fit">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/40 border-b border-border font-bold uppercase tracking-wider text-muted-foreground text-[10px]">
                  <th className="p-4">Descripción / Cláusula</th>
                  <th className="p-4">Clasificación</th>
                  <th className="p-4 text-center">Estado</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {hallazgos.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-muted-foreground italic">
                      No hay hallazgos de auditoría registrados.
                    </td>
                  </tr>
                ) : (
                  hallazgos.map((h) => {
                    const badge = getClassBadge(h.clasificacion);
                    return (
                      <tr key={h.id} className="hover:bg-muted/10 transition">
                        <td className="p-4 space-y-1.5 max-w-[320px]">
                          <span className="font-semibold block leading-relaxed">{h.descripcion}</span>
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-bold text-[9px] bg-primary/10 text-primary uppercase font-mono">
                            {h.clausula_referencia}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase border ${badge.color}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[9px] uppercase ${
                            h.estado === "abierto"
                              ? "text-red-700 bg-red-50 border border-red-200"
                              : h.estado === "en_tratamiento"
                              ? "text-amber-700 bg-amber-50 border border-amber-200"
                              : "text-green-700 bg-green-50 border border-green-200"
                          }`}>
                            {h.estado}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <button onClick={() => handleDeleteHallazgo(h.id)} className="text-red-500 hover:text-red-700 transition">
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
      )}
    </div>
  );
}
