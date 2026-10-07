"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Printer, Pencil, Save, Plus, Trash2, Loader2, X } from "lucide-react";

interface Franja {
  desde: string;
  hasta: string;
  actividad: string;
  detalle?: string | null;
  requisitos?: string | null;
  responsables?: string | null;
}

interface Plan {
  id: string;
  programa_id: string;
  programa_titulo?: string | null;
  codigo: string;
  revision: string;
  fecha_emision: string;
  norma?: string | null;
  organizacion?: string | null;
  ente_certificador?: string | null;
  lugar_sede?: string | null;
  auditor_lider?: string | null;
  coordinador_sgc?: string | null;
  fecha_auditoria?: string | null;
  jornada?: string | null;
  objetivo?: string | null;
  alcance?: string | null;
  criterios?: string | null;
  cronograma: Franja[];
}

const PRINT_CSS = `
@media print {
  aside, header { display: none !important; }
  main { padding: 0 !important; overflow: visible !important; }
  body { background: #fff !important; }
  .no-print { display: none !important; }
  .plan-sheet { box-shadow: none !important; border: 0 !important; max-width: none !important; padding: 0 !important; }
  .plan-sheet tr { break-inside: avoid; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  @page { size: A4; margin: 12mm; }
}`;

/** "Calidad" para ISO 9001, "Ambiente" para 14001, etc. Da el título del documento. */
function disciplinaDeNorma(norma?: string | null): string {
  const n = norma || "";
  if (n.startsWith("ISO 9001")) return "Calidad";
  if (n.startsWith("ISO 14001")) return "Ambiente";
  if (n.startsWith("ISO 45001")) return "Seguridad y Salud en el Trabajo";
  if (n.startsWith("ISO 27001")) return "Seguridad de la Información";
  return "del Sistema de Gestión";
}

/**
 * Las fechas llegan como "YYYY-MM-DD". `new Date("2026-10-07")` se interpreta
 * como medianoche UTC, que en Argentina es el día anterior: hay que anclarla a
 * la hora local o el plan muestra un día menos.
 */
function fechaLocal(iso?: string | null): Date | null {
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00`);
  return isNaN(d.getTime()) ? null : d;
}

/** dd/mm/aaaa con ceros: en un documento formal "7/10/2026" queda flojo. */
function fechaCorta(iso?: string | null): string {
  const d = fechaLocal(iso);
  if (!d) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function fechaConDia(iso?: string | null): string {
  const d = fechaLocal(iso);
  if (!d) return "—";
  const dia = d.toLocaleDateString("es-AR", { weekday: "long" });
  return `${dia.charAt(0).toUpperCase()}${dia.slice(1)} ${fechaCorta(iso)}`;
}

const FRANJA_VACIA: Franja = {
  desde: "", hasta: "", actividad: "", detalle: "", requisitos: "", responsables: "",
};

export default function PlanAuditoriaPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const programaId = params?.id as string;
  const token = (session as any)?.accessToken;
  const api = process.env.NEXT_PUBLIC_API_URL || "";

  const [plan, setPlan] = useState<Plan | null>(null);
  const [borrador, setBorrador] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editando = borrador !== null;
  const vista = borrador ?? plan;

  const cargar = useCallback(async () => {
    try {
      const res = await fetch(`${api}/api/v1/auditorias/programas/${programaId}/plan`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setPlan(await res.json());
      } else {
        setError(
          res.status === 404
            ? "No se encontró el programa de auditoría."
            : "No se pudo cargar el plan de auditoría."
        );
      }
    } catch (e) {
      console.error(e);
      setError("No se pudo cargar el plan de auditoría. Revisá la conexión.");
    } finally {
      setLoading(false);
    }
  }, [api, programaId, token]);

  useEffect(() => {
    if (session?.user && programaId) cargar();
  }, [session, programaId, cargar]);

  const guardar = async () => {
    if (!borrador) return;
    setGuardando(true);
    try {
      const res = await fetch(`${api}/api/v1/auditorias/programas/${programaId}/plan`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          revision: borrador.revision,
          norma: borrador.norma,
          organizacion: borrador.organizacion,
          ente_certificador: borrador.ente_certificador,
          lugar_sede: borrador.lugar_sede,
          auditor_lider: borrador.auditor_lider,
          coordinador_sgc: borrador.coordinador_sgc,
          fecha_auditoria: borrador.fecha_auditoria || null,
          jornada: borrador.jornada,
          objetivo: borrador.objetivo,
          alcance: borrador.alcance,
          criterios: borrador.criterios,
          cronograma: borrador.cronograma,
        }),
      });
      if (res.ok) {
        setPlan(await res.json());
        setBorrador(null);
      } else {
        alert("No se pudieron guardar los cambios del plan.");
      }
    } catch (e) {
      console.error(e);
      alert("No se pudieron guardar los cambios. Revisá la conexión.");
    } finally {
      setGuardando(false);
    }
  };

  const set = (campo: keyof Plan, valor: string) =>
    setBorrador((b) => (b ? { ...b, [campo]: valor } : b));

  const setFranja = (i: number, campo: keyof Franja, valor: string) =>
    setBorrador((b) => {
      if (!b) return b;
      const cronograma = b.cronograma.map((f, j) => (j === i ? { ...f, [campo]: valor } : f));
      return { ...b, cronograma };
    });

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm p-8">
        <Loader2 className="w-4 h-4 animate-spin" /> Cargando el plan de auditoría…
      </div>
    );
  }
  if (error || !vista) {
    return (
      <div className="max-w-3xl mx-auto p-8">
        <p className="text-sm text-muted-foreground italic">{error || "No se pudo cargar el plan."}</p>
        <button
          onClick={() => router.push("/dashboard/auditorias")}
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary"
        >
          <ArrowLeft className="w-4 h-4" /> Volver a Auditorías
        </button>
      </div>
    );
  }

  const disciplina = disciplinaDeNorma(vista.norma);

  return (
    <div className="max-w-5xl mx-auto">
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />

      {/* Barra de herramientas (no se imprime) */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 mb-5">
        <button
          onClick={() => router.push("/dashboard/auditorias")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition"
        >
          <ArrowLeft className="w-4 h-4" /> Volver a Auditorías
        </button>
        <div className="flex items-center gap-2">
          {editando ? (
            <>
              <button
                onClick={() => setBorrador(null)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold border border-border px-3 py-2.5 rounded-lg hover:bg-muted transition"
              >
                <X className="w-4 h-4" /> Descartar
              </button>
              <button
                onClick={guardar}
                disabled={guardando}
                className="inline-flex items-center gap-1.5 text-xs font-semibold bg-primary text-white px-4 py-2.5 rounded-lg hover:bg-primary/90 transition shadow-sm disabled:opacity-60"
              >
                {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar cambios
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setBorrador(JSON.parse(JSON.stringify(plan)))}
                className="inline-flex items-center gap-1.5 text-xs font-semibold border border-border px-3 py-2.5 rounded-lg hover:bg-muted transition"
              >
                <Pencil className="w-4 h-4" /> Editar plan
              </button>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 text-xs font-semibold bg-primary text-white px-4 py-2.5 rounded-lg hover:bg-primary/90 transition shadow-sm"
              >
                <Printer className="w-4 h-4" /> Imprimir / Guardar PDF
              </button>
            </>
          )}
        </div>
      </div>

      {/* Hoja del plan */}
      <div className="plan-sheet bg-white border border-border rounded-xl shadow-sm p-8 text-[#0B1F3A]">
        {/* Encabezado */}
        <div className="flex items-stretch border border-slate-300">
          <div className="w-44 shrink-0 flex items-center justify-center px-3 py-4 border-r border-slate-300">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-auditorias.png" alt="Auditorías en Línea" className="h-12 w-auto object-contain" />
          </div>
          <div className="flex-1 flex flex-col items-center justify-center px-4 py-3 text-center border-r border-slate-300">
            <h1 className="text-base font-bold tracking-tight uppercase leading-tight">
              Plan de Auditoría Interna de {disciplina}
            </h1>
            <p className="text-[10px] font-semibold text-primary mt-1">
              Conforme a Directrices ISO 19011:2018 {vista.norma ? `/ ${vista.norma}` : ""}
            </p>
          </div>
          <div className="w-56 shrink-0 px-3 py-3 text-[10px] space-y-1 bg-slate-50">
            <p><span className="font-bold">Código:</span> <span className="font-mono">{vista.codigo}</span></p>
            <p><span className="font-bold">Fecha Emisión:</span> {fechaCorta(vista.fecha_emision)}</p>
            <p>
              <span className="font-bold">Revisión:</span>{" "}
              {editando ? (
                <input
                  aria-label="Revisión"
                  value={vista.revision || ""}
                  onChange={(e) => set("revision", e.target.value)}
                  className="w-12 border border-primary/40 rounded px-1 py-0.5 text-[10px]"
                />
              ) : (
                vista.revision
              )}
            </p>
          </div>
        </div>

        {/* Datos de la auditoría */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          <Casilla label="Organización / Cliente" valor={vista.organizacion} editando={editando}
                   onChange={(v) => set("organizacion", v)} />
          <Casilla label="Ente Certificador Externo" valor={vista.ente_certificador} editando={editando}
                   onChange={(v) => set("ente_certificador", v)} placeholder="Ej: Bureau Veritas Certification" />
          <Casilla label="Fecha de Auditoría" valor={vista.fecha_auditoria} editando={editando}
                   tipo="date" mostrar={fechaConDia(vista.fecha_auditoria)}
                   onChange={(v) => set("fecha_auditoria", v)} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
          <Casilla label="Lugar y Sede" valor={vista.lugar_sede} editando={editando}
                   onChange={(v) => set("lugar_sede", v)} placeholder="Dirección donde se realiza la auditoría" />
          <Casilla label="Auditor Líder" valor={vista.auditor_lider} editando={editando}
                   onChange={(v) => set("auditor_lider", v)} />
          <Casilla label="Coordinador SGC Cliente" valor={vista.coordinador_sgc} editando={editando}
                   onChange={(v) => set("coordinador_sgc", v)} placeholder="Responsable del SGC del cliente" />
        </div>

        {/* Alcance, objetivo y criterios */}
        <div className="mt-4 border-l-4 border-primary bg-sky-50/60 px-4 py-3 space-y-2 text-[11px] leading-relaxed">
          <Parrafo titulo="Alcance de Auditoría" valor={vista.alcance} editando={editando}
                   onChange={(v) => set("alcance", v)} />
          <Parrafo titulo="Objetivo" valor={vista.objetivo} editando={editando}
                   onChange={(v) => set("objetivo", v)} />
          <Parrafo titulo="Criterios" valor={vista.criterios} editando={editando}
                   onChange={(v) => set("criterios", v)} />
        </div>

        {/* Cronograma */}
        <div className="flex flex-wrap items-center justify-between gap-2 mt-6 mb-2">
          <h2 className="text-xs font-bold uppercase tracking-wide text-primary">
            Cronograma y horarios por proceso / área
          </h2>
          <span className="text-[10px] font-bold uppercase bg-primary text-white px-2.5 py-1 rounded">
            Jornada:{" "}
            {editando ? (
              <input
                aria-label="Jornada"
                value={vista.jornada || ""}
                onChange={(e) => set("jornada", e.target.value)}
                className="w-32 text-[10px] text-[#0B1F3A] rounded px-1 py-0.5"
              />
            ) : (
              vista.jornada || "—"
            )}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[11px]">
            <thead>
              <tr className="bg-[#0B1F3A] text-white text-[10px] uppercase tracking-wide">
                <th className="py-2 px-2 w-28">Horario</th>
                <th className="py-2 px-2">Proceso / Actividad</th>
                <th className="py-2 px-2 w-48">Requisitos {vista.norma || "ISO"}</th>
                <th className="py-2 px-2 w-56">Responsables / Entrevistados</th>
                {editando && <th className="py-2 px-2 w-8 no-print" />}
              </tr>
            </thead>
            <tbody>
              {(vista.cronograma || []).map((f, i) => (
                <tr key={i} className="border-b border-slate-200 align-top odd:bg-slate-50/60">
                  <td className="py-2 px-2 font-mono text-[10px] whitespace-nowrap">
                    {editando ? (
                      <div className="flex items-center gap-1">
                        <input aria-label={`Hora de inicio, franja ${i + 1}`} value={f.desde || ""} onChange={(e) => setFranja(i, "desde", e.target.value)}
                               placeholder="09:00" className="w-14 border border-primary/40 rounded px-1 py-0.5" />
                        <span>-</span>
                        <input aria-label={`Hora de fin, franja ${i + 1}`} value={f.hasta || ""} onChange={(e) => setFranja(i, "hasta", e.target.value)}
                               placeholder="09:15" className="w-14 border border-primary/40 rounded px-1 py-0.5" />
                      </div>
                    ) : (
                      `${f.desde || ""}${f.hasta ? ` - ${f.hasta}` : ""}`
                    )}
                  </td>
                  <td className="py-2 px-2">
                    {editando ? (
                      <div className="space-y-1">
                        <input aria-label={`Proceso o actividad, franja ${i + 1}`} value={f.actividad || ""} onChange={(e) => setFranja(i, "actividad", e.target.value)}
                               placeholder="Proceso o actividad"
                               className="w-full border border-primary/40 rounded px-1.5 py-1 font-semibold" />
                        <textarea aria-label={`Detalle, franja ${i + 1}`} value={f.detalle || ""} onChange={(e) => setFranja(i, "detalle", e.target.value)}
                                  placeholder="Detalle de lo que se audita en la franja"
                                  className="w-full border border-primary/40 rounded px-1.5 py-1 h-12" />
                      </div>
                    ) : (
                      <>
                        <span className="block font-bold">{f.actividad}</span>
                        {f.detalle && <span className="block text-slate-600 italic leading-snug mt-0.5">{f.detalle}</span>}
                      </>
                    )}
                  </td>
                  <td className="py-2 px-2 text-slate-700">
                    {editando ? (
                      <textarea aria-label={`Requisitos, franja ${i + 1}`} value={f.requisitos || ""} onChange={(e) => setFranja(i, "requisitos", e.target.value)}
                                placeholder="Cap. 8.2, 9.1.2"
                                className="w-full border border-primary/40 rounded px-1.5 py-1 h-14" />
                    ) : (
                      f.requisitos || "—"
                    )}
                  </td>
                  <td className="py-2 px-2 text-slate-700">
                    {editando ? (
                      <textarea aria-label={`Responsables, franja ${i + 1}`} value={f.responsables || ""} onChange={(e) => setFranja(i, "responsables", e.target.value)}
                                placeholder="Área y personas a entrevistar"
                                className="w-full border border-primary/40 rounded px-1.5 py-1 h-14" />
                    ) : (
                      f.responsables || "—"
                    )}
                  </td>
                  {editando && (
                    <td className="py-2 px-2 no-print">
                      <button
                        onClick={() =>
                          setBorrador((b) =>
                            b ? { ...b, cronograma: b.cronograma.filter((_, j) => j !== i) } : b
                          )
                        }
                        title="Quitar franja"
                        className="text-red-500 hover:text-red-700 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {(vista.cronograma || []).length === 0 && (
                <tr>
                  <td colSpan={editando ? 5 : 4} className="py-6 text-center text-slate-500 italic">
                    El cronograma está vacío.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {editando && (
          <button
            onClick={() =>
              setBorrador((b) => (b ? { ...b, cronograma: [...b.cronograma, { ...FRANJA_VACIA }] } : b))
            }
            className="no-print mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary hover:underline"
          >
            <Plus className="w-3.5 h-3.5" /> Agregar franja horaria
          </button>
        )}

        {/* Firmas */}
        <div className="grid grid-cols-2 gap-10 mt-12">
          <div className="text-center">
            <div className="border-b border-slate-400 h-10" />
            <p className="text-[11px] font-bold mt-1">{vista.auditor_lider || "—"}</p>
            <p className="text-[10px] text-slate-500">Auditor Líder — Auditorías En Línea</p>
          </div>
          <div className="text-center">
            <div className="border-b border-slate-400 h-10" />
            <p className="text-[11px] font-bold mt-1">{vista.coordinador_sgc || "—"}</p>
            <p className="text-[10px] text-slate-500">
              Aceptación Cliente / Resp. SGC {vista.organizacion ? `— ${vista.organizacion}` : ""}
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center mt-10 pt-3 border-t border-slate-200 text-[10px] text-slate-500">
          <span>
            {vista.organizacion || "Organización"} — Plan de Auditoría Interna de {disciplina}
            {vista.norma ? ` (${vista.norma})` : ""}
          </span>
          <span className="font-mono">{vista.codigo} · Rev. {vista.revision}</span>
        </div>
      </div>
    </div>
  );
}

function Casilla({
  label, valor, editando, onChange, placeholder, tipo = "text", mostrar,
}: {
  label: string;
  valor?: string | null;
  editando: boolean;
  onChange: (v: string) => void;
  placeholder?: string;
  tipo?: "text" | "date";
  mostrar?: string;
}) {
  return (
    <div className="border border-slate-300 rounded px-3 py-2">
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      {editando ? (
        <input
          type={tipo}
          aria-label={label}
          value={valor || ""}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full mt-1 text-xs font-semibold border border-primary/40 rounded px-1.5 py-1"
        />
      ) : (
        <p className="text-xs font-bold mt-0.5">{mostrar ?? valor ?? "—"}</p>
      )}
    </div>
  );
}

function Parrafo({
  titulo, valor, editando, onChange,
}: {
  titulo: string;
  valor?: string | null;
  editando: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <span className="font-bold">{titulo}: </span>
      {editando ? (
        <textarea
          aria-label={titulo}
          value={valor || ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full mt-1 border border-primary/40 rounded px-2 py-1 h-16 text-[11px]"
        />
      ) : (
        <span>{valor || "—"}</span>
      )}
    </div>
  );
}
