"use client";

import React, { useState } from "react";
import { 
  Truck, ShieldAlert, Award, Star, User, Calendar, FileText, 
  Plus, Check, X, AlertTriangle, ChevronRight, CheckCircle2, 
  HelpCircle, RefreshCw, BarChart2, Scale
} from "lucide-react";

// Types
interface Proveedor {
  id: string;
  razon_social: string;
  rut_tax_id: string;
  contacto_nombre: string;
  contacto_email: string;
  contacto_telefono: string;
  categoria: "critico" | "estrategico" | "soporte";
  estado: "prospecto" | "evaluado" | "homologado" | "suspendido";
  calificacion_promedio: number;
}

interface Evaluacion {
  id: string;
  proveedor_id: string;
  fecha_evaluacion: string;
  criterio_calidad: number;
  criterio_entrega: number;
  criterio_servicio: number;
  criterio_cumplimiento: number;
  puntaje_global: number;
  resultado: "aprobado" | "condicional" | "rechazado";
  comentarios: string;
  evaluador: string;
}

interface SCAR {
  id: string;
  proveedor_id: string;
  codigo: string;
  descripcion_desvio: string;
  fecha_reclamo: string;
  estado: "abierto" | "respondido" | "cerrado";
  solucion_propuesta?: string;
  comentarios_cierre?: string;
  fecha_cierre?: string;
  non_conformity_id?: string;
}

// Initial Simulated Data
const INITIAL_PROVEEDORES: Proveedor[] = [
  {
    id: "p1",
    razon_social: "ACME Industrial SA",
    rut_tax_id: "76.543.210-K",
    contacto_nombre: "Carlos Mendoza",
    contacto_email: "c.mendoza@acmeindustrial.com",
    contacto_telefono: "+56 9 8765 4321",
    categoria: "estrategico",
    estado: "homologado",
    calificacion_promedio: 91.50
  },
  {
    id: "p2",
    razon_social: "Suministros Globales Ltda",
    rut_tax_id: "78.910.111-2",
    contacto_nombre: "María Elena Ruiz",
    contacto_email: "mruiz@suministrosglobales.cl",
    contacto_telefono: "+56 2 2444 8888",
    categoria: "critico",
    estado: "evaluado",
    calificacion_promedio: 74.00
  },
  {
    id: "p3",
    razon_social: "Logística del Sur SpA",
    rut_tax_id: "77.888.999-0",
    contacto_nombre: "Jaime Castro",
    contacto_email: "jcastro@logisticasur.cl",
    contacto_telefono: "+56 9 9999 1111",
    categoria: "critico",
    estado: "suspendido",
    calificacion_promedio: 52.00
  },
  {
    id: "p4",
    razon_social: "Servicios de Soporte Express",
    rut_tax_id: "79.444.555-6",
    contacto_nombre: "Lucía Pérez",
    contacto_email: "contacto@soporteexpress.cl",
    contacto_telefono: "+56 9 7777 5555",
    categoria: "soporte",
    estado: "prospecto",
    calificacion_promedio: 0.00
  }
];

const INITIAL_EVALUACIONES: Evaluacion[] = [
  {
    id: "ev1",
    proveedor_id: "p1",
    fecha_evaluacion: "2026-04-15",
    criterio_calidad: 95,
    criterio_entrega: 90,
    criterio_servicio: 92,
    criterio_cumplimiento: 88,
    puntaje_global: 91.50,
    resultado: "aprobado",
    comentarios: "Excelente desempeño consistente en entregas de insumos mecánicos primarios. Mantiene certificaciones ISO vigentes.",
    evaluador: "Ing. Andrés Beltrán"
  },
  {
    id: "ev2",
    proveedor_id: "p2",
    fecha_evaluacion: "2026-03-20",
    criterio_calidad: 78,
    criterio_entrega: 70,
    criterio_servicio: 80,
    criterio_cumplimiento: 68,
    puntaje_global: 74.00,
    resultado: "condicional",
    comentarios: "Entrega demorada en lote N°12. Plan de control de calidad interno reportó desvíos tolerables. Se solicita plan de acción preventivo.",
    evaluador: "Dra. Carolina Lagos"
  },
  {
    id: "ev3",
    proveedor_id: "p3",
    fecha_evaluacion: "2026-05-10",
    criterio_calidad: 50,
    criterio_entrega: 45,
    criterio_servicio: 65,
    criterio_cumplimiento: 60,
    puntaje_global: 52.00,
    resultado: "rechazado",
    comentarios: "Rechazo de materias primas por contaminación. Demora logística superior a 15 días hábiles sin justificación aceptable. Suspendido provisoriamente.",
    evaluador: "Ing. Andrés Beltrán"
  }
];

const INITIAL_SCARS: SCAR[] = [
  {
    id: "sc1",
    proveedor_id: "p1",
    codigo: "SCAR-PRV-9821A",
    descripcion_desvio: "Diferencia menor en los certificados de conformidad de aleación de acero provistos en la orden N°451.",
    fecha_reclamo: "2026-04-16",
    estado: "cerrado",
    solucion_propuesta: "Proveedor rectificó y re-emitió la documentación correspondiente con firma digital legalizada en 48 horas.",
    comentarios_cierre: "Certificados cargados satisfactoriamente en el DMS. Cierre conforme por auditoría.",
    fecha_cierre: "2026-04-18"
  },
  {
    id: "sc2",
    proveedor_id: "p2",
    codigo: "SCAR-PRV-3482F",
    descripcion_desvio: "Falla de empaque primario en las válvulas de control. Varias cajas llegaron dañadas debido a estiba inapropiada en camión.",
    fecha_reclamo: "2026-05-02",
    estado: "respondido",
    solucion_propuesta: "Proveedor propone cambio en el diseño de embalaje exterior incorporando esquineros de alta densidad y capacitación a personal de estiba.",
    non_conformity_id: "nc-linked-1"
  },
  {
    id: "sc3",
    proveedor_id: "p3",
    codigo: "SCAR-PRV-0922C",
    descripcion_desvio: "Desvío crítico: Presencia de óxido en el lote N°88 de barras de soporte entregadas en Planta Norte.",
    fecha_reclamo: "2026-05-12",
    estado: "abierto"
  }
];

export default function ProveedoresPage() {
  const [activeTab, setActiveTab] = useState<"directorio" | "evaluaciones" | "reclamos">("directorio");
  
  // Data State
  const [proveedores, setProveedores] = useState<Proveedor[]>(INITIAL_PROVEEDORES);
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>(INITIAL_EVALUACIONES);
  const [scars, setScars] = useState<SCAR[]>(INITIAL_SCARS);
  
  // Selection state
  const [selectedProveedorId, setSelectedProveedorId] = useState<string>("p1");
  const [selectedScarId, setSelectedScarId] = useState<string>("sc2");
  
  // Add Supplier Form
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    razon_social: "",
    rut_tax_id: "",
    contacto_nombre: "",
    contacto_email: "",
    contacto_telefono: "",
    categoria: "critico" as "critico" | "estrategico" | "soporte"
  });

  // Evaluation Form
  const [showAddEvalModal, setShowAddEvalModal] = useState(false);
  const [newEval, setNewEval] = useState({
    fecha_evaluacion: new Date().toISOString().split("T")[0],
    criterio_calidad: 80,
    criterio_entrega: 80,
    criterio_servicio: 80,
    criterio_cumplimiento: 80,
    comentarios: ""
  });

  // SCAR Form
  const [showAddScarModal, setShowAddScarModal] = useState(false);
  const [newScar, setNewScar] = useState({
    descripcion_desvio: "",
    vincular_nc: true
  });

  // SCAR Close Form
  const [showCloseScarModal, setShowCloseScarModal] = useState(false);
  const [scarResolution, setScarResolution] = useState({
    solucion_propuesta: "",
    comentarios_cierre: ""
  });

  // Computed Values
  const selectedProveedor = proveedores.find(p => p.id === selectedProveedorId) || proveedores[0];
  const selectedScar = scars.find(s => s.id === selectedScarId) || scars[0];
  const selectedProveedorEvaluations = evaluaciones.filter(e => e.proveedor_id === selectedProveedorId);
  const selectedProveedorScars = scars.filter(s => s.proveedor_id === selectedProveedorId);

  // SVG Radar Coordinates Calculation
  // Radar radius: 120 pixels, center coordinates: (200, 200)
  const getRadarPoints = (quality: number, delivery: number, service: number, compliance: number) => {
    const center = 200;
    const maxR = 130;
    
    // Top axis (0 deg): Calidad
    const qY = center - (maxR * (quality / 100));
    const qX = center;
    
    // Right axis (90 deg): Entrega
    const dY = center;
    const dX = center + (maxR * (delivery / 100));
    
    // Bottom axis (180 deg): Servicio
    const sY = center + (maxR * (service / 100));
    const sX = center;
    
    // Left axis (270 deg): Cumplimiento
    const cY = center;
    const cX = center - (maxR * (compliance / 100));
    
    return `${qX},${qY} ${dX},${dY} ${sX},${sY} ${cX},${cY}`;
  };

  // Weighted Evaluation Score Calculation
  const calculateWeightedScore = (q: number, d: number, s: number, c: number) => {
    return (q * 0.4) + (d * 0.3) + (s * 0.2) + (c * 0.1);
  };

  // Handlers
  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplier.razon_social || !newSupplier.rut_tax_id) return;
    
    const created: Proveedor = {
      id: "p_" + Math.random().toString(36).substr(2, 9),
      ...newSupplier,
      estado: "prospecto",
      calificacion_promedio: 0.00
    };
    
    setProveedores([...proveedores, created]);
    setSelectedProveedorId(created.id);
    setShowAddSupplierModal(false);
    setNewSupplier({
      razon_social: "",
      rut_tax_id: "",
      contacto_nombre: "",
      contacto_email: "",
      contacto_telefono: "",
      categoria: "critico"
    });
  };

  const handleCreateEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    const score = calculateWeightedScore(
      newEval.criterio_calidad,
      newEval.criterio_entrega,
      newEval.criterio_servicio,
      newEval.criterio_cumplimiento
    );

    let resultado: "aprobado" | "condicional" | "rechazado" = "aprobado";
    let nuevo_estado: "homologado" | "evaluado" | "suspendido" = "homologado";

    if (score < 60) {
      resultado = "rechazado";
      nuevo_estado = "suspendido";
    } else if (score < 80) {
      resultado = "condicional";
      nuevo_estado = "evaluado";
    }

    const created: Evaluacion = {
      id: "ev_" + Math.random().toString(36).substr(2, 9),
      proveedor_id: selectedProveedorId,
      fecha_evaluacion: newEval.fecha_evaluacion,
      criterio_calidad: newEval.criterio_calidad,
      criterio_entrega: newEval.criterio_entrega,
      criterio_servicio: newEval.criterio_servicio,
      criterio_cumplimiento: newEval.criterio_cumplimiento,
      puntaje_global: score,
      resultado,
      comentarios: newEval.comentarios || "Evaluación periódica completada satisfactoriamente.",
      evaluador: "Auditor Interno SGI"
    };

    const updatedEvaluations = [...evaluaciones, created];
    setEvaluaciones(updatedEvaluations);

    // Recalculate average
    const supplierEvals = updatedEvaluations.filter(ev => ev.proveedor_id === selectedProveedorId);
    const avg = supplierEvals.reduce((acc, curr) => acc + curr.puntaje_global, 0) / supplierEvals.length;

    // Update Proveedor
    setProveedores(proveedores.map(p => {
      if (p.id === selectedProveedorId) {
        return {
          ...p,
          estado: nuevo_estado,
          calificacion_promedio: parseFloat(avg.toFixed(2))
        };
      }
      return p;
    }));

    setShowAddEvalModal(false);
    setNewEval({
      fecha_evaluacion: new Date().toISOString().split("T")[0],
      criterio_calidad: 80,
      criterio_entrega: 80,
      criterio_servicio: 80,
      criterio_cumplimiento: 80,
      comentarios: ""
    });
  };

  const handleCreateScar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScar.descripcion_desvio) return;

    const code = `SCAR-PRV-${Math.floor(1000 + Math.random() * 9000)}B`;

    const created: SCAR = {
      id: "scar_" + Math.random().toString(36).substr(2, 9),
      proveedor_id: selectedProveedorId,
      codigo: code,
      descripcion_desvio: newScar.descripcion_desvio,
      fecha_reclamo: new Date().toISOString().split("T")[0],
      estado: "abierto",
      non_conformity_id: newScar.vincular_nc ? "nc-mock-" + Math.random().toString(36).substr(2, 4) : undefined
    };

    setScars([...scars, created]);
    setSelectedScarId(created.id);
    setShowAddScarModal(false);
    setNewScar({
      descripcion_desvio: "",
      vincular_nc: true
    });
  };

  const handleCloseScar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scarResolution.solucion_propuesta || !scarResolution.comentarios_cierre) return;

    setScars(scars.map(s => {
      if (s.id === selectedScarId) {
        return {
          ...s,
          estado: "cerrado",
          solucion_propuesta: scarResolution.solucion_propuesta,
          comentarios_cierre: scarResolution.comentarios_cierre,
          fecha_cierre: new Date().toISOString().split("T")[0]
        };
      }
      return s;
    }));

    setShowCloseScarModal(false);
    setScarResolution({
      solucion_propuesta: "",
      comentarios_cierre: ""
    });
  };

  const handleScarProposeAction = (scarId: string, actionText: string) => {
    setScars(scars.map(s => {
      if (s.id === scarId) {
        return {
          ...s,
          estado: "respondido",
          solucion_propuesta: actionText
        };
      }
      return s;
    }));
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Portal de Calidad e Integridad de Proveedores
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gestión estratégica, homologación y control de la cadena de suministro según ISO 9001:2015 (Cláusula 8.4)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowAddSupplierModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl shadow-md hover:shadow-lg transition text-sm font-semibold border border-indigo-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Homologar Proveedor</span>
          </button>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="flex border-b border-border space-x-8">
        <button
          onClick={() => setActiveTab("directorio")}
          className={`pb-4 text-sm font-semibold tracking-wide border-b-2 transition relative flex items-center gap-2 ${
            activeTab === "directorio" 
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400" 
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Directorio & Homologación</span>
        </button>
        <button
          onClick={() => setActiveTab("evaluaciones")}
          className={`pb-4 text-sm font-semibold tracking-wide border-b-2 transition relative flex items-center gap-2 ${
            activeTab === "evaluaciones" 
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400" 
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>Evaluaciones de Desempeño</span>
        </button>
        <button
          onClick={() => setActiveTab("reclamos")}
          className={`pb-4 text-sm font-semibold tracking-wide border-b-2 transition relative flex items-center gap-2 ${
            activeTab === "reclamos" 
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400" 
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Acciones Correctivas (SCAR)</span>
          {scars.filter(s => s.estado === "abierto").length > 0 && (
            <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold animate-pulse">
              {scars.filter(s => s.estado === "abierto").length}
            </span>
          )}
        </button>
      </div>

      {/* ----------------TAB: DIRECTORIO ---------------- */}
      {activeTab === "directorio" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Supplier List */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-500" />
              <span>Proveedores Registrados</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {proveedores.map(prov => {
                const isSelected = selectedProveedorId === prov.id;
                
                // Color configuration
                let badgeColor = "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-400 border-yellow-200/50";
                let badgeText = "Prospecto";
                if (prov.estado === "homologado") {
                  badgeColor = "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400 border-green-200/50";
                  badgeText = "Homologado";
                } else if (prov.estado === "evaluado") {
                  badgeColor = "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200/50";
                  badgeText = "Evaluado";
                } else if (prov.estado === "suspendido") {
                  badgeColor = "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400 border-red-200/50";
                  badgeText = "Suspendido";
                }

                const catBadge = prov.categoria === "critico" 
                  ? "border-red-500/20 text-red-500 bg-red-50/30" 
                  : prov.categoria === "estrategico"
                    ? "border-purple-500/20 text-purple-500 bg-purple-50/30"
                    : "border-gray-500/20 text-gray-500 bg-gray-50/30";

                return (
                  <div
                    key={prov.id}
                    onClick={() => setSelectedProveedorId(prov.id)}
                    className={`p-5 rounded-2xl border transition cursor-pointer relative group flex flex-col justify-between ${
                      isSelected
                        ? "bg-white dark:bg-zinc-900 border-indigo-500/60 shadow-lg shadow-indigo-500/5 dark:shadow-indigo-500/10"
                        : "bg-white/60 dark:bg-zinc-900/60 border-border hover:bg-white hover:border-indigo-500/30 shadow-sm"
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${catBadge}`}>
                          {prov.categoria}
                        </span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeColor}`}>
                          {badgeText}
                        </span>
                      </div>
                      
                      <h4 className="font-bold text-base text-foreground mb-1 group-hover:text-indigo-500 transition">
                        {prov.razon_social}
                      </h4>
                      <p className="text-xs text-muted-foreground mb-2">Tax ID: {prov.rut_tax_id}</p>
                      
                      <div className="space-y-1 text-xs text-muted-foreground border-t border-border pt-3">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-indigo-500/70" />
                          <span className="truncate">{prov.contacto_nombre || "Sin Contacto"}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Star className="w-3.5 h-3.5 text-yellow-500" />
                          <span>Puntaje Promedio: <strong className="text-foreground">{prov.calificacion_promedio > 0 ? `${prov.calificacion_promedio}%` : "S/E"}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition">
                      <span>Ver Ficha Técnica</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ficha Proveedor Details */}
          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur border border-border rounded-3xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 border-b border-border pb-4 mb-5">
                <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight text-foreground">{selectedProveedor.razon_social}</h3>
                  <span className="text-xs text-muted-foreground">ID Proveedor: {selectedProveedor.id}</span>
                </div>
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground block">Razón Social / Razón Comercial</span>
                  <span className="font-semibold text-foreground">{selectedProveedor.razon_social}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">RUT / Identificación Tributaria</span>
                  <span className="font-semibold text-foreground">{selectedProveedor.rut_tax_id}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Categoría de Criticidad (ISO 9001 Cl. 8.4)</span>
                  <span className="font-semibold text-foreground uppercase tracking-wider text-xs bg-indigo-500/10 text-indigo-600 px-2 py-0.5 rounded-full inline-block mt-1 border border-indigo-500/10">
                    {selectedProveedor.categoria}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Contacto Primario de Ventas/Operaciones</span>
                  <span className="font-semibold text-foreground block mt-0.5">{selectedProveedor.contacto_nombre}</span>
                  <span className="text-xs text-muted-foreground block">{selectedProveedor.contacto_email}</span>
                  <span className="text-xs text-muted-foreground block">{selectedProveedor.contacto_telefono}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Estado de Homologación SGI</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 block mt-1 uppercase text-xs tracking-wider">
                    {selectedProveedor.estado}
                  </span>
                </div>
              </div>

              {/* Summary KPIs */}
              <div className="grid grid-cols-2 gap-3 mt-6 pt-5 border-t border-border">
                <div className="bg-muted/40 p-3 rounded-2xl border border-border/50 text-center">
                  <span className="text-[10px] text-muted-foreground block uppercase font-bold tracking-wider">Calificación SGI</span>
                  <span className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1 block">
                    {selectedProveedor.calificacion_promedio > 0 ? `${selectedProveedor.calificacion_promedio}%` : "S/E"}
                  </span>
                </div>
                <div className="bg-muted/40 p-3 rounded-2xl border border-border/50 text-center">
                  <span className="text-[10px] text-muted-foreground block uppercase font-bold tracking-wider">Reclamos Activos</span>
                  <span className={`text-xl font-extrabold mt-1 block ${selectedProveedorScars.filter(s => s.estado === "abierto").length > 0 ? "text-red-500" : "text-green-500"}`}>
                    {selectedProveedorScars.filter(s => s.estado === "abierto").length}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-2.5">
              <button 
                onClick={() => {
                  setActiveTab("evaluaciones");
                  setShowAddEvalModal(true);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 rounded-xl transition text-xs font-bold border border-indigo-600/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Registrar Evaluación ISO</span>
              </button>
              <button 
                onClick={() => {
                  setActiveTab("reclamos");
                  setShowAddScarModal(true);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-600/10 hover:bg-red-600/20 text-red-600 dark:text-red-400 rounded-xl transition text-xs font-bold border border-red-600/20"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Abrir Reclamo (SCAR)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------TAB: EVALUACIONES ---------------- */}
      {activeTab === "evaluaciones" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls & Graph */}
          <div className="lg:col-span-8 bg-white/70 dark:bg-zinc-900/70 border border-border rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Scale className="w-5 h-5 text-indigo-500" />
                  <span>Desempeño Integral de Calidad</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Representación gráfica radial (radar) y ponderación de cumplimiento</p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={selectedProveedorId}
                  onChange={(e) => setSelectedProveedorId(e.target.value)}
                  className="bg-muted px-4 py-2 text-sm rounded-xl border border-border text-foreground font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {proveedores.map(p => (
                    <option key={p.id} value={p.id}>{p.razon_social}</option>
                  ))}
                </select>
                <button 
                  onClick={() => setShowAddEvalModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow hover:shadow-md transition border border-indigo-500/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nueva Evaluación</span>
                </button>
              </div>
            </div>

            {/* RADAR SVG CHART (WOW FACTOR) */}
            <div className="flex flex-col md:flex-row items-center justify-around gap-6 py-6 bg-muted/20 rounded-2xl border border-border/40">
              <div className="relative w-[340px] h-[340px] flex items-center justify-center bg-white/40 dark:bg-zinc-950/40 rounded-full shadow-inner border border-border/50">
                <svg width="340" height="340" className="overflow-visible select-none">
                  {/* Concentric rings/grid */}
                  {[0.2, 0.4, 0.6, 0.8, 1.0].map((scale, i) => {
                    const r = 130 * scale;
                    // Draw octagon points for grid
                    const p1 = `200,${200 - r}`;
                    const p2 = `${200 + r},200`;
                    const p3 = `200,${200 + r}`;
                    const p4 = `${200 - r},200`;
                    return (
                      <polygon
                        key={i}
                        points={`${p1} ${p2} ${p3} ${p4}`}
                        fill="none"
                        className="stroke-border/40"
                        strokeWidth="1"
                        strokeDasharray={i === 4 ? "none" : "3,3"}
                        transform="translate(-30, -30)"
                      />
                    );
                  })}

                  {/* Axes lines */}
                  <line x1="170" y1="40" x2="170" y2="300" className="stroke-border/30" strokeWidth="1" />
                  <line x1="40" y1="170" x2="300" y2="170" className="stroke-border/30" strokeWidth="1" />

                  {/* Axis labels */}
                  <text x="170" y="25" textAnchor="middle" className="text-[10px] font-bold fill-indigo-600 dark:fill-indigo-400 uppercase tracking-widest">Calidad (40%)</text>
                  <text x="310" y="174" textAnchor="start" className="text-[10px] font-bold fill-purple-600 dark:fill-purple-400 uppercase tracking-widest">Entrega (30%)</text>
                  <text x="170" y="325" textAnchor="middle" className="text-[10px] font-bold fill-pink-600 dark:fill-pink-400 uppercase tracking-widest">Servicio (20%)</text>
                  <text x="30" y="174" textAnchor="end" className="text-[10px] font-bold fill-emerald-600 dark:fill-emerald-400 uppercase tracking-widest">Cumple (10%)</text>

                  {/* Radar Polygon drawing */}
                  {(() => {
                    const evs = selectedProveedorEvaluations[0];
                    const qual = evs ? evs.criterio_calidad : 80;
                    const del = evs ? evs.criterio_entrega : 80;
                    const serv = evs ? evs.criterio_servicio : 80;
                    const comp = evs ? evs.criterio_cumplimiento : 80;

                    const center = 170;
                    const maxR = 130;
                    
                    const qY = center - (maxR * (qual / 100));
                    const dX = center + (maxR * (del / 100));
                    const sY = center + (maxR * (serv / 100));
                    const cX = center - (maxR * (comp / 100));

                    const pointsStr = `${center},${qY} ${dX},${center} ${center},${sY} ${cX},${center}`;

                    return (
                      <>
                        {/* Shaded Area */}
                        <polygon
                          points={pointsStr}
                          className="fill-indigo-500/20 stroke-indigo-500"
                          strokeWidth="2.5"
                          filter="url(#glow)"
                        />
                        {/* Glow effect filter */}
                        <defs>
                          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#6366f1" floodOpacity="0.3" />
                          </filter>
                        </defs>
                        {/* Dot Vertices */}
                        <circle cx={center} cy={qY} r="4" className="fill-indigo-600 stroke-white dark:stroke-zinc-950" strokeWidth="1.5" />
                        <circle cx={dX} cy={center} r="4" className="fill-purple-600 stroke-white dark:stroke-zinc-950" strokeWidth="1.5" />
                        <circle cx={center} cy={sY} r="4" className="fill-pink-600 stroke-white dark:stroke-zinc-950" strokeWidth="1.5" />
                        <circle cx={cX} cy={center} r="4" className="fill-emerald-600 stroke-white dark:stroke-zinc-950" strokeWidth="1.5" />

                        {/* Visual grid numbers */}
                        <text x="178" y="105" className="text-[8px] fill-muted-foreground/60">50%</text>
                        <text x="178" y="44" className="text-[8px] fill-muted-foreground/60">100%</text>
                      </>
                    );
                  })()}
                </svg>
              </div>

              {/* Score Breakdown Metrics */}
              <div className="space-y-4 w-full md:w-56">
                <div className="p-4 bg-white dark:bg-zinc-950 rounded-2xl border border-border shadow-sm text-center relative overflow-hidden group">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Puntaje Reciente</span>
                  <span className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1 block">
                    {selectedProveedorEvaluations.length > 0 
                      ? `${selectedProveedorEvaluations[0].puntaje_global}%`
                      : "S/E"}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-2 ${
                    selectedProveedorEvaluations.length > 0 && selectedProveedorEvaluations[0].resultado === "aprobado"
                      ? "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400"
                      : selectedProveedorEvaluations.length > 0 && selectedProveedorEvaluations[0].resultado === "condicional"
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-400"
                        : "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400"
                  }`}>
                    {selectedProveedorEvaluations.length > 0 
                      ? selectedProveedorEvaluations[0].resultado.toUpperCase()
                      : "SIN REGISTROS"}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-zinc-950 border border-border">
                    <span className="font-semibold text-muted-foreground">Calidad (40%):</span>
                    <span className="font-bold text-foreground">{selectedProveedorEvaluations.length > 0 ? `${selectedProveedorEvaluations[0].criterio_calidad}%` : "S/E"}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-zinc-950 border border-border">
                    <span className="font-semibold text-muted-foreground">Entrega (30%):</span>
                    <span className="font-bold text-foreground">{selectedProveedorEvaluations.length > 0 ? `${selectedProveedorEvaluations[0].criterio_entrega}%` : "S/E"}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-zinc-950 border border-border">
                    <span className="font-semibold text-muted-foreground">Servicio (20%):</span>
                    <span className="font-bold text-foreground">{selectedProveedorEvaluations.length > 0 ? `${selectedProveedorEvaluations[0].criterio_servicio}%` : "S/E"}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-zinc-950 border border-border">
                    <span className="font-semibold text-muted-foreground">Cumplimiento (10%):</span>
                    <span className="font-bold text-foreground">{selectedProveedorEvaluations.length > 0 ? `${selectedProveedorEvaluations[0].criterio_cumplimiento}%` : "S/E"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Historial Evaluations List */}
          <div className="lg:col-span-4 bg-white/70 dark:bg-zinc-900/70 border border-border rounded-3xl p-6 shadow-xl flex flex-col">
            <h3 className="text-base font-bold text-foreground border-b border-border pb-4 mb-4 flex items-center gap-1.5">
              <Calendar className="w-4.5 h-4.5 text-indigo-500" />
              <span>Historial de Evaluaciones</span>
            </h3>

            <div className="space-y-4 overflow-y-auto flex-1 max-h-[350px]">
              {selectedProveedorEvaluations.length === 0 ? (
                <div className="text-center py-10">
                  <HelpCircle className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-xs text-muted-foreground">Este proveedor aún no posee auditorías de desempeño registradas.</p>
                </div>
              ) : (
                selectedProveedorEvaluations.map(ev => {
                  let badge = "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400";
                  if (ev.resultado === "condicional") {
                    badge = "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-400";
                  } else if (ev.resultado === "rechazado") {
                    badge = "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400";
                  }
                  
                  return (
                    <div key={ev.id} className="p-4 bg-muted/30 rounded-2xl border border-border/50 space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-foreground flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                          {ev.fecha_evaluacion}
                        </span>
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${badge}`}>
                          {ev.puntaje_global}% - {ev.resultado}
                        </span>
                      </div>
                      
                      <p className="text-muted-foreground italic line-clamp-3">"{ev.comentarios}"</p>
                      
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/40">
                        <span>Evaluó: {ev.evaluador}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ----------------TAB: RECLAMOS (SCAR) ---------------- */}
      {activeTab === "reclamos" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* SCAR List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-red-500" />
                  <span>Registro de Reclamos y Desvíos (SCAR)</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Control de no conformidades del proveedor y planes de acción preventivos</p>
              </div>
              <button 
                onClick={() => setShowAddScarModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold shadow hover:shadow-md transition border border-red-500/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Registrar SCAR</span>
              </button>
            </div>

            <div className="space-y-4">
              {scars.map(scar => {
                const prov = proveedores.find(p => p.id === scar.proveedor_id) || proveedores[0];
                const isSelected = selectedScarId === scar.id;
                
                let statusBadge = "border-red-500/20 text-red-500 bg-red-50/20";
                if (scar.estado === "respondido") {
                  statusBadge = "border-yellow-500/20 text-yellow-500 bg-yellow-50/20";
                } else if (scar.estado === "cerrado") {
                  statusBadge = "border-green-500/20 text-green-500 bg-green-50/20";
                }

                return (
                  <div
                    key={scar.id}
                    onClick={() => setSelectedScarId(scar.id)}
                    className={`p-5 rounded-2xl border transition cursor-pointer relative flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      isSelected
                        ? "bg-white dark:bg-zinc-900 border-red-500/50 shadow-lg shadow-red-500/5"
                        : "bg-white/60 dark:bg-zinc-900/60 border-border hover:bg-white hover:border-red-500/20 shadow-sm"
                    }`}
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-extrabold text-sm text-foreground">{scar.codigo}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusBadge}`}>
                          {scar.estado}
                        </span>
                        {scar.non_conformity_id && (
                          <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 px-2 py-0.5 rounded-full border border-indigo-500/10">
                            VINCULADO A CAPA
                          </span>
                        )}
                      </div>
                      
                      <p className="text-xs font-semibold text-muted-foreground">Proveedor: <span className="text-foreground">{prov.razon_social}</span></p>
                      <p className="text-sm text-foreground/80 font-medium line-clamp-2">"{scar.descripcion_desvio}"</p>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center text-xs text-muted-foreground font-semibold">
                      <span>{scar.fecha_reclamo}</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SCAR Pipeline Details */}
          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur border border-border rounded-3xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 border-b border-border pb-4 mb-5">
                <div className="p-3 bg-red-500/10 text-red-600 dark:text-red-400 rounded-2xl">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight text-foreground">{selectedScar.codigo}</h3>
                  <span className="text-xs text-muted-foreground">Reclamo de Desempeño ISO</span>
                </div>
              </div>

              {/* STEPPER TRACKER */}
              <div className="bg-muted/40 p-4 rounded-2xl border border-border/50 mb-6">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block mb-3 text-center">Estado del Pipeline SCAR</span>
                <div className="flex items-center justify-between text-xs relative">
                  {/* Background Line */}
                  <div className="absolute top-4 left-1/10 right-1/10 h-0.5 bg-border z-0"></div>
                  
                  {/* Step 1 */}
                  <div className="flex flex-col items-center gap-1.5 relative z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition border ${
                      selectedScar.estado === "abierto" || selectedScar.estado === "respondido" || selectedScar.estado === "cerrado"
                        ? "bg-red-500 text-white border-red-600"
                        : "bg-muted text-muted-foreground border-border"
                    }`}>
                      1
                    </div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase">Abierto</span>
                  </div>

                  {/* Step 2 */}
                  <div className="flex flex-col items-center gap-1.5 relative z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition border ${
                      selectedScar.estado === "respondido" || selectedScar.estado === "cerrado"
                        ? "bg-yellow-500 text-white border-yellow-600"
                        : "bg-muted text-muted-foreground border-border"
                    }`}>
                      2
                    </div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase">Respondido</span>
                  </div>

                  {/* Step 3 */}
                  <div className="flex flex-col items-center gap-1.5 relative z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition border ${
                      selectedScar.estado === "cerrado"
                        ? "bg-green-500 text-white border-green-600"
                        : "bg-muted text-muted-foreground border-border"
                    }`}>
                      3
                    </div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase">Cerrado</span>
                  </div>
                </div>
              </div>

              {/* Details Body */}
              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Desvío de Calidad</span>
                  <p className="font-semibold text-foreground block mt-1 leading-relaxed bg-muted/20 p-3 rounded-xl border border-border/30">
                    "{selectedScar.descripcion_desvio}"
                  </p>
                </div>

                {selectedScar.solucion_propuesta ? (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-yellow-600 dark:text-yellow-400 block">Plan de Acción / Solución</span>
                    <p className="font-semibold text-foreground block mt-1 leading-relaxed bg-yellow-500/5 p-3 rounded-xl border border-yellow-500/10">
                      "{selectedScar.solucion_propuesta}"
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20 text-center">
                    <AlertTriangle className="w-5 h-5 text-yellow-500 mx-auto mb-1.5" />
                    <p className="text-[10px] text-yellow-700 dark:text-yellow-400 font-semibold leading-relaxed">
                      El proveedor aún no ha enviado su propuesta de solución formal.
                    </p>
                    <button
                      onClick={() => handleScarProposeAction(selectedScar.id, "Proveedor implementará revisión de procesos y reforzamiento de aseguramiento de calidad.")}
                      className="mt-2 text-[10px] text-yellow-800 dark:text-yellow-300 font-extrabold hover:underline"
                    >
                      [Simular Respuesta de Proveedor]
                    </button>
                  </div>
                )}

                {selectedScar.estado === "cerrado" && (
                  <>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-green-600 dark:text-green-400 block">Verificación de Cierre</span>
                      <p className="font-semibold text-foreground block mt-1 leading-relaxed bg-green-500/5 p-3 rounded-xl border border-green-500/10">
                        "{selectedScar.comentarios_cierre}"
                      </p>
                    </div>
                    <div className="flex justify-between items-center bg-green-500/10 p-2.5 rounded-xl border border-green-500/20">
                      <span className="text-[10px] text-green-700 dark:text-green-300 font-bold uppercase">Cierre Formal</span>
                      <span className="font-bold text-green-700 dark:text-green-300">{selectedScar.fecha_cierre}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {selectedScar.estado !== "cerrado" && (
              <div className="mt-6">
                <button 
                  disabled={!selectedScar.solucion_propuesta}
                  onClick={() => setShowCloseScarModal(true)}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl transition text-xs font-bold border ${
                    selectedScar.solucion_propuesta
                      ? "bg-green-600 hover:bg-green-500 text-white border-green-500/20"
                      : "bg-muted text-muted-foreground border-border cursor-not-allowed"
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verificar y Cerrar SCAR</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------- MODALS LAYOUT ---------------- */}

      {/* modal: Add Supplier */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-950 rounded-3xl border border-border shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border flex items-center justify-between bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5">
              <div>
                <h3 className="font-bold text-lg text-foreground">Añadir Nuevo Proveedor</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Registro e inicio del proceso de homologación SGI</p>
              </div>
              <button onClick={() => setShowAddSupplierModal(false)} className="p-1 hover:bg-muted rounded-lg transition text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateSupplier} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">Razón Social</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej: Insumos Industriales SpA"
                  value={newSupplier.razon_social}
                  onChange={(e) => setNewSupplier({...newSupplier, razon_social: e.target.value})}
                  className="w-full bg-muted border border-border rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">RUT / Tax ID</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ej: 76.222.333-4"
                    value={newSupplier.rut_tax_id}
                    onChange={(e) => setNewSupplier({...newSupplier, rut_tax_id: e.target.value})}
                    className="w-full bg-muted border border-border rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">Categoría Criticidad</label>
                  <select 
                    value={newSupplier.categoria}
                    onChange={(e) => setNewSupplier({...newSupplier, categoria: e.target.value as any})}
                    className="w-full bg-muted border border-border rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="critico">Crítico (Insumos Primarios)</option>
                    <option value="estrategico">Estratégico (Alta Dependencia)</option>
                    <option value="soporte">Soporte (Indirectos)</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-border/60 pt-4">
                <span className="text-[10px] text-indigo-500 uppercase font-bold tracking-wider block mb-2">Contacto de Emergencia/Ventas</span>
                <div className="space-y-3">
                  <input 
                    type="text" 
                    placeholder="Nombre del Contacto"
                    value={newSupplier.contacto_nombre}
                    onChange={(e) => setNewSupplier({...newSupplier, contacto_nombre: e.target.value})}
                    className="w-full bg-muted border border-border rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input 
                      type="email" 
                      placeholder="Correo Electrónico"
                      value={newSupplier.contacto_email}
                      onChange={(e) => setNewSupplier({...newSupplier, contacto_email: e.target.value})}
                      className="w-full bg-muted border border-border rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <input 
                      type="text" 
                      placeholder="Teléfono Directo"
                      value={newSupplier.contacto_telefono}
                      onChange={(e) => setNewSupplier({...newSupplier, contacto_telefono: e.target.value})}
                      className="w-full bg-muted border border-border rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-border pt-4 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowAddSupplierModal(false)}
                  className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-xl transition"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition font-semibold"
                >
                  Homologar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* modal: Add Evaluation */}
      {showAddEvalModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-950 rounded-3xl border border-border shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border flex items-center justify-between bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5">
              <div>
                <h3 className="font-bold text-lg text-foreground">Nueva Evaluación de Desempeño</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Auditoría de Calidad para {selectedProveedor.razon_social}</p>
              </div>
              <button onClick={() => setShowAddEvalModal(false)} className="p-1 hover:bg-muted rounded-lg transition text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateEvaluation} className="p-6 space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-xs font-bold text-muted-foreground block mb-1">Fecha de Auditoría</label>
                  <input 
                    type="date" 
                    required
                    value={newEval.fecha_evaluacion}
                    onChange={(e) => setNewEval({...newEval, fecha_evaluacion: e.target.value})}
                    className="w-full bg-muted border border-border rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* SLIDERS WIZARD */}
              <div className="space-y-3 bg-muted/30 p-4 rounded-2xl border border-border/50">
                <span className="text-[10px] text-indigo-500 uppercase font-bold tracking-wider block mb-2 text-center">Criterios de Desempeño (0-100)</span>
                
                <div>
                  <div className="flex justify-between text-xs font-bold text-muted-foreground mb-1">
                    <span>Calidad del Producto/Insumo (40%)</span>
                    <span className="text-foreground">{newEval.criterio_calidad}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="100" 
                    value={newEval.criterio_calidad}
                    onChange={(e) => setNewEval({...newEval, criterio_calidad: parseInt(e.target.value)})}
                    className="w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-muted-foreground mb-1">
                    <span>Cumplimiento Logístico/Entrega (30%)</span>
                    <span className="text-foreground">{newEval.criterio_entrega}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="100" 
                    value={newEval.criterio_entrega}
                    onChange={(e) => setNewEval({...newEval, criterio_entrega: parseInt(e.target.value)})}
                    className="w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-muted-foreground mb-1">
                    <span>Servicio Post-Venta/Soporte (20%)</span>
                    <span className="text-foreground">{newEval.criterio_servicio}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="100" 
                    value={newEval.criterio_servicio}
                    onChange={(e) => setNewEval({...newEval, criterio_servicio: parseInt(e.target.value)})}
                    className="w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-pink-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-muted-foreground mb-1">
                    <span>Cumplimiento Legal/ISO SGI (10%)</span>
                    <span className="text-foreground">{newEval.criterio_cumplimiento}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="100" 
                    value={newEval.criterio_cumplimiento}
                    onChange={(e) => setNewEval({...newEval, criterio_cumplimiento: parseInt(e.target.value)})}
                    className="w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                </div>

                {/* Score calculated preview */}
                <div className="border-t border-border/60 pt-3 mt-3 flex justify-between items-center">
                  <span className="text-xs font-bold text-foreground uppercase">Resultado Estimado:</span>
                  <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400">
                    {calculateWeightedScore(
                      newEval.criterio_calidad,
                      newEval.criterio_entrega,
                      newEval.criterio_servicio,
                      newEval.criterio_cumplimiento
                    ).toFixed(2)}%
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">Comentarios / Observaciones</label>
                <textarea 
                  rows={3}
                  placeholder="Detalles sobre el lote verificado, evidencias técnicas y desviaciones tolerables..."
                  value={newEval.comentarios}
                  onChange={(e) => setNewEval({...newEval, comentarios: e.target.value})}
                  className="w-full bg-muted border border-border rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-border pt-4 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowAddEvalModal(false)}
                  className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-xl transition"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition font-semibold"
                >
                  Registrar Auditoría
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* modal: Add SCAR */}
      {showAddScarModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-950 rounded-3xl border border-border shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border flex items-center justify-between bg-gradient-to-r from-red-500/5 via-orange-500/5 to-yellow-500/5">
              <div>
                <h3 className="font-bold text-lg text-foreground">Abrir Reclamo de Calidad (SCAR)</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Reportar desvíos técnicos en materiales provistos por {selectedProveedor.razon_social}</p>
              </div>
              <button onClick={() => setShowAddScarModal(false)} className="p-1 hover:bg-muted rounded-lg transition text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateScar} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">Descripción del Desvío de Calidad</label>
                <textarea 
                  rows={4}
                  required
                  placeholder="Detallar las no conformidades detectadas, números de lote involucrados y fallas de embalaje/desvíos técnicos..."
                  value={newScar.descripcion_desvio}
                  onChange={(e) => setNewScar({...newScar, descripcion_desvio: e.target.value})}
                  className="w-full bg-muted border border-border rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div className="bg-indigo-500/5 p-4 rounded-2xl border border-indigo-500/10 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 block">Vincular a CAPA SGI (M06)</span>
                  <span className="text-[10px] text-muted-foreground block mt-0.5">Clona este reclamo como No Conformidad en la consola general del SGI</span>
                </div>
                <input 
                  type="checkbox"
                  checked={newScar.vincular_nc}
                  onChange={(e) => setNewScar({...newScar, vincular_nc: e.target.checked})}
                  className="w-4.5 h-4.5 rounded text-indigo-600 border-border bg-muted focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-border pt-4 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowAddScarModal(false)}
                  className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-xl transition"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 text-sm bg-red-600 hover:bg-red-500 text-white rounded-xl transition font-semibold"
                >
                  Enviar Reclamo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* modal: Close SCAR */}
      {showCloseScarModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-950 rounded-3xl border border-border shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border flex items-center justify-between bg-gradient-to-r from-green-500/5 via-emerald-500/5 to-teal-500/5">
              <div>
                <h3 className="font-bold text-lg text-foreground">Cierre Formal de Reclamo (SCAR)</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Verificación de efectividad de las acciones para {selectedScar.codigo}</p>
              </div>
              <button onClick={() => setShowCloseScarModal(false)} className="p-1 hover:bg-muted rounded-lg transition text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCloseScar} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">Acción Implementada por el Proveedor</label>
                <textarea 
                  rows={3}
                  required
                  placeholder="Describir las medidas correctivas que el proveedor declara haber implementado..."
                  value={scarResolution.solucion_propuesta || selectedScar.solucion_propuesta || ""}
                  onChange={(e) => setScarResolution({...scarResolution, solucion_propuesta: e.target.value})}
                  className="w-full bg-muted border border-border rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">Comentarios de Auditoría y Verificación de Cierre</label>
                <textarea 
                  rows={3}
                  required
                  placeholder="Detallar por qué se considera efectiva la solución y si los desvíos han quedado resueltos definitivamente..."
                  value={scarResolution.comentarios_cierre}
                  onChange={(e) => setScarResolution({...scarResolution, comentarios_cierre: e.target.value})}
                  className="w-full bg-muted border border-border rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-border pt-4 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowCloseScarModal(false)}
                  className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-xl transition"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 text-sm bg-green-600 hover:bg-green-500 text-white rounded-xl transition font-semibold"
                >
                  Verificar y Cerrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
