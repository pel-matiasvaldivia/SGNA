"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { CheckSquare, Download, CheckCircle, XCircle, AlertCircle, MessageSquare } from "lucide-react";

interface DocumentItem {
  id: string;
  title: string;
  description?: string;
  type: string;
  status: string;
  version_actual: number;
}

export default function ApprovalsPage() {
  const { data: session } = useSession();
  const [pendingDocs, setPendingDocs] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Feedback states mapped by doc ID
  const [comments, setComments] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<Record<string, boolean>>({});

  const fetchPendingDocuments = async () => {
    try {
      if (!session?.user) return;
      setLoading(true);
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/documents/list`, {
        headers: {
          Authorization: `Bearer ${(session as any).accessToken}`,
        },
      });

      if (!res.ok) {
        throw new Error("No se pudo cargar la cola de aprobación.");
      }

      const data: DocumentItem[] = await res.json();
      // Filter for pending status
      setPendingDocs(data.filter((doc) => doc.status === "pendiente"));
    } catch (err: any) {
      setError(err.message || "Error al cargar cola de aprobaciones.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingDocuments();
  }, [session]);

  const handleDownload = async (docId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/documents/${docId}/download`, {
        headers: {
          Authorization: `Bearer ${(session as any).accessToken}`,
        },
      });

      if (!res.ok) {
        throw new Error("No se pudo obtener enlace seguro de revisión.");
      }

      const data = await res.json();
      window.open(data.download_url, "_blank");
    } catch (err: any) {
      alert(err.message || "Error al descargar evidencia");
    }
  };

  const handleDecision = async (docId: string, approve: boolean) => {
    try {
      setProcessing((prev) => ({ ...prev, [docId]: true }));
      setError(null);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/documents/${docId}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any).accessToken}`,
        },
        body: JSON.stringify({
          approve,
          comments: comments[docId] || "",
        }),
      });

      if (!res.ok) {
        throw new Error("No se pudo procesar la firma digital.");
      }

      // Refresh list
      await fetchPendingDocuments();
    } catch (err: any) {
      setError(err.message || "Error al resolver aprobación");
    } finally {
      setProcessing((prev) => ({ ...prev, [docId]: false }));
    }
  };

  const handleCommentChange = (docId: string, val: string) => {
    setComments((prev) => ({ ...prev, [docId]: val }));
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-heading">Aprobaciones de Calidad</h1>
        <p className="text-sm text-muted-foreground">
          Bandeja de control de calidad. Revisa y autoriza el ingreso de nuevos documentos al catálogo regulado.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 p-4 rounded-r-lg text-sm text-red-800 dark:text-red-300">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Approvals content lists */}
      {loading ? (
        <div className="p-12 text-center text-sm text-muted-foreground bg-white dark:bg-zinc-950 border border-border rounded-xl shadow-sm">
          Cargando solicitudes pendientes...
        </div>
      ) : pendingDocs.length === 0 ? (
        <div className="p-12 text-center text-sm text-muted-foreground bg-white dark:bg-zinc-950 border border-border rounded-xl shadow-sm space-y-3">
          <CheckSquare className="w-10 h-10 mx-auto text-secondary" />
          <p className="font-bold">¡Bandeja al día!</p>
          <p className="text-xs">No hay evidencias ni manuales pendientes de aprobación regulada en este tenant.</p>
        </div>
      ) : (
        <div className="space-y-6 max-w-4xl">
          {pendingDocs.map((doc) => (
            <div
              key={doc.id}
              className="bg-white dark:bg-zinc-950 border border-border rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-6 hover:shadow-md transition"
            >
              {/* Document metadata info */}
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full capitalize">
                    {doc.type}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Versión: v{doc.version_actual}
                  </span>
                </div>
                <h3 className="font-bold text-base leading-snug">{doc.title}</h3>
                {doc.description && (
                  <p className="text-xs text-muted-foreground leading-relaxed">{doc.description}</p>
                )}
                
                <button
                  onClick={() => handleDownload(doc.id)}
                  className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold bg-primary text-white hover:opacity-90 shadow transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  Descargar y Revisar Archivo
                </button>
              </div>

              {/* Approval controls block */}
              <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" /> Comentarios de Revisión
                  </label>
                  <textarea
                    rows={2}
                    value={comments[doc.id] || ""}
                    onChange={(e) => handleCommentChange(doc.id, e.target.value)}
                    placeholder="Escribe observaciones o motivos de rechazo..."
                    className="w-full px-3 py-2 border border-input rounded-lg text-xs bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleDecision(doc.id, true)}
                    disabled={processing[doc.id]}
                    className="flex-1 flex items-center justify-center gap-1 py-2 px-3 bg-secondary text-white font-bold rounded-lg text-xs hover:opacity-95 shadow transition disabled:opacity-50"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Aprobar
                  </button>
                  
                  <button
                    onClick={() => handleDecision(doc.id, false)}
                    disabled={processing[doc.id]}
                    className="flex-1 flex items-center justify-center gap-1 py-2 px-3 bg-red-600 text-white font-bold rounded-lg text-xs hover:bg-red-700 shadow transition disabled:opacity-50"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Rechazar
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
