"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  AlertOctagon,
  ArrowRight,
  Building2,
  CheckCircle2,
  CheckSquare,
  Circle,
  ClipboardList,
  FileSearch,
  FolderClosed,
  Globe,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

/**
 * Inicio de la consola.
 *
 * Antes era un panel de bienvenida: un badge "Fase 3 Activa", un párrafo sobre
 * MinIO y el aislamiento de esquemas de PostgreSQL, y tres contadores. Nada de
 * eso le decía al responsable de calidad qué tenía que hacer, y lo que sí decía
 * estaba escrito para quien construye la plataforma, no para quien la usa.
 *
 * Ahora contesta una sola pregunta —¿qué sigue?— con dos bloques:
 *
 *  - **Requiere tu atención**: lo que ya está vencido o trabado y tiene dueño
 *    (no conformidades abiertas, documentos esperando aprobación). Aparece solo
 *    si hay algo; un panel que dice "no hay nada" ocupa lugar sin informar.
 *  - **Puesta en marcha**: los pasos de implementación que faltan, con su
 *    avance. Cuando están todos hechos el bloque desaparece para siempre: en un
 *    tenant maduro no tiene sentido seguir mostrando el camino de alta.
 *
 * Todo sale de estado real. Cada sondeo es independiente y tolera el fallo: los
 * endpoints están restringidos por módulo (ver `_mod(...)` en
 * backend/app/api/v1/router.py), así que un 403 significa "ese paso no es de
 * este perfil" y el paso simplemente no se muestra. Por eso no hay un estado de
 * error global: si un sondeo no contesta, se pierde una fila, no la pantalla.
 */

type Paso = {
  id: string;
  titulo: string;
  detalle: string;
  href: string;
  icon: LucideIcon;
  listo: boolean;
};

type Pendiente = {
  id: string;
  titulo: string;
  detalle: string;
  href: string;
  icon: LucideIcon;
  tono: "alerta" | "aviso";
};

export default function DashboardIndex() {
  const { data: session } = useSession();
  const router = useRouter();

  const [pasos, setPasos] = useState<Paso[]>([]);
  const [pendientes, setPendientes] = useState<Pendiente[]>([]);
  const [cargando, setCargando] = useState(true);
  // La edición solo cambia el texto: los pasos se filtran solos, porque los
  // endpoints de los módulos que la edición no incluye contestan 403 y el paso
  // correspondiente no se agrega.
  const [soloAuditorias, setSoloAuditorias] = useState(false);

  const esAdmin = ["admin", "superadmin", "superadmin_impersonation"].includes(
    (session?.user as any)?.role
  );

  useEffect(() => {
    if ((session?.user as any)?.role === "superadmin") {
      router.push("/dashboard/admin");
    }
  }, [session, router]);

  /**
   * GET que devuelve null ante cualquier problema (403 por módulo fuera de
   * alcance, red caída, respuesta que no es JSON). Quien lo llama decide qué
   * hacer con el null; nunca es un error que corte la pantalla.
   */
  const traer = useCallback(
    async (ruta: string, token: string): Promise<any | null> => {
      try {
        const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1${ruta}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!r.ok) return null;
        return await r.json();
      } catch {
        return null;
      }
    },
    []
  );

  useEffect(() => {
    const token = (session as any)?.accessToken;
    if (!token) return;

    let vigente = true;

    (async () => {
      const [edicion, organizacion, alcance, partes, procesos, programas, asignaciones, documentos, ncs] =
        await Promise.all([
          traer("/tenant/edicion", token),
          traer("/tenant/organizacion", token),
          traer("/contexto/alcance", token),
          traer("/contexto/partes-interesadas", token),
          traer("/procesos/", token),
          traer("/auditorias/programas", token),
          traer("/auditorias/asignaciones", token),
          traer("/documents/list", token),
          traer("/iso9001/non-conformities", token),
        ]);

      if (!vigente) return;

      setSoloAuditorias(edicion?.edicion === "auditorias");

      const lista = (v: any): any[] | null => (Array.isArray(v) ? v : null);

      // --- Puesta en marcha -------------------------------------------------
      // Un paso se omite cuando su sondeo no contestó: no se puede afirmar que
      // esté pendiente algo que no se pudo leer.
      const nuevosPasos: Paso[] = [];

      // La ficha de la organización la escribe un administrador, así que el paso
      // solo se le muestra a quien puede completarlo. Sin domicilio cargado, el
      // correo de asignación sale sin la mitad que sirve al auditor en campo.
      if (esAdmin && organizacion && "domicilio" in organizacion) {
        nuevosPasos.push({
          id: "organizacion",
          titulo: "Completá la ficha de la organización",
          detalle:
            "Domicilio y referente en sitio. Es lo que recibe el auditor de campo en la asignación para saber a dónde ir y con quién hablar.",
          href: "/dashboard/settings",
          icon: Building2,
          listo: !!(organizacion.domicilio || "").trim(),
        });
      }

      const partesLista = lista(partes);

      // `/contexto/alcance` devuelve el alcance, o null cuando todavía no hay
      // ninguno: ahí null es una respuesta válida y no se distingue de un fallo
      // del sondeo. Se usa el otro endpoint del mismo módulo como testigo de
      // que Contexto está al alcance de este perfil y contestando.
      if (partesLista) {
        nuevosPasos.push({
          id: "alcance",
          titulo: "Definí el alcance del SGI",
          detalle: "Qué procesos, sedes y actividades quedan dentro del sistema de gestión.",
          href: "/dashboard/contexto",
          icon: Globe,
          listo: !!alcance,
        });
      }
      if (partesLista) {
        nuevosPasos.push({
          id: "partes",
          titulo: "Identificá las partes interesadas",
          detalle: "Clientes, personal, organismos y proveedores, con sus requisitos y expectativas.",
          href: "/dashboard/contexto",
          icon: Globe,
          listo: partesLista.length > 0,
        });
      }

      const procesosLista = lista(procesos);
      if (procesosLista) {
        nuevosPasos.push({
          id: "procesos",
          titulo: "Mapeá los procesos",
          detalle: "El mapa de procesos es sobre lo que después se audita y se miden los indicadores.",
          href: "/dashboard/procesos",
          icon: Workflow,
          listo: procesosLista.length > 0,
        });
      }

      const documentosLista = lista(documentos);
      if (documentosLista) {
        nuevosPasos.push({
          id: "documentos",
          titulo: edicion?.edicion === "auditorias"
            ? "Cargá la documentación a auditar"
            : "Cargá la documentación del sistema",
          detalle: edicion?.edicion === "auditorias"
            ? "Procedimientos y registros contra los que vas a contrastar lo que encuentres en campo."
            : "Manual, procedimientos y registros, con control de versiones y aprobación.",
          href: "/dashboard/documents",
          icon: FolderClosed,
          listo: documentosLista.length > 0,
        });
      }

      const programasLista = lista(programas);
      if (programasLista) {
        nuevosPasos.push({
          id: "programa",
          titulo: "Planificá la primera auditoría interna",
          detalle: "El programa anual define qué se audita, cuándo y con qué criterios.",
          href: "/dashboard/auditorias",
          icon: FileSearch,
          listo: programasLista.length > 0,
        });
      }

      const asignacionesLista = lista(asignaciones);
      if (programasLista && programasLista.length > 0 && asignacionesLista) {
        nuevosPasos.push({
          id: "asignacion",
          titulo: "Asigná el auditor de campo",
          detalle: "Hasta que la auditoría no está asignada, nadie la ve en la app de campo.",
          href: "/dashboard/auditorias",
          icon: ClipboardList,
          listo: asignacionesLista.length > 0,
        });
      }

      // --- Requiere tu atención ---------------------------------------------
      const nuevosPendientes: Pendiente[] = [];

      const ncsLista = lista(ncs);
      if (ncsLista) {
        const abiertas = ncsLista.filter((n: any) => n.estado === "abierta").length;
        if (abiertas > 0) {
          nuevosPendientes.push({
            id: "ncs",
            titulo: `${abiertas} ${abiertas === 1 ? "no conformidad abierta" : "no conformidades abiertas"}`,
            detalle: "Sin acción correctiva cerrada quedan como hallazgo en la próxima auditoría.",
            href: "/dashboard/iso9001",
            icon: AlertOctagon,
            tono: "alerta",
          });
        }
      }

      if (documentosLista) {
        const pendientesAprobacion = documentosLista.filter(
          (d: any) => d.status === "pendiente"
        ).length;
        if (pendientesAprobacion > 0) {
          nuevosPendientes.push({
            id: "aprobaciones",
            titulo: `${pendientesAprobacion} ${pendientesAprobacion === 1 ? "documento espera" : "documentos esperan"} aprobación`,
            detalle: "Un documento sin aprobar no es evidencia válida para el auditor.",
            href: "/dashboard/approvals",
            icon: CheckSquare,
            tono: "aviso",
          });
        }
      }

      if (asignacionesLista) {
        const sinDomicilio = asignacionesLista.filter((a: any) => !a.direccion).length;
        if (sinDomicilio > 0) {
          nuevosPendientes.push({
            id: "sin-domicilio",
            titulo: `${sinDomicilio} ${sinDomicilio === 1 ? "auditoría asignada sin domicilio" : "auditorías asignadas sin domicilio"}`,
            detalle: "El auditor las recibe sin saber a dónde ir. Cargá el domicilio en la asignación o en la ficha de la organización.",
            href: "/dashboard/auditorias",
            icon: ClipboardList,
            tono: "aviso",
          });
        }
      }

      setPasos(nuevosPasos);
      setPendientes(nuevosPendientes);
      setCargando(false);
    })();

    return () => {
      vigente = false;
    };
  }, [session, traer, esAdmin]);

  const hechos = pasos.filter((p) => p.listo).length;
  const puestaEnMarchaCompleta = pasos.length > 0 && hechos === pasos.length;
  const nombre = session?.user?.email?.split("@")[0] || "";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Encabezado. Sin jerga de implementación: quién sos y qué tenés enfrente. */}
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-6 sm:p-8 text-white shadow-lg">
        <div className="max-w-2xl space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-heading">
            Hola{nombre ? `, ${nombre}` : ""}
          </h1>
          <p className="text-white/80 text-sm leading-relaxed">
            {cargando
              ? "Revisando el estado de tu sistema de gestión…"
              : pendientes.length > 0
                ? "Esto es lo que requiere tu atención hoy."
                : puestaEnMarchaCompleta
                  ? "No hay nada pendiente. Está todo al día."
                  : soloAuditorias
                    ? "Seguí con la preparación de tus auditorías."
                    : "Seguí con la puesta en marcha de tu sistema de gestión."}
          </p>
        </div>
      </div>

      {/* Requiere tu atención. Solo si hay algo concreto que hacer. */}
      {pendientes.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Requiere tu atención
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {pendientes.map((p) => {
              const Icon = p.icon;
              return (
                <Link
                  key={p.id}
                  href={p.href}
                  className={`group bg-white dark:bg-zinc-950 rounded-xl border border-border p-4 flex items-start gap-3 shadow-sm hover:shadow-md transition ${
                    p.tono === "alerta" ? "border-l-4 border-l-red-500" : "border-l-4 border-l-amber-500"
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg flex-none ${
                      p.tono === "alerta"
                        ? "bg-red-500/10 text-red-600 dark:text-red-400"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <span className="font-semibold text-sm block">{p.titulo}</span>
                    <span className="text-xs text-muted-foreground leading-relaxed block">
                      {p.detalle}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 flex-none text-muted-foreground group-hover:text-secondary transition mt-1" />
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Puesta en marcha. Desaparece cuando está todo hecho. */}
      {!cargando && pasos.length > 0 && !puestaEnMarchaCompleta && (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between gap-3 flex-wrap">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Puesta en marcha
            </h2>
            <span className="text-xs text-muted-foreground">
              {hechos} de {pasos.length} listos
            </span>
          </div>

          <div className="h-1.5 bg-muted rounded-full overflow-hidden" role="presentation">
            <div
              className="h-full bg-secondary transition-all duration-500"
              style={{ width: `${Math.round((hechos / pasos.length) * 100)}%` }}
            />
          </div>

          <ol className="bg-white dark:bg-zinc-950 rounded-xl border border-border divide-y divide-border overflow-hidden shadow-sm">
            {pasos.map((paso) => {
              const Icon = paso.icon;
              return (
                <li key={paso.id}>
                  <Link
                    href={paso.href}
                    className={`group flex items-start gap-3 p-4 transition hover:bg-muted/40 ${
                      paso.listo ? "opacity-60" : ""
                    }`}
                  >
                    <span className="flex-none mt-0.5">
                      {paso.listo ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" aria-label="Listo" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground/40" aria-hidden="true" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <span
                        className={`text-sm font-semibold block ${
                          paso.listo ? "line-through decoration-muted-foreground/50" : ""
                        }`}
                      >
                        {paso.titulo}
                      </span>
                      {!paso.listo && (
                        <span className="text-xs text-muted-foreground leading-relaxed block">
                          {paso.detalle}
                        </span>
                      )}
                    </div>
                    <Icon className="w-4 h-4 flex-none text-muted-foreground/60 mt-0.5 hidden sm:block" />
                    {!paso.listo && (
                      <ArrowRight className="w-4 h-4 flex-none text-muted-foreground group-hover:text-secondary transition mt-0.5" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {/* Nada pendiente y la puesta en marcha terminada: un solo renglón. */}
      {!cargando && pendientes.length === 0 && puestaEnMarchaCompleta && (
        <div className="bg-white dark:bg-zinc-950 rounded-xl border border-border p-6 flex items-center gap-3 shadow-sm">
          <CheckCircle2 className="w-6 h-6 text-green-600 flex-none" />
          <p className="text-sm text-muted-foreground">
            Puesta en marcha completa y sin pendientes. Usá el menú para entrar a cualquier módulo.
          </p>
        </div>
      )}
    </div>
  );
}
