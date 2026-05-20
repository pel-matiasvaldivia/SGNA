"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Wrench, Settings, Plus, Play, CheckCircle, AlertCircle, Calendar, Package } from "lucide-react";

interface OrdenTrabajo {
  id: string;
  activo_id: string;
  tipo_mantenimiento: string;
  descripcion_falla: string;
  estado: string;
  fecha_solicitud: string;
}

export default function CMMSPage() {
  const { data: session } = useSession();
  const [ordenes, setOrdenes] = useState<OrdenTrabajo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!session?.user) return;
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/mantenimiento/ordenes`, {
        headers: { Authorization: `Bearer ${(session as any).accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrdenes(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [session]);

  const stats = {
    pendientes: ordenes.filter(o => o.estado === "pendiente").length,
    en_progreso: ordenes.filter(o => o.estado === "en_progreso").length,
    completadas: ordenes.filter(o => o.estado === "completado").length,
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading flex items-center gap-2">
            <Wrench className="w-8 h-8 text-secondary" /> Mantenimiento (CMMS)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestión de activos, infraestructura y órdenes de trabajo (ISO 9001:2015 7.1.3).
          </p>
        </div>
        <button className="flex items-center gap-2 bg-secondary text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:opacity-90 transition shadow-lg">
          <Plus className="w-4 h-4" /> Nueva Orden
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-border shadow-sm flex items-center gap-4">
          <div className="p-4 bg-orange-100 text-orange-600 rounded-xl"><AlertCircle className="w-8 h-8" /></div>
          <div>
            <span className="block text-sm text-muted-foreground font-bold uppercase tracking-wider">Pendientes</span>
            <span className="block text-3xl font-extrabold">{stats.pendientes}</span>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-border shadow-sm flex items-center gap-4">
          <div className="p-4 bg-blue-100 text-blue-600 rounded-xl"><Play className="w-8 h-8" /></div>
          <div>
            <span className="block text-sm text-muted-foreground font-bold uppercase tracking-wider">En Ejecución</span>
            <span className="block text-3xl font-extrabold">{stats.en_progreso}</span>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-border shadow-sm flex items-center gap-4">
          <div className="p-4 bg-green-100 text-green-600 rounded-xl"><CheckCircle className="w-8 h-8" /></div>
          <div>
            <span className="block text-sm text-muted-foreground font-bold uppercase tracking-wider">Completadas</span>
            <span className="block text-3xl font-extrabold">{stats.completadas}</span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-950 border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border flex justify-between items-center bg-muted/10">
          <h3 className="font-bold text-lg flex items-center gap-2"><Settings className="w-5 h-5 text-secondary" /> Órdenes de Trabajo Activas</h3>
        </div>
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">Cargando base de datos de activos...</div>
        ) : ordenes.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-muted-foreground bg-muted/5">
            <Package className="w-16 h-16 mb-4 text-muted-foreground/30" />
            <h4 className="font-bold text-lg text-surface-foreground mb-1">Sin Órdenes de Trabajo</h4>
            <p className="text-sm">El parque de maquinaria e infraestructura está operando de forma nominal.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-muted/40 uppercase text-xs font-bold text-muted-foreground tracking-wider">
              <tr>
                <th className="p-4">ID</th>
                <th className="p-4">Descripción de Falla</th>
                <th className="p-4">Tipo</th>
                <th className="p-4">Estado</th>
                <th className="p-4">Fecha Solicitud</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ordenes.map(orden => (
                <tr key={orden.id} className="hover:bg-muted/20 transition">
                  <td className="p-4 font-mono text-xs">{orden.id.substring(0,8)}</td>
                  <td className="p-4 font-semibold">{orden.descripcion_falla}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-muted rounded text-xs font-bold uppercase">{orden.tipo_mantenimiento}</span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${orden.estado === 'pendiente' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>{orden.estado}</span>
                  </td>
                  <td className="p-4 text-muted-foreground">{new Date(orden.fecha_solicitud).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
