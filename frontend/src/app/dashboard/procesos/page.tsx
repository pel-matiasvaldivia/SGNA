"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { 
  Workflow, 
  Plus, 
  Trash2, 
  Layers, 
  BookOpen, 
  Sliders, 
  ArrowRight,
  User,
  Info,
  X
} from "lucide-react";

interface Proceso {
  id: string;
  nombre: string;
  codigo: string;
  tipo: string;
  entradas: string | null;
  proveedores: string | null;
  salidas: string | null;
  clientes: string | null;
  recursos: string | null;
  controles: string | null;
}

export default function ProcesosPage() {
  const { data: session } = useSession();
  const [procesos, setProcesos] = useState<Proceso[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal creation state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newNombre, setNewNombre] = useState("");
  const [newCodigo, setNewCodigo] = useState("");
  const [newTipo, setNewTipo] = useState("operativo");
  const [newEntradas, setNewEntradas] = useState("");
  const [newProveedores, setNewProveedores] = useState("");
  const [newSalidas, setNewSalidas] = useState("");
  const [newClientes, setNewClientes] = useState("");
  const [newRecursos, setNewRecursos] = useState("");
  const [newControles, setNewControles] = useState("");

  // Detailed selected process state for sidebar characterization display
  const [selectedProceso, setSelectedProceso] = useState<Proceso | null>(null);

  useEffect(() => {
    if (session?.user) {
      fetchProcesos();
    }
  }, [session]);

  const fetchProcesos = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/procesos/`, {
        headers: { Authorization: `Bearer ${(session as any).accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProcesos(data);
        if (data.length > 0) {
          setSelectedProceso(data[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProceso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNombre || !newCodigo) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/procesos/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any).accessToken}`,
        },
        body: JSON.stringify({
          nombre: newNombre,
          codigo: newCodigo,
          tipo: newTipo,
          entradas: newEntradas,
          proveedores: newProveedores,
          salidas: newSalidas,
          clientes: newClientes,
          recursos: newRecursos,
          controles: newControles,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setProcesos((prev) => [...prev, data]);
        setSelectedProceso(data);
        setIsModalOpen(false);
        // Reset fields
        setNewNombre("");
        setNewCodigo("");
        setNewEntradas("");
        setNewProveedores("");
        setNewSalidas("");
        setNewClientes("");
        setNewRecursos("");
        setNewControles("");
      } else {
        const errData = await res.json();
        alert(errData.detail || "Error al registrar proceso.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProceso = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("¿Está seguro de eliminar esta ficha de proceso?")) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/procesos/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${(session as any).accessToken}` },
      });
      if (res.ok) {
        setProcesos((prev) => prev.filter((p) => p.id !== id));
        if (selectedProceso?.id === id) {
          setSelectedProceso(null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Group processes by types for the map layout
  const estrategicos = procesos.filter((p) => p.tipo === "estrategico");
  const operativos = procesos.filter((p) => p.tipo === "operativo");
  const soporte = procesos.filter((p) => p.tipo === "soporte");

  return (
    <div className="space-y-8 animate-fade-in text-zinc-900 dark:text-zinc-50">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-heading flex items-center gap-2">
            <Workflow className="w-8 h-8 text-primary" />
            M07 · Mapa & Gestión de Procesos (BPM)
          </h1>
          <p className="text-muted-foreground text-sm">
            Estructure el mapa de procesos del SGI y documente las fichas de caracterización de sus operaciones.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-semibold transition shadow-md hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Registrar Proceso
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Map of processes categorized by column lanes */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-zinc-950 p-6 border border-border rounded-xl shadow-sm space-y-6">
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground border-b pb-2">
              Mapa de Procesos SGI
            </h3>

            {/* Strategic processes lane */}
            <div className="space-y-3 bg-primary/5 p-4 rounded-xl border border-primary/10">
              <span className="text-[10px] font-extrabold uppercase text-primary tracking-wider block">
                Procesos Estratégicos (Direccionamiento)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {estrategicos.length === 0 ? (
                  <span className="text-xs text-muted-foreground italic col-span-2">Ninguno registrado.</span>
                ) : (
                  estrategicos.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProceso(p)}
                      className={`text-left p-3.5 rounded-lg border text-sm transition flex flex-col justify-between items-start gap-2 shadow-sm ${
                        selectedProceso?.id === p.id
                          ? "bg-white border-primary ring-1 ring-primary"
                          : "bg-white dark:bg-zinc-900 border-border hover:border-primary/50"
                      }`}
                    >
                      <span className="font-bold text-xs bg-primary/15 text-primary px-1.5 py-0.5 rounded font-mono uppercase">
                        {p.codigo}
                      </span>
                      <span className="font-semibold block leading-tight">{p.nombre}</span>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Operational processes lane */}
            <div className="space-y-3 bg-secondary/5 p-4 rounded-xl border border-secondary/15">
              <span className="text-[10px] font-extrabold uppercase text-secondary tracking-wider block">
                Procesos Operativos (Cadena de Valor)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {operativos.length === 0 ? (
                  <span className="text-xs text-muted-foreground italic col-span-2">Ninguno registrado.</span>
                ) : (
                  operativos.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProceso(p)}
                      className={`text-left p-3.5 rounded-lg border text-sm transition flex flex-col justify-between items-start gap-2 shadow-sm ${
                        selectedProceso?.id === p.id
                          ? "bg-white border-primary ring-1 ring-primary"
                          : "bg-white dark:bg-zinc-900 border-border hover:border-primary/50"
                      }`}
                    >
                      <span className="font-bold text-xs bg-secondary/20 text-secondary px-1.5 py-0.5 rounded font-mono uppercase">
                        {p.codigo}
                      </span>
                      <span className="font-semibold block leading-tight">{p.nombre}</span>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Support processes lane */}
            <div className="space-y-3 bg-zinc-50 dark:bg-zinc-900/40 p-4 rounded-xl border border-border">
              <span className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider block">
                Procesos de Soporte / Apoyo
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {soporte.length === 0 ? (
                  <span className="text-xs text-muted-foreground italic col-span-2">Ninguno registrado.</span>
                ) : (
                  soporte.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProceso(p)}
                      className={`text-left p-3.5 rounded-lg border text-sm transition flex flex-col justify-between items-start gap-2 shadow-sm ${
                        selectedProceso?.id === p.id
                          ? "bg-white border-primary ring-1 ring-primary"
                          : "bg-white dark:bg-zinc-900 border-border hover:border-primary/50"
                      }`}
                    >
                      <span className="font-bold text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-mono uppercase">
                        {p.codigo}
                      </span>
                      <span className="font-semibold block leading-tight">{p.nombre}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Caracterizacion Ficha Display Panel */}
        <div className="lg:col-span-5 space-y-6">
          {selectedProceso ? (
            <div className="bg-white dark:bg-zinc-950 border border-border rounded-xl p-6 shadow-sm space-y-6 animate-fade-in relative">
              <div className="flex justify-between items-start border-b pb-4">
                <div>
                  <span className="font-bold text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-mono uppercase">
                    {selectedProceso.codigo}
                  </span>
                  <h3 className="font-bold text-lg text-primary mt-2">{selectedProceso.nombre}</h3>
                  <span className="text-[10px] text-muted-foreground block uppercase font-extrabold mt-0.5">
                    Proceso {selectedProceso.tipo}
                  </span>
                </div>
                <button
                  onClick={(e) => handleDeleteProceso(selectedProceso.id, e)}
                  className="text-red-500 hover:text-red-700 transition"
                  title="Eliminar proceso"
                >
                  <Trash2 className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Characterization details */}
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/10 p-3 rounded-lg border border-border">
                    <strong className="block text-primary uppercase text-[10px] tracking-wider mb-1">Proveedores</strong>
                    <span className="text-muted-foreground italic leading-relaxed">{selectedProceso.proveedores || "No especificado"}</span>
                  </div>
                  <div className="bg-muted/10 p-3 rounded-lg border border-border">
                    <strong className="block text-primary uppercase text-[10px] tracking-wider mb-1">Entradas</strong>
                    <span className="text-muted-foreground italic leading-relaxed">{selectedProceso.entradas || "No especificado"}</span>
                  </div>
                </div>

                <div className="flex items-center justify-center py-2 text-muted-foreground/30">
                  <ArrowRight className="w-6 h-6 rotate-90" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/10 p-3 rounded-lg border border-border">
                    <strong className="block text-primary uppercase text-[10px] tracking-wider mb-1">Salidas</strong>
                    <span className="text-muted-foreground italic leading-relaxed">{selectedProceso.salidas || "No especificado"}</span>
                  </div>
                  <div className="bg-muted/10 p-3 rounded-lg border border-border">
                    <strong className="block text-primary uppercase text-[10px] tracking-wider mb-1">Clientes</strong>
                    <span className="text-muted-foreground italic leading-relaxed">{selectedProceso.clientes || "No especificado"}</span>
                  </div>
                </div>

                <div className="border-t border-border pt-4 space-y-3">
                  <div>
                    <strong className="block text-primary uppercase text-[10px] tracking-wider mb-1 flex items-center gap-1">
                      <Sliders className="w-3.5 h-3.5" />
                      Recursos Operacionales
                    </strong>
                    <p className="text-muted-foreground italic leading-relaxed">{selectedProceso.recursos || "No declarado"}</p>
                  </div>
                  <div>
                    <strong className="block text-primary uppercase text-[10px] tracking-wider mb-1 flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" />
                      Controles de Calidad (KPI / Auditoría)
                    </strong>
                    <p className="text-muted-foreground italic leading-relaxed">{selectedProceso.controles || "No declarado"}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-950 border border-border rounded-xl p-12 text-center text-muted-foreground italic shadow-sm">
              Seleccione un proceso del mapa para visualizar su ficha de caracterización.
            </div>
          )}
        </div>
      </div>

      {/* Modal for creating a new process */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-zinc-950 border border-border rounded-2xl shadow-2xl overflow-hidden animate-slide-in">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-md font-bold flex items-center gap-2">
                <Workflow className="w-5 h-5 text-primary" />
                Registrar Ficha de Proceso (BPM)
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-muted rounded-full transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleCreateProceso} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Nombre de Proceso</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Control de Calidad"
                    value={newNombre}
                    onChange={(e) => setNewNombre(e.target.value)}
                    className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase font-mono">Código Identificador</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: PRO-CAL-01"
                    value={newCodigo}
                    onChange={(e) => setNewCodigo(e.target.value)}
                    className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase block">Tipo de Proceso</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "estrategico", label: "Estratégico", desc: "Dirección / Calidad" },
                    { id: "operativo", label: "Operativo", desc: "Producción / Ventas" },
                    { id: "soporte", label: "Soporte", desc: "IT / Compras / HR" }
                  ].map((tipo) => (
                    <label
                      key={tipo.id}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border text-center cursor-pointer transition ${
                        newTipo === tipo.id
                          ? "bg-primary/5 border-primary text-primary font-semibold"
                          : "bg-muted/10 border-border hover:bg-muted/30"
                      }`}
                    >
                      <input
                        type="radio"
                        name="tipo"
                        value={tipo.id}
                        checked={newTipo === tipo.id}
                        onChange={() => setNewTipo(tipo.id)}
                        className="sr-only"
                      />
                      <span className="text-xs">{tipo.label}</span>
                      <span className="text-[9px] text-muted-foreground mt-0.5 font-normal">{tipo.desc}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Proveedores</label>
                  <input
                    type="text"
                    placeholder="Ej: Proveedor logístico, Compras"
                    value={newProveedores}
                    onChange={(e) => setNewProveedores(e.target.value)}
                    className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase font-mono">Entradas</label>
                  <input
                    type="text"
                    placeholder="Ej: Insumos de producción, Orden de compra"
                    value={newEntradas}
                    onChange={(e) => setNewEntradas(e.target.value)}
                    className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Salidas</label>
                  <input
                    type="text"
                    placeholder="Ej: Producto terminado, Informe"
                    value={newSalidas}
                    onChange={(e) => setNewSalidas(e.target.value)}
                    className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase font-mono">Clientes</label>
                  <input
                    type="text"
                    placeholder="Ej: Cliente final, Logística"
                    value={newClientes}
                    onChange={(e) => setNewClientes(e.target.value)}
                    className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Recursos Operacionales</label>
                  <input
                    type="text"
                    placeholder="Ej: Servidor en la nube, personal certificado"
                    value={newRecursos}
                    onChange={(e) => setNewRecursos(e.target.value)}
                    className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase font-mono">Controles / KPIs</label>
                  <input
                    type="text"
                    placeholder="Ej: % de desvíos mensuales < 2%"
                    value={newControles}
                    onChange={(e) => setNewControles(e.target.value)}
                    className="w-full text-sm bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 text-xs font-semibold border border-border rounded-lg hover:bg-muted transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newNombre || !newCodigo}
                  className="flex-1 py-2.5 text-xs font-semibold bg-primary hover:bg-primary/90 text-white rounded-lg transition disabled:opacity-50"
                >
                  Registrar Ficha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
