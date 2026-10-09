"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowRight, Check, ClipboardCheck, Layers, Loader2 } from "lucide-react";

/**
 * Asistente de alta: una sola pregunta.
 *
 * Antes eran cinco pasos —bienvenida, personalización, ajustes regionales,
 * roles base, listo— y **no guardaban nada**: el código tenía un
 * `// In a real app, save the settings to the backend` y un `setTimeout` de
 * 1,5 s que llevaba al dashboard. Cinco pantallas de trámite para terminar
 * exactamente donde se empezaba.
 *
 * Ahora hay una sola pregunta, y es la que cambia lo que la persona ve después:
 * a qué vino. De la respuesta sale la edición de la organización, y con ella
 * qué módulos existen. Es la diferencia entre entrar a una consola de seis
 * secciones que se entiende sola, y entrar a una de veintidós donde hay que
 * adivinar por dónde se empieza.
 *
 * Se muestra una sola vez por organización: el backend distingue «no eligió»
 * (`edicion` en NULL) de «eligió la completa», y el layout trae a esta pantalla
 * solo en el primer caso, y solo a quien puede contestar (admin).
 *
 * Elegir no cierra ninguna puerta: cambiar de edición es cambiar un valor desde
 * Configuración → Alcance de la plataforma, no se pierde nada, y los módulos
 * que vuelven lo hacen con sus datos intactos.
 */

type Opcion = {
  key: "auditorias" | "completa";
  titulo: string;
  bajada: string;
  icon: typeof ClipboardCheck;
  incluye: string[];
};

const OPCIONES: Opcion[] = [
  {
    key: "auditorias",
    titulo: "Ejecutar auditorías internas",
    bajada:
      "Para auditar, en cualquier industria. La consola queda en seis secciones y se puede usar el primer día.",
    icon: ClipboardCheck,
    incluye: [
      "Programa anual y plan de auditoría",
      "Checklist y app del auditor en campo",
      "Hallazgos y no conformidades",
      "Documentos de evidencia e informe",
    ],
  },
  {
    key: "completa",
    titulo: "Implementar un sistema de gestión",
    bajada:
      "Para llevar una organización a ISO 9001, 14001 o 45001 y mantenerla. Incluye todo lo de auditorías.",
    icon: Layers,
    incluye: [
      "Contexto, alcance y partes interesadas",
      "Procesos, competencias y proveedores",
      "Equipos, calibración y mantenimiento",
      "Indicadores y revisión por la dirección",
    ],
  },
];

export default function AsistenteDeAlta() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [elegida, setElegida] = React.useState<Opcion["key"] | null>(null);
  const [guardando, setGuardando] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const confirmar = async () => {
    if (!elegida || guardando) return;
    setGuardando(true);
    setError(null);
    try {
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/tenant/edicion`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any)?.accessToken}`,
        },
        body: JSON.stringify({ edicion: elegida }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => null);
        throw new Error(d?.detail || "No se pudo guardar la elección.");
      }
      // Recarga completa y no router.push: el layout lee la edición al montar,
      // así que navegar sin recargar dejaría el menú con el alcance anterior.
      window.location.href = "/dashboard";
    } catch (e: any) {
      setError(e?.message || "No se pudo guardar la elección.");
      setGuardando(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20 text-sm text-muted-foreground italic">
        Cargando…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-4xl space-y-6 animate-fade-in">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold font-heading tracking-tight">
            ¿A qué viniste?
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Con esto ajustamos qué secciones ves. Podés cambiarlo cuando quieras desde
            Configuración, y no se pierde nada al hacerlo.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {OPCIONES.map((o) => {
            const Icon = o.icon;
            const activa = elegida === o.key;
            return (
              <button
                key={o.key}
                type="button"
                onClick={() => setElegida(o.key)}
                aria-pressed={activa}
                className={`text-left bg-white dark:bg-zinc-950 rounded-2xl border-2 p-5 sm:p-6 transition shadow-sm hover:shadow-md flex flex-col gap-4 ${
                  activa
                    ? "border-secondary ring-2 ring-secondary/20"
                    : "border-border hover:border-secondary/40"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`p-2.5 rounded-xl flex-none transition ${
                      activa ? "bg-secondary text-white" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <span
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-none transition ${
                      activa ? "bg-secondary border-secondary" : "border-muted-foreground/30"
                    }`}
                    aria-hidden="true"
                  >
                    {activa && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h2 className="font-bold text-base leading-snug">{o.titulo}</h2>
                  <p className="text-xs text-muted-foreground leading-relaxed">{o.bajada}</p>
                </div>

                <ul className="space-y-1.5 mt-auto pt-3 border-t border-border">
                  {o.incluye.map((linea) => (
                    <li key={linea} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Check className="w-3.5 h-3.5 flex-none mt-0.5 text-green-600" />
                      <span>{linea}</span>
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        {error && (
          <p className="text-sm text-red-600 text-center" role="alert">
            {error}
          </p>
        )}

        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={confirmar}
            disabled={!elegida || guardando}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-secondary text-white font-semibold text-sm shadow transition hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-auto"
          >
            {guardando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Preparando tu consola…
              </>
            ) : (
              <>
                Empezar <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
          <p className="text-xs text-muted-foreground text-center">
            Si no estás seguro, elegí auditorías: sumar el resto después es un clic.
          </p>
        </div>
      </div>
    </div>
  );
}
