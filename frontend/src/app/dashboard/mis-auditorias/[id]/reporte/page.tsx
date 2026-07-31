"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Printer, Check, X, Minus, AlertOctagon, Loader2 } from "lucide-react";

interface Respuesta {
  punto_id: string;
  resultado: string;
  nota?: string | null;
  audio_url?: string | null;
  transcripcion?: string | null;
}
interface Punto { id: string; clausula: string; pregunta: string; orden: number; respuesta?: Respuesta | null; }
interface Reporte {
  asignacion: {
    area: string; norma?: string | null; programa_titulo?: string | null;
    auditor_nombre: string; fecha_programada: string; estado: string;
    firmado_por?: string | null; firmado_at?: string | null;
  };
  firma_download_url?: string | null;
  resumen: { total: number; conforme: number; no_conforme: number; na: number; sin_responder: number };
  puntos: Punto[];
  no_conformidades: { nc_id: string; clausula: string; titulo: string; estado: string }[];
}

const PRINT_CSS = `
@media print {
  aside, header { display: none !important; }
  main { padding: 0 !important; overflow: visible !important; }
  body { background: #fff !important; }
  .no-print { display: none !important; }
  .report-sheet { box-shadow: none !important; border: 0 !important; max-width: none !important; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  @page { margin: 14mm; }
}`;

export default function ReporteAuditoriaPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const asigId = params?.id as string;
  const token = (session as any)?.accessToken;
  const api = process.env.NEXT_PUBLIC_API_URL || "";

  const [rep, setRep] = useState<Reporte | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user && asigId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, asigId]);

  const load = async () => {
    try {
      const res = await fetch(`${api}/api/v1/auditorias/asignaciones/${asigId}/reporte`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setRep(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const resMeta = (r?: string | null) => {
    if (r === "conforme") return { label: "Conforme", cls: "text-green-700 bg-green-50 border-green-200", Icon: Check };
    if (r === "no_conforme") return { label: "No conforme", cls: "text-red-700 bg-red-50 border-red-200", Icon: X };
    if (r === "na") return { label: "N/A", cls: "text-slate-600 bg-slate-100 border-slate-200", Icon: Minus };
    return { label: "Sin responder", cls: "text-muted-foreground bg-muted border-border", Icon: Minus };
  };

  const fecha = (d?: string | null) => (d ? new Date(d).toLocaleString() : "—");

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm p-8">
        <Loader2 className="w-4 h-4 animate-spin" /> Generando reporte…
      </div>
    );
  }
  if (!rep) {
    return <div className="p-8 text-sm text-muted-foreground italic">No se pudo cargar el reporte de la auditoría.</div>;
  }

  const a = rep.asignacion;
  const stat = [
    { k: "Conformes", v: rep.resumen.conforme, c: "text-green-600" },
    { k: "No conformes", v: rep.resumen.no_conforme, c: "text-red-600" },
    { k: "N/A", v: rep.resumen.na, c: "text-slate-500" },
    { k: "Total", v: rep.resumen.total, c: "text-primary" },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />

      {/* Toolbar (no imprime) */}
      <div className="no-print flex items-center justify-between mb-5">
        <button
          onClick={() => router.push(`/dashboard/mis-auditorias/${asigId}`)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition"
        >
          <ArrowLeft className="w-4 h-4" /> Volver a la auditoría
        </button>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 text-xs font-semibold bg-primary text-white px-4 py-2.5 rounded-lg hover:bg-primary/90 transition shadow-sm"
        >
          <Printer className="w-4 h-4" /> Imprimir / Guardar PDF
        </button>
      </div>

      {/* Hoja del reporte */}
      <div className="report-sheet bg-white border border-border rounded-xl shadow-sm p-8 text-[#0B1F3A]">
        {/* Encabezado */}
        <div className="flex items-start justify-between gap-4 pb-5 border-b-2 border-primary">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-auditorias.png" alt="Auditorías en Línea" className="h-10 w-auto object-contain mb-2" />
            <h1 className="text-xl font-bold tracking-tight">Reporte de Auditoría</h1>
          </div>
          <div className="text-right text-[11px] text-muted-foreground">
            <p className="font-mono">{a.norma || "SGI"}</p>
            <p className={`mt-1 font-bold uppercase ${a.estado === "completada" ? "text-green-600" : "text-amber-600"}`}>{a.estado.replace("_", " ")}</p>
          </div>
        </div>

        {/* Metadatos */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 mt-5 text-xs">
          <Meta label="Área / Sector auditado" value={a.area} />
          <Meta label="Programa" value={a.programa_titulo || "—"} />
          <Meta label="Norma de referencia" value={a.norma || "—"} />
          <Meta label="Auditor" value={a.auditor_nombre} />
          <Meta label="Fecha programada" value={new Date(a.fecha_programada + "T00:00:00").toLocaleDateString()} />
          <Meta label="Fecha de cierre" value={fecha(a.firmado_at)} />
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-4 gap-3 mt-6">
          {stat.map((s) => (
            <div key={s.k} className="border border-border rounded-lg p-3 text-center">
              <p className={`text-2xl font-bold tabular-nums ${s.c}`}>{s.v}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mt-0.5">{s.k}</p>
            </div>
          ))}
        </div>

        {/* Checklist */}
        <h2 className="text-sm font-bold mt-7 mb-3 uppercase tracking-wide text-primary">Detalle de controles</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border text-[10px] uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-2 w-6">#</th>
                <th className="py-2 pr-3">Cláusula / Pregunta</th>
                <th className="py-2 pr-3 w-28">Resultado</th>
                <th className="py-2">Observación</th>
              </tr>
            </thead>
            <tbody>
              {rep.puntos.map((p, i) => {
                const m = resMeta(p.respuesta?.resultado);
                return (
                  <tr key={p.id} className="border-b border-border/60 align-top">
                    <td className="py-2.5 pr-2 tabular-nums text-muted-foreground">{i + 1}</td>
                    <td className="py-2.5 pr-3">
                      <span className="block font-mono text-[10px] font-bold text-primary uppercase">{p.clausula}</span>
                      <span className="block text-foreground leading-snug mt-0.5">{p.pregunta}</span>
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border font-bold text-[9px] uppercase ${m.cls}`}>
                        <m.Icon className="w-3 h-3" /> {m.label}
                      </span>
                    </td>
                    <td className="py-2.5 text-muted-foreground">
                      <span className="italic whitespace-pre-line">{p.respuesta?.nota || "—"}</span>
                      {p.respuesta?.audio_url && !p.respuesta?.transcripcion && (
                        <span className="block mt-1 text-[10px] not-italic text-muted-foreground/80">
                          (incluye nota de voz adjunta como evidencia)
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* No conformidades */}
        {rep.no_conformidades.length > 0 && (
          <div className="mt-7">
            <h2 className="text-sm font-bold mb-3 uppercase tracking-wide text-red-700 flex items-center gap-2">
              <AlertOctagon className="w-4 h-4" /> No Conformidades detectadas ({rep.no_conformidades.length})
            </h2>
            <ul className="space-y-2">
              {rep.no_conformidades.map((nc) => (
                <li key={nc.nc_id} className="border border-red-200 bg-red-50 rounded-lg px-3 py-2 text-xs">
                  <span className="font-mono text-[10px] font-bold text-red-700 uppercase">{nc.clausula}</span>
                  <span className="block text-foreground font-semibold">{nc.titulo}</span>
                  <span className="text-[10px] uppercase font-bold text-red-600">Estado: {nc.estado}</span>
                </li>
              ))}
            </ul>
            <p className="text-[10px] text-muted-foreground mt-2 italic">
              Estas No Conformidades se generaron automáticamente y están disponibles para su tratamiento en el módulo No Conformidades (ISO 9001).
            </p>
          </div>
        )}

        {/* Firma */}
        <div className="mt-8 pt-6 border-t border-border flex items-end justify-between gap-6">
          <div className="text-[11px] text-muted-foreground">
            <p>Documento generado por Auditorías en Línea.</p>
            <p>Emitido: {new Date().toLocaleString()}</p>
          </div>
          <div className="text-center">
            {rep.firma_download_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={rep.firma_download_url} alt="Firma" className="h-16 w-auto object-contain mx-auto" />
            ) : (
              <div className="h-16 w-40 border-b border-foreground/40" />
            )}
            <p className="text-xs font-semibold text-foreground border-t border-foreground/40 pt-1 mt-1 min-w-[160px]">
              {a.firmado_por || a.auditor_nombre}
            </p>
            <p className="text-[10px] text-muted-foreground">Firma del auditor</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-foreground font-medium mt-0.5">{value}</p>
    </div>
  );
}
