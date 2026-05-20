"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { 
  Globe, 
  Plus, 
  Trash2, 
  Check, 
  HelpCircle,
  FileText,
  Scale,
  Users,
  Compass,
  AlertTriangle,
  Layers,
  ChevronRight
} from "lucide-react";

interface FodaPestelItem {
  id: string;
  tipo: string;
  descripcion: string;
}

interface ParteInteresada {
  id: string;
  nombre: string;
  tipo: string;
  necesidades: string;
  expectativas: string;
  pertinente: boolean;
  influencia: string;
  interes: string;
}

interface Alcance {
  id: string;
  declaracion: string;
  exclusiones_justificacion: string | null;
  version: string;
  estado: string;
}

interface RequisitoLegal {
  id: string;
  nombre: string;
  numero: string;
  organismo_emisor: string;
  estado_cumplimiento: string;
  proceso_aplicable: string | null;
}

export default function ContextoPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<string>("foda");

  // FODA / PESTEL state
  const [fodaItems, setFodaItems] = useState<FodaPestelItem[]>([]);
  const [newFodaText, setNewFodaText] = useState("");
  const [newFodaType, setNewFodaType] = useState("fortaleza");

  // Partes Interesadas state
  const [partes, setPartes] = useState<ParteInteresada[]>([]);
  const [newParteNombre, setNewParteNombre] = useState("");
  const [newParteTipo, setNewParteTipo] = useState("cliente");
  const [newParteNecesidades, setNewParteNecesidades] = useState("");
  const [newParteExpectativas, setNewParteExpectativas] = useState("");
  const [newPartePertinente, setNewPartePertinente] = useState(true);
  const [newParteInfluencia, setNewParteInfluencia] = useState("media");
  const [newParteInteres, setNewParteInteres] = useState("medio");

  // Alcance state
  const [alcance, setAlcance] = useState<Alcance | null>(null);
  const [alcanceText, setAlcanceText] = useState("");
  const [exclusionsText, setExclusionsText] = useState("");
  const [alcanceVersion, setAlcanceVersion] = useState("1.0");

  // Requisitos Legales state
  const [requisitos, setRequisitos] = useState<RequisitoLegal[]>([]);
  const [newReqNombre, setNewReqNombre] = useState("");
  const [newReqNumero, setNewReqNumero] = useState("");
  const [newReqOrganismo, setNewReqOrganismo] = useState("");
  const [newReqProceso, setNewReqProceso] = useState("");
  const [newReqEstado, setNewReqEstado] = useState("cumple");

  useEffect(() => {
    if (session?.user) {
      fetchFodaItems();
      fetchPartes();
      fetchAlcance();
      fetchRequisitos();
    }
  }, [session]);

  const fetchFodaItems = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/contexto/foda-pestel`, {
        headers: { Authorization: `Bearer ${(session as any).accessToken}` },
      });
      if (res.ok) setFodaItems(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPartes = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/contexto/partes-interesadas`, {
        headers: { Authorization: `Bearer ${(session as any).accessToken}` },
      });
      if (res.ok) setPartes(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAlcance = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/contexto/alcance`, {
        headers: { Authorization: `Bearer ${(session as any).accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAlcance(data);
        setAlcanceText(data.declaracion);
        setExclusionsText(data.exclusiones_justificacion || "");
        setAlcanceVersion(data.version);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRequisitos = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/contexto/requisitos-legales`, {
        headers: { Authorization: `Bearer ${(session as any).accessToken}` },
      });
      if (res.ok) setRequisitos(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddFoda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFodaText) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/contexto/foda-pestel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any).accessToken}`,
        },
        body: JSON.stringify({
          tipo: newFodaType,
          descripcion: newFodaText,
        }),
      });

      if (res.ok) {
        const newItem = await res.json();
        setFodaItems((prev) => [...prev, newItem]);
        setNewFodaText("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteFoda = async (id: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/contexto/foda-pestel/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${(session as any).accessToken}` },
      });
      if (res.ok) {
        setFodaItems((prev) => prev.filter((i) => i.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddParte = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newParteNombre || !newParteNecesidades) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/contexto/partes-interesadas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any).accessToken}`,
        },
        body: JSON.stringify({
          nombre: newParteNombre,
          tipo: newParteTipo,
          necesidades: newParteNecesidades,
          expectativas: newParteExpectativas,
          pertinente: newPartePertinente,
          influencia: newParteInfluencia,
          interes: newParteInteres,
        }),
      });

      if (res.ok) {
        const newP = await res.json();
        setPartes((prev) => [...prev, newP]);
        setNewParteNombre("");
        setNewParteNecesidades("");
        setNewParteExpectativas("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteParte = async (id: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/contexto/partes-interesadas/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${(session as any).accessToken}` },
      });
      if (res.ok) {
        setPartes((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveAlcance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alcanceText) return;

    // Increment version semantically
    const parts = alcanceVersion.split(".");
    const nextVer = parts.length === 2 ? `${parts[0]}.${parseInt(parts[1]) + 1}` : "1.0";

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/contexto/alcance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any).accessToken}`,
        },
        body: JSON.stringify({
          declaracion: alcanceText,
          exclusiones_justificacion: exclusionsText,
          version: nextVer,
          estado: "aprobado",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAlcance(data);
        setAlcanceVersion(data.version);
        alert("¡Alcance del SGI actualizado y publicado correctamente!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddRequisito = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReqNombre || !newReqNumero) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/contexto/requisitos-legales`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any).accessToken}`,
        },
        body: JSON.stringify({
          nombre: newReqNombre,
          numero: newReqNumero,
          organismo_emisor: newReqOrganismo,
          proceso_aplicable: newReqProceso,
          estado_cumplimiento: newReqEstado,
        }),
      });

      if (res.ok) {
        const newR = await res.json();
        setRequisitos((prev) => [...prev, newR]);
        setNewReqNombre("");
        setNewReqNumero("");
        setNewReqOrganismo("");
        setNewReqProceso("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRequisito = async (id: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/contexto/requisitos-legales/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${(session as any).accessToken}` },
      });
      if (res.ok) {
        setRequisitos((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // FODA Groups
  const fortalezas = fodaItems.filter((i) => i.tipo === "fortaleza");
  const debilidades = fodaItems.filter((i) => i.tipo === "debilidad");
  const oportunidades = fodaItems.filter((i) => i.tipo === "oportunidad");
  const amenazas = fodaItems.filter((i) => i.tipo === "amenaza");

  return (
    <div className="space-y-8 animate-fade-in text-zinc-900 dark:text-zinc-50">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-heading flex items-center gap-2">
          <Globe className="w-8 h-8 text-primary" />
          M02 · Contexto Organizacional
        </h1>
        <p className="text-muted-foreground text-sm">
          Determina las cuestiones internas/externas, partes interesadas, alcance del SGI y requisitos legales obligatorios.
        </p>
      </div>

      {/* Navigation tabs */}
      <div className="flex border-b border-border overflow-x-auto gap-1">
        {[
          { id: "foda", name: "Análisis FODA / PESTEL", icon: Layers },
          { id: "partes", name: "Partes Interesadas", icon: Users },
          { id: "alcance", name: "Alcance del SGI", icon: Compass },
          { id: "legales", name: "Requisitos Legales", icon: Scale },
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

      {/* Render tab content */}
      <div className="space-y-6">
        {/* FODA / PESTEL TAB */}
        {activeTab === "foda" && (
          <div className="space-y-6">
            {/* Input Form */}
            <form onSubmit={handleAddFoda} className="bg-white dark:bg-zinc-950 p-4 border border-border rounded-xl shadow-sm flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 space-y-1.5 w-full">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Nueva cuestión</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Personal técnico altamente calificado y con certificaciones ISO."
                  value={newFodaText}
                  onChange={(e) => setNewFodaText(e.target.value)}
                  className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-1.5 w-full md:w-48">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Tipo / Matriz</label>
                <select
                  value={newFodaType}
                  onChange={(e) => setNewFodaType(e.target.value)}
                  className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary font-medium"
                >
                  <option value="fortaleza">Fortaleza (Interno)</option>
                  <option value="debilidad">Debilidad (Interno)</option>
                  <option value="oportunidad">Oportunidad (Externo)</option>
                  <option value="amenaza">Amenaza (Externo)</option>
                </select>
              </div>
              <button
                type="submit"
                className="px-5 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition shadow-sm w-full md:w-auto"
              >
                Agregar
              </button>
            </form>

            {/* Quadrant grid map */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Fortalezas */}
              <div className="bg-white dark:bg-zinc-950 border border-border rounded-xl p-5 shadow-sm space-y-3">
                <h3 className="font-bold text-sm text-green-700 dark:text-green-400 flex items-center gap-1.5 border-b pb-2">
                  <span className="w-2 h-2 rounded-full bg-green-600" />
                  Fortalezas (F)
                </h3>
                <ul className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                  {fortalezas.length === 0 ? (
                    <span className="text-xs text-muted-foreground italic block">Sin fortalezas registradas.</span>
                  ) : (
                    fortalezas.map((item) => (
                      <li key={item.id} className="text-xs flex items-start justify-between gap-2 p-2 bg-green-50/20 dark:bg-green-950/10 rounded-lg border border-green-100/50 dark:border-green-900/30 leading-relaxed font-medium">
                        <span>{item.descripcion}</span>
                        <button onClick={() => handleDeleteFoda(item.id)} className="text-red-500 hover:text-red-700 transition">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </div>

              {/* Debilidades */}
              <div className="bg-white dark:bg-zinc-950 border border-border rounded-xl p-5 shadow-sm space-y-3">
                <h3 className="font-bold text-sm text-amber-700 dark:text-amber-400 flex items-center gap-1.5 border-b pb-2">
                  <span className="w-2 h-2 rounded-full bg-amber-600" />
                  Debilidades (D)
                </h3>
                <ul className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                  {debilidades.length === 0 ? (
                    <span className="text-xs text-muted-foreground italic block">Sin debilidades registradas.</span>
                  ) : (
                    debilidades.map((item) => (
                      <li key={item.id} className="text-xs flex items-start justify-between gap-2 p-2 bg-amber-50/20 dark:bg-amber-950/10 rounded-lg border border-amber-100/50 dark:border-amber-900/30 leading-relaxed font-medium">
                        <span>{item.descripcion}</span>
                        <button onClick={() => handleDeleteFoda(item.id)} className="text-red-500 hover:text-red-700 transition">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </div>

              {/* Oportunidades */}
              <div className="bg-white dark:bg-zinc-950 border border-border rounded-xl p-5 shadow-sm space-y-3">
                <h3 className="font-bold text-sm text-primary dark:text-sky-400 flex items-center gap-1.5 border-b pb-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  Oportunidades (O)
                </h3>
                <ul className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                  {oportunidades.length === 0 ? (
                    <span className="text-xs text-muted-foreground italic block">Sin oportunidades registradas.</span>
                  ) : (
                    oportunidades.map((item) => (
                      <li key={item.id} className="text-xs flex items-start justify-between gap-2 p-2 bg-primary/5 rounded-lg border border-primary/10 leading-relaxed font-medium">
                        <span>{item.descripcion}</span>
                        <button onClick={() => handleDeleteFoda(item.id)} className="text-red-500 hover:text-red-700 transition">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </div>

              {/* Amenazas */}
              <div className="bg-white dark:bg-zinc-950 border border-border rounded-xl p-5 shadow-sm space-y-3">
                <h3 className="font-bold text-sm text-red-700 dark:text-red-400 flex items-center gap-1.5 border-b pb-2">
                  <span className="w-2 h-2 rounded-full bg-red-600" />
                  Amenazas (A)
                </h3>
                <ul className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                  {amenazas.length === 0 ? (
                    <span className="text-xs text-muted-foreground italic block">Sin amenazas registradas.</span>
                  ) : (
                    amenazas.map((item) => (
                      <li key={item.id} className="text-xs flex items-start justify-between gap-2 p-2 bg-red-50/20 dark:bg-red-950/10 rounded-lg border border-red-100/50 dark:border-red-900/30 leading-relaxed font-medium">
                        <span>{item.descripcion}</span>
                        <button onClick={() => handleDeleteFoda(item.id)} className="text-red-500 hover:text-red-700 transition">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* PARTES INTERESADAS TAB */}
        {activeTab === "partes" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Form */}
            <form onSubmit={handleAddParte} className="lg:col-span-4 bg-white dark:bg-zinc-950 p-6 border border-border rounded-xl shadow-sm space-y-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground border-b pb-2">
                Nueva Parte Interesada
              </h3>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Nombre / Identificador</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Clientes del Sector Agro"
                  value={newParteNombre}
                  onChange={(e) => setNewParteNombre(e.target.value)}
                  className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Tipo de Interesado</label>
                <select
                  value={newParteTipo}
                  onChange={(e) => setNewParteTipo(e.target.value)}
                  className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary font-medium"
                >
                  <option value="cliente">Cliente / Consumidor</option>
                  <option value="proveedor">Proveedor / Contratista</option>
                  <option value="regulador">Ente Regulador / Gobierno</option>
                  <option value="comunidad">Comunidad / Vecinos</option>
                  <option value="interno">Empleados / Personal</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Necesidades</label>
                <textarea
                  required
                  placeholder="Ej: Calidad constante en los informes entregados."
                  value={newParteNecesidades}
                  onChange={(e) => setNewParteNecesidades(e.target.value)}
                  className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary h-20"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Expectativas</label>
                <textarea
                  placeholder="Ej: Incorporación de canales digitales rápidos."
                  value={newParteExpectativas}
                  onChange={(e) => setNewParteExpectativas(e.target.value)}
                  className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary h-20"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Influencia</label>
                  <select
                    value={newParteInfluencia}
                    onChange={(e) => setNewParteInfluencia(e.target.value)}
                    className="w-full text-xs bg-muted/40 border border-border rounded-lg px-2.5 py-2 focus:outline-none focus:border-primary"
                  >
                    <option value="alta">Alta</option>
                    <option value="media">Media</option>
                    <option value="baja">Baja</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Interés</label>
                  <select
                    value={newParteInteres}
                    onChange={(e) => setNewParteInteres(e.target.value)}
                    className="w-full text-xs bg-muted/40 border border-border rounded-lg px-2.5 py-2 focus:outline-none focus:border-primary"
                  >
                    <option value="alto">Alto</option>
                    <option value="medio">Medio</option>
                    <option value="bajo">Bajo</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition shadow-sm"
              >
                Guardar Interesado
              </button>
            </form>

            {/* List */}
            <div className="lg:col-span-8 bg-white dark:bg-zinc-950 border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/40 border-b border-border font-bold uppercase tracking-wider text-muted-foreground text-[10px]">
                    <th className="p-4">Interesado / Tipo</th>
                    <th className="p-4">Necesidades y Expectativas</th>
                    <th className="p-4">Prioridad / Grado</th>
                    <th className="p-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs">
                  {partes.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-muted-foreground italic">
                        No hay partes interesadas registradas.
                      </td>
                    </tr>
                  ) : (
                    partes.map((p) => (
                      <tr key={p.id} className="hover:bg-muted/10 transition">
                        <td className="p-4 font-semibold">
                          <span>{p.nombre}</span>
                          <span className="block text-[9px] text-muted-foreground font-normal uppercase mt-0.5">
                            {p.tipo}
                          </span>
                        </td>
                        <td className="p-4 space-y-1">
                          <p><strong className="text-zinc-600 dark:text-zinc-400">Necesidades:</strong> {p.necesidades}</p>
                          {p.expectativas && <p><strong className="text-zinc-600 dark:text-zinc-400">Expectativas:</strong> {p.expectativas}</p>}
                        </td>
                        <td className="p-4 space-y-1">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-bold text-[9px] bg-primary/10 text-primary uppercase">
                            Influencia: {p.influencia}
                          </span>
                          <span className="block inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-bold text-[9px] bg-secondary/15 text-secondary uppercase">
                            Interés: {p.interes}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <button onClick={() => handleDeleteParte(p.id)} className="text-red-500 hover:text-red-700 transition">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ALCANCE SGI TAB */}
        {activeTab === "alcance" && (
          <form onSubmit={handleSaveAlcance} className="bg-white dark:bg-zinc-950 p-6 border border-border rounded-xl shadow-sm space-y-6 max-w-3xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Compass className="w-5 h-5 text-primary" />
                Declaración de Alcance del SGI
              </h3>
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-bold text-xs uppercase">
                Versión {alcanceVersion}
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase block">
                Alcance Formal de la Certificación / SGI
              </label>
              <textarea
                required
                placeholder="Redacte el alcance integral del SGI aquí..."
                value={alcanceText}
                onChange={(e) => setAlcanceText(e.target.value)}
                className="w-full text-sm bg-muted/40 border border-border rounded-lg px-4 py-3 focus:outline-none focus:border-primary h-40 leading-relaxed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase block">
                Exclusiones y Justificaciones (Ej: ISO 9001 Cláusula 8.3 Diseño)
              </label>
              <textarea
                placeholder="Declare si existen exclusiones justificadas dentro del SGI..."
                value={exclusionsText}
                onChange={(e) => setExclusionsText(e.target.value)}
                className="w-full text-sm bg-muted/40 border border-border rounded-lg px-4 py-3 focus:outline-none focus:border-primary h-24 leading-relaxed"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition shadow-md hover:scale-[1.02] active:scale-[0.98]"
              >
                Aprobar y Publicar Nueva Versión
              </button>
            </div>
          </form>
        )}

        {/* REQUISITOS LEGALES TAB */}
        {activeTab === "legales" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Form */}
            <form onSubmit={handleAddRequisito} className="lg:col-span-4 bg-white dark:bg-zinc-950 p-6 border border-border rounded-xl shadow-sm space-y-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground border-b pb-2">
                Nuevo Requisito Legal
              </h3>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Nombre de la Normativa</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Ley General de Residuos Peligrosos"
                  value={newReqNombre}
                  onChange={(e) => setNewReqNombre(e.target.value)}
                  className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase font-mono">Número / Identificador</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Ley N° 24.051"
                  value={newReqNumero}
                  onChange={(e) => setNewReqNumero(e.target.value)}
                  className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Organismo Emisor</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Ministerio de Ambiente"
                  value={newReqOrganismo}
                  onChange={(e) => setNewReqOrganismo(e.target.value)}
                  className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Proceso / Área Aplicable</label>
                <input
                  type="text"
                  placeholder="Ej: Logística / Planta Industrial"
                  value={newReqProceso}
                  onChange={(e) => setNewReqProceso(e.target.value)}
                  className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Estado de Cumplimiento</label>
                <select
                  value={newReqEstado}
                  onChange={(e) => setNewReqEstado(e.target.value)}
                  className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary font-medium"
                >
                  <option value="cumple">Cumple Totalmente</option>
                  <option value="en_proceso">En Proceso / Adaptación</option>
                  <option value="no_cumple">No Cumple (Brecha)</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition shadow-sm"
              >
                Registrar Requisito
              </button>
            </form>

            {/* Table */}
            <div className="lg:col-span-8 bg-white dark:bg-zinc-950 border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/40 border-b border-border font-bold uppercase tracking-wider text-muted-foreground text-[10px]">
                    <th className="p-4">Identificador / Norma</th>
                    <th className="p-4">Organismo / Proceso</th>
                    <th className="p-4">Cumplimiento</th>
                    <th className="p-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs">
                  {requisitos.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-muted-foreground italic">
                        No hay requisitos legales registrados.
                      </td>
                    </tr>
                  ) : (
                    requisitos.map((r) => (
                      <tr key={r.id} className="hover:bg-muted/10 transition">
                        <td className="p-4 font-semibold">
                          <span>{r.numero}</span>
                          <span className="block text-[10px] text-muted-foreground font-medium mt-0.5">
                            {r.nombre}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="font-medium">{r.organismo_emisor}</span>
                          {r.proceso_aplicable && (
                            <span className="block text-[10px] text-muted-foreground mt-0.5">
                              Área: {r.proceso_aplicable}
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase ${
                              r.estado_cumplimiento === "cumple"
                                ? "text-green-700 bg-green-50 dark:bg-green-950/20 dark:text-green-400"
                                : r.estado_cumplimiento === "en_proceso"
                                ? "text-amber-700 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400"
                                : "text-red-700 bg-red-50 dark:bg-red-950/20 dark:text-red-400"
                            }`}
                          >
                            {r.estado_cumplimiento === "cumple"
                              ? "Cumple"
                              : r.estado_cumplimiento === "en_proceso"
                              ? "En proceso"
                              : "No cumple"}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <button onClick={() => handleDeleteRequisito(r.id)} className="text-red-500 hover:text-red-700 transition">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
