"use client";

import React from "react";
import { useSession } from "next-auth/react";
import {
  AlertTriangle,
  Check,
  ClipboardList,
  Copy,
  Download,
  FileUp,
  Loader2,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

/**
 * Biblioteca de plantillas de checklist.
 *
 * Antes una plantilla solo podía nacer de una asignación ya cargada, tipeando
 * pregunta por pregunta desde el editor de esa auditoría: no había forma de
 * armar una el primer día, ni de corregir una sin rehacerla entera, y un
 * checklist que no fuera ISO 9001 no tenía por dónde entrar. Los catálogos por
 * norma venían con el producto y no se podían tocar, lo cual está bien como
 * punto de partida y mal como destino: nadie audita la norma, audita la norma
 * aplicada a lo suyo.
 *
 * Acá se arma, se importa desde una planilla, se edita, se duplica y se baja.
 *
 * La importación muestra **vista previa antes de guardar**. El CSV es un
 * formato sin tipos: el separador, el encabezado y el orden de las columnas se
 * adivinan, y la única forma honesta de adivinar es mostrar en qué quedó antes
 * de que el usuario confirme.
 */

type Item = {
  clausula?: string | null;
  pregunta: string;
  orden?: number | null;
  modulo?: string | null;
  evidencia?: string | null;
};

type Plantilla = {
  id: string;
  nombre: string;
  descripcion?: string | null;
  categoria?: string | null;
  items: Item[];
};

const api = (ruta: string) => `${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1${ruta}`;

export default function PlantillasChecklist() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken;

  const [plantillas, setPlantillas] = React.useState<Plantilla[]>([]);
  const [catalogos, setCatalogos] = React.useState<string[]>([]);
  const [cargando, setCargando] = React.useState(true);
  const [ocupado, setOcupado] = React.useState(false);

  // Edición / alta manual
  const [editando, setEditando] = React.useState<Plantilla | null>(null);

  // Importación
  const [importando, setImportando] = React.useState(false);
  const [nombreImport, setNombreImport] = React.useState("");
  const [csv, setCsv] = React.useState("");
  const [previa, setPrevia] = React.useState<Item[] | null>(null);
  const [avisos, setAvisos] = React.useState<string[]>([]);

  const cabeceras = React.useMemo(
    () => ({ "Content-Type": "application/json", Authorization: `Bearer ${token}` }),
    [token]
  );

  const traer = React.useCallback(async () => {
    if (!token) return;
    try {
      const [p, c] = await Promise.all([
        fetch(api("/auditorias/plantillas-checklist"), {
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => (r.ok ? r.json() : [])),
        fetch(api("/auditorias/plantillas"), {
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => (r.ok ? r.json() : { normas: [] })),
      ]);
      setPlantillas(Array.isArray(p) ? p : []);
      setCatalogos(c?.normas || []);
    } catch {
      /* el estado vacío lo explica */
    } finally {
      setCargando(false);
    }
  }, [token]);

  React.useEffect(() => {
    traer();
  }, [traer]);

  // --- Importación --------------------------------------------------------

  const leerArchivo = async (archivo: File) => {
    const texto = await archivo.text();
    setCsv(texto);
    if (!nombreImport.trim()) setNombreImport(archivo.name.replace(/\.[^.]+$/, ""));
    previsualizar(texto);
  };

  /**
   * Vista previa del lado del cliente, con las mismas reglas que el servidor
   * (separador detectado, encabezado opcional, sinónimos de columna). Es una
   * aproximación a propósito: la que vale es la del backend, y el resultado
   * real vuelve con sus avisos al importar. Pero mostrar algo antes de
   * confirmar evita el peor caso, que es guardar cien filas mal leídas.
   */
  const previsualizar = (texto: string) => {
    const limpio = (texto || "").replace(/^﻿/, "");
    const lineas = limpio.split(/\r?\n/).filter((l) => l.trim());
    if (!lineas.length) {
      setPrevia([]);
      setAvisos(["El archivo está vacío."]);
      return;
    }
    const sep = [";", ",", "\t", "|"]
      .map((d) => ({ d, n: (lineas[0].match(new RegExp(`\\${d}`, "g")) || []).length }))
      .sort((a, b) => b.n - a.n)[0];
    const delim = sep.n > 0 ? sep.d : ",";

    const normal = (s: string) =>
      s.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    const alias: Record<string, string[]> = {
      clausula: ["clausula", "punto", "requisito", "codigo", "ref", "referencia"],
      pregunta: ["pregunta", "consulta", "verificacion", "descripcion", "item", "control"],
      modulo: ["modulo", "bloque", "seccion", "area", "proceso"],
      evidencia: ["evidencia", "registro", "soporte", "documento"],
    };
    const canonica = (c: string) =>
      Object.keys(alias).find((k) => alias[k].includes(normal(c))) || null;

    const primera = lineas[0].split(delim);
    const hayEncabezado = primera.some((c) => canonica(c) === "pregunta");
    const columnas = hayEncabezado
      ? primera.map(canonica)
      : (["clausula", "pregunta", "modulo", "evidencia"].slice(0, primera.length) as any[]);
    const cuerpo = hayEncabezado ? lineas.slice(1) : lineas;

    const nuevosAvisos: string[] = [];
    if (!hayEncabezado) {
      nuevosAvisos.push(
        "El archivo no trae encabezado: se tomó la primera columna como cláusula y la segunda como pregunta."
      );
    }
    if (!columnas.includes("pregunta")) {
      setPrevia([]);
      setAvisos([
        "No se encontró la columna de preguntas. Poné un encabezado con «pregunta» (o «clausula;pregunta»).",
      ]);
      return;
    }

    const items: Item[] = [];
    cuerpo.forEach((linea, i) => {
      const celdas = linea.split(delim);
      const v: any = {};
      columnas.forEach((col, j) => {
        if (col) v[col] = (celdas[j] || "").trim();
      });
      if (!v.pregunta) {
        nuevosAvisos.push(`Fila ${(hayEncabezado ? 2 : 1) + i}: sin pregunta, no se importará.`);
        return;
      }
      items.push({
        clausula: v.clausula || "",
        pregunta: v.pregunta,
        modulo: v.modulo || null,
        evidencia: v.evidencia || null,
      });
    });
    setPrevia(items);
    setAvisos(nuevosAvisos);
  };

  const confirmarImport = async () => {
    if (ocupado || !previa?.length) return;
    setOcupado(true);
    try {
      const r = await fetch(api("/auditorias/plantillas-checklist/importar"), {
        method: "POST",
        headers: cabeceras,
        body: JSON.stringify({ nombre: nombreImport.trim() || "Checklist importado", csv }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d?.detail || "No se pudo importar el archivo.");
      if (d.problemas?.length) {
        alert(`Se importaron ${d.importadas} preguntas.\n\n${d.problemas.join("\n")}`);
      }
      cerrarImport();
      traer();
    } catch (e: any) {
      alert(e?.message || "No se pudo importar el archivo.");
    } finally {
      setOcupado(false);
    }
  };

  const cerrarImport = () => {
    setImportando(false);
    setCsv("");
    setPrevia(null);
    setAvisos([]);
    setNombreImport("");
  };

  // --- Acciones sobre una plantilla ---------------------------------------

  const exportar = async (p: Plantilla) => {
    const r = await fetch(api(`/auditorias/plantillas-checklist/${p.id}/exportar`), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!r.ok) {
      alert("No se pudo exportar la plantilla.");
      return;
    }
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${p.nombre.replace(/[^A-Za-z0-9._-]+/g, "-")}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const duplicar = async (p: Plantilla) => {
    await fetch(api(`/auditorias/plantillas-checklist/${p.id}/duplicar`), {
      method: "POST",
      headers: cabeceras,
    });
    traer();
  };

  const borrar = async (p: Plantilla) => {
    if (!confirm(`¿Eliminar la plantilla «${p.nombre}»?`)) return;
    await fetch(api(`/auditorias/plantillas-checklist/${p.id}`), {
      method: "DELETE",
      headers: cabeceras,
    });
    traer();
  };

  const desdeCatalogo = async (norma: string) => {
    if (!norma) return;
    setOcupado(true);
    try {
      const r = await fetch(api("/auditorias/plantillas-checklist/desde-catalogo"), {
        method: "POST",
        headers: cabeceras,
        body: JSON.stringify({ norma }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d?.detail || "No se pudo copiar el catálogo.");
      }
      traer();
    } catch (e: any) {
      alert(e?.message || "No se pudo copiar el catálogo.");
    } finally {
      setOcupado(false);
    }
  };

  const guardarEdicion = async () => {
    if (!editando || ocupado) return;
    const items = (editando.items || []).filter((i) => (i.pregunta || "").trim());
    if (!items.length) {
      alert("La plantilla necesita al menos una pregunta.");
      return;
    }
    setOcupado(true);
    try {
      const esNueva = editando.id === "nueva";
      const r = await fetch(
        esNueva
          ? api("/auditorias/plantillas-checklist")
          : api(`/auditorias/plantillas-checklist/${editando.id}`),
        {
          method: esNueva ? "POST" : "PUT",
          headers: cabeceras,
          body: JSON.stringify({
            nombre: editando.nombre || "Checklist",
            descripcion: editando.descripcion || null,
            categoria: editando.categoria || null,
            items,
          }),
        }
      );
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d?.detail || "No se pudo guardar.");
      }
      setEditando(null);
      traer();
    } catch (e: any) {
      alert(e?.message || "No se pudo guardar.");
    } finally {
      setOcupado(false);
    }
  };

  const cambiarItem = (i: number, campo: keyof Item, valor: string) => {
    if (!editando) return;
    const items = [...editando.items];
    items[i] = { ...items[i], [campo]: valor };
    setEditando({ ...editando, items });
  };

  // ------------------------------------------------------------------------

  if (editando) {
    return (
      <div className="space-y-4 max-w-4xl">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h3 className="font-bold text-lg">
            {editando.id === "nueva" ? "Nueva plantilla" : "Editar plantilla"}
          </h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={guardarEdicion}
              disabled={ocupado}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-white text-sm font-semibold disabled:opacity-40"
            >
              {ocupado ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Guardar
            </button>
            <button
              type="button"
              onClick={() => setEditando(null)}
              className="px-4 py-2 rounded-lg border border-border text-sm font-semibold text-muted-foreground hover:bg-muted"
            >
              Cancelar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="pl-nombre" className="block text-xs font-semibold text-muted-foreground mb-1">
              Nombre
            </label>
            <input
              id="pl-nombre"
              value={editando.nombre}
              onChange={(e) => setEditando({ ...editando, nombre: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
              placeholder="Verificación de cámara de frío"
            />
          </div>
          <div>
            <label htmlFor="pl-cat" className="block text-xs font-semibold text-muted-foreground mb-1">
              Categoría
            </label>
            <input
              id="pl-cat"
              value={editando.categoria || ""}
              onChange={(e) => setEditando({ ...editando, categoria: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
              placeholder="Alimentos · Seguridad · Transporte"
            />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-950 rounded-xl border border-border divide-y divide-border">
          {editando.items.map((item, i) => (
            <div key={i} className="p-3 grid grid-cols-1 sm:grid-cols-12 gap-2 items-start">
              <input
                value={item.clausula || ""}
                onChange={(e) => cambiarItem(i, "clausula", e.target.value)}
                aria-label={`Cláusula del punto ${i + 1}`}
                placeholder="Cláusula"
                className="sm:col-span-2 px-2 py-1.5 rounded border border-border bg-background text-xs"
              />
              <input
                value={item.pregunta}
                onChange={(e) => cambiarItem(i, "pregunta", e.target.value)}
                aria-label={`Pregunta del punto ${i + 1}`}
                placeholder="¿Qué se verifica?"
                className="sm:col-span-5 px-2 py-1.5 rounded border border-border bg-background text-xs"
              />
              <input
                value={item.modulo || ""}
                onChange={(e) => cambiarItem(i, "modulo", e.target.value)}
                aria-label={`Módulo del punto ${i + 1}`}
                placeholder="Bloque"
                className="sm:col-span-2 px-2 py-1.5 rounded border border-border bg-background text-xs"
              />
              <input
                value={item.evidencia || ""}
                onChange={(e) => cambiarItem(i, "evidencia", e.target.value)}
                aria-label={`Evidencia del punto ${i + 1}`}
                placeholder="Evidencia a pedir"
                className="sm:col-span-2 px-2 py-1.5 rounded border border-border bg-background text-xs"
              />
              <button
                type="button"
                onClick={() =>
                  setEditando({
                    ...editando,
                    items: editando.items.filter((_, j) => j !== i),
                  })
                }
                aria-label={`Quitar el punto ${i + 1}`}
                className="sm:col-span-1 p-1.5 rounded text-muted-foreground hover:text-red-600 hover:bg-red-500/10 justify-self-start"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() =>
            setEditando({ ...editando, items: [...editando.items, { clausula: "", pregunta: "" }] })
          }
          className="inline-flex items-center gap-2 text-sm font-semibold text-secondary hover:underline"
        >
          <Plus className="w-4 h-4" /> Agregar pregunta
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="max-w-2xl">
          <h3 className="font-bold text-lg">Plantillas de checklist</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Las preguntas que el auditor responde en campo. Armalas acá una vez y aplicalas a
            cualquier auditoría. Si ya tenés tu checklist en una planilla,{" "}
            <strong>importalo</strong> en vez de tipearlo: sirve para cualquier actividad, no
            solo para ISO.
          </p>
        </div>
        <div className="flex gap-2 flex-none">
          <button
            type="button"
            onClick={() => setImportando(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-semibold hover:bg-muted transition"
          >
            <FileUp className="w-4 h-4" /> Importar CSV
          </button>
          <button
            type="button"
            onClick={() =>
              setEditando({ id: "nueva", nombre: "", items: [{ clausula: "", pregunta: "" }] })
            }
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold shadow-sm hover:brightness-110 transition"
          >
            <Plus className="w-4 h-4" /> Nueva plantilla
          </button>
        </div>
      </div>

      {importando && (
        <div className="bg-white dark:bg-zinc-950 rounded-xl border border-border p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Importar desde una planilla
            </p>
            <button type="button" onClick={cerrarImport} aria-label="Cerrar importación">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <p className="text-xs text-muted-foreground">
            Guardá tu planilla como CSV y subila. Se aceptan las columnas{" "}
            <code className="text-[11px]">clausula</code>,{" "}
            <code className="text-[11px]">pregunta</code>,{" "}
            <code className="text-[11px]">modulo</code> y{" "}
            <code className="text-[11px]">evidencia</code>, separadas por coma o punto y coma.
            Lo único imprescindible es la pregunta.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="imp-nombre" className="block text-xs font-semibold text-muted-foreground mb-1">
                Nombre de la plantilla
              </label>
              <input
                id="imp-nombre"
                value={nombreImport}
                onChange={(e) => setNombreImport(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                placeholder="Verificación de cámara de frío"
              />
            </div>
            <div>
              <label htmlFor="imp-archivo" className="block text-xs font-semibold text-muted-foreground mb-1">
                Archivo CSV
              </label>
              <input
                id="imp-archivo"
                type="file"
                accept=".csv,text/csv,text/plain"
                onChange={(e) => e.target.files?.[0] && leerArchivo(e.target.files[0])}
                className="w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-muted file:text-xs file:font-semibold"
              />
            </div>
          </div>

          {avisos.length > 0 && (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 space-y-1">
              {avisos.slice(0, 6).map((a, i) => (
                <p key={i} className="text-xs text-amber-700 dark:text-amber-400 flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 flex-none mt-0.5" /> {a}
                </p>
              ))}
              {avisos.length > 6 && (
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  …y {avisos.length - 6} aviso(s) más.
                </p>
              )}
            </div>
          )}

          {previa && previa.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold">
                Así quedaría: {previa.length} pregunta(s)
              </p>
              <div className="max-h-64 overflow-y-auto rounded-lg border border-border divide-y divide-border">
                {previa.slice(0, 50).map((it, i) => (
                  <div key={i} className="p-2 text-xs flex gap-3">
                    <span className="text-muted-foreground font-mono flex-none w-20 truncate">
                      {it.clausula || "—"}
                    </span>
                    <span className="flex-1">{it.pregunta}</span>
                    {it.modulo && (
                      <span className="text-muted-foreground flex-none hidden sm:inline">
                        {it.modulo}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              {previa.length > 50 && (
                <p className="text-xs text-muted-foreground">
                  Se muestran las primeras 50 de {previa.length}.
                </p>
              )}
              <button
                type="button"
                onClick={confirmarImport}
                disabled={ocupado}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-white text-sm font-semibold disabled:opacity-40"
              >
                {ocupado ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Importar {previa.length} pregunta(s)
              </button>
            </div>
          )}
        </div>
      )}

      {catalogos.length > 0 && (
        <div className="bg-white dark:bg-zinc-950 rounded-xl border border-border p-4 flex items-start gap-3 flex-wrap">
          <Sparkles className="w-5 h-5 text-secondary flex-none mt-0.5" />
          <div className="flex-1 min-w-[220px]">
            <p className="text-sm font-semibold">Partir de un catálogo</p>
            <p className="text-xs text-muted-foreground">
              Copia editable de un catálogo que viene con la plataforma. Después le agregás o
              le sacás lo que quieras: nadie audita la norma, audita la norma aplicada a lo suyo.
            </p>
          </div>
          <select
            onChange={(e) => {
              desdeCatalogo(e.target.value);
              e.target.value = "";
            }}
            aria-label="Copiar un catálogo de fábrica"
            defaultValue=""
            className="px-3 py-2 rounded-lg border border-border bg-background text-sm flex-none"
          >
            <option value="">Elegir catálogo…</option>
            {catalogos.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      )}

      {cargando ? (
        <p className="text-sm text-muted-foreground italic">Cargando…</p>
      ) : plantillas.length === 0 ? (
        <div className="bg-white dark:bg-zinc-950 rounded-xl border border-dashed border-border p-8 text-center space-y-2">
          <ClipboardList className="w-8 h-8 text-muted-foreground/40 mx-auto" />
          <p className="text-sm font-semibold">Todavía no hay plantillas propias</p>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Importá tu checklist desde una planilla, empezá uno en blanco, o copiá un catálogo
            para adaptarlo.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {plantillas.map((p) => (
            <div
              key={p.id}
              className="bg-white dark:bg-zinc-950 rounded-xl border border-border p-4 shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="font-bold text-sm truncate">{p.nombre}</h4>
                  <p className="text-xs text-muted-foreground">
                    {(p.items || []).length} pregunta(s)
                    {p.categoria ? ` · ${p.categoria}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-none">
                  <button
                    type="button"
                    onClick={() => setEditando({ ...p, items: p.items || [] })}
                    aria-label={`Editar ${p.nombre}`}
                    className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => duplicar(p)}
                    aria-label={`Duplicar ${p.nombre}`}
                    title="Duplicar para adaptarla"
                    className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => exportar(p)}
                    aria-label={`Descargar ${p.nombre}`}
                    title="Descargar como CSV"
                    className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => borrar(p)}
                    aria-label={`Eliminar ${p.nombre}`}
                    className="p-1.5 rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-600 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1">
                {(p.items || []).slice(0, 3).map((it, i) => (
                  <li key={i} className="truncate">
                    · {it.pregunta}
                  </li>
                ))}
                {(p.items || []).length > 3 && (
                  <li className="italic">…y {(p.items || []).length - 3} más</li>
                )}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
