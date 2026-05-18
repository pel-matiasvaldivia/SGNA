"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { FolderClosed, UploadCloud, Download, Calendar, Tag, FileText, CheckCircle2, XCircle, Clock } from "lucide-react";

interface DocVersion {
  id: string;
  version_number: number;
  fecha_creacion: string;
}

interface DocumentItem {
  id: string;
  title: string;
  description?: string;
  type: string;
  status: string;
  version_actual: number;
  versions: DocVersion[];
}

export default function DocumentsPage() {
  const { data: session } = useSession();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [docType, setDocType] = useState("manual");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const fetchDocuments = async () => {
    try {
      if (!session?.user) return;
      setLoading(true);
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/documents/list`, {
        headers: {
          Authorization: `Bearer ${(session as any).accessToken}`,
        },
      });

      if (!res.ok) {
        throw new Error("No se pudo obtener el listado de documentos.");
      }

      const data = await res.json();
      setDocuments(data);
    } catch (err: any) {
      setError(err.message || "Error al cargar documentos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [session]);

  // Handle file drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !title.trim() || !docType) return;

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("type", docType);
      formData.append("file", selectedFile);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/documents/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${(session as any).accessToken}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Error al subir el documento.");
      }

      // Reset form
      setTitle("");
      setDescription("");
      setDocType("manual");
      setSelectedFile(null);

      // Refresh listing
      await fetchDocuments();
    } catch (err: any) {
      setError(err.message || "Error en la subida");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (docId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/documents/${docId}/download`, {
        headers: {
          Authorization: `Bearer ${(session as any).accessToken}`,
        },
      });

      if (!res.ok) {
        throw new Error("No se pudo obtener el enlace de descarga seguro.");
      }

      const data = await res.json();
      // Redirect or open pre-signed URL in a new window
      window.open(data.download_url, "_blank");
    } catch (err: any) {
      alert(err.message || "Error en la descarga");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "aprobado":
        return (
          <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full dark:bg-green-900/30 dark:text-green-300">
            <CheckCircle2 className="w-3.5 h-3.5" /> Aprobado
          </span>
        );
      case "rechazado":
        return (
          <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded-full dark:bg-red-900/30 dark:text-red-300">
            <XCircle className="w-3.5 h-3.5" /> Rechazado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded-full dark:bg-yellow-900/30 dark:text-yellow-300">
            <Clock className="w-3.5 h-3.5" /> Pendiente
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-heading">Gestión Documental (DMS)</h1>
          <p className="text-sm text-muted-foreground">
            Asegura y organiza las evidencias del cumplimiento de normativas ISO y huella de carbono.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 p-4 rounded-r-lg text-sm text-red-800 dark:text-red-300">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Grid: Upload form + Document list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Upload Column (Form) */}
        <div className="lg:col-span-1 bg-white dark:bg-zinc-950 p-6 rounded-xl border border-border shadow-sm space-y-6 h-fit">
          <div className="border-b border-border pb-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-primary" /> Subir Evidencia
            </h3>
            <p className="text-xs text-muted-foreground">Carga tus registros a almacenamiento aislado de MinIO</p>
          </div>

          <form onSubmit={handleUploadSubmit} className="space-y-4">
            {/* Title field */}
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                Título del Documento
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Informe de Huella Carbono 2026"
                className="w-full px-3.5 py-2 border border-input rounded-lg text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Description field */}
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                Descripción
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalle complementario de los datos..."
                className="w-full px-3.5 py-2 border border-input rounded-lg text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Type field */}
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                Clasificación Documental
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full px-3.5 py-2 border border-input rounded-lg text-sm bg-muted/20 focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="manual">Manual de Gestión</option>
                <option value="procedimiento">Procedimiento Operativo</option>
                <option value="evidencia">Evidencia de Auditoría</option>
                <option value="informe">Informe de Desempeño</option>
              </select>
            </div>

            {/* Drag and Drop File Input container */}
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block font-sans">
                Archivo Adjunto
              </label>
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-6 text-center transition ${
                  dragActive ? "border-secondary bg-secondary/5" : "border-border hover:bg-muted/10"
                } ${selectedFile ? "bg-muted/30 border-primary" : ""}`}
              >
                <input
                  type="file"
                  id="file-upload"
                  onChange={handleFileChange}
                  className="hidden"
                  required
                />
                
                {selectedFile ? (
                  <div className="space-y-2">
                    <FileText className="w-8 h-8 text-primary mx-auto" />
                    <div className="text-xs font-semibold truncate max-w-full px-2">
                      {selectedFile.name}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="text-[10px] font-bold text-red-500 hover:underline"
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <label htmlFor="file-upload" className="cursor-pointer space-y-2 block">
                    <UploadCloud className="w-8 h-8 text-muted-foreground mx-auto" />
                    <span className="text-xs font-semibold text-primary hover:underline block">
                      Selecciona un archivo
                    </span>
                    <span className="text-[10px] text-muted-foreground block">
                      o arrástralo y suéltalo aquí (PDF, Word, Excel, Imagen)
                    </span>
                  </label>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="w-full py-2.5 px-4 bg-secondary text-primary-foreground font-semibold rounded-lg text-sm hover:opacity-95 shadow transition disabled:opacity-50"
            >
              {uploading ? "Subiendo..." : "Confirmar Carga de Documento"}
            </button>
          </form>
        </div>

        {/* Documents List Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 font-semibold text-lg text-muted-foreground">
            <FolderClosed className="w-5 h-5" />
            <h3>Listado General</h3>
          </div>

          {loading ? (
            <div className="p-12 text-center text-sm text-muted-foreground bg-white dark:bg-zinc-950 border border-border rounded-xl shadow-sm">
              Cargando catálogo documental...
            </div>
          ) : documents.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground bg-white dark:bg-zinc-950 border border-border rounded-xl shadow-sm space-y-2">
              <FolderClosed className="w-8 h-8 mx-auto text-muted-foreground/50" />
              <p>No se encontraron registros de documentos activos.</p>
              <p className="text-xs">Usa el formulario del costado para cargar tu primer archivo.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white dark:bg-zinc-950 border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-bold text-sm leading-snug line-clamp-1">
                        {doc.title}
                      </h4>
                      {getStatusBadge(doc.status)}
                    </div>

                    {doc.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {doc.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2 text-[10px]">
                      <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 capitalize">
                        <Tag className="w-3 h-3" /> {doc.type}
                      </span>
                      <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-semibold">
                        Versión: v{doc.version_actual}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border mt-4 flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {doc.versions[0] ? new Date(doc.versions[0].fecha_creacion).toLocaleDateString() : "Reciente"}
                    </span>
                    
                    <button
                      onClick={() => handleDownload(doc.id)}
                      className="flex items-center gap-1 py-1.5 px-3 rounded-lg text-xs font-bold text-secondary bg-secondary/10 hover:bg-secondary hover:text-white transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Descargar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
