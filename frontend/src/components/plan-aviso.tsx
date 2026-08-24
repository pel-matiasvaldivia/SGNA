"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { AlertTriangle, Clock, X } from "lucide-react";

type ItemUso = {
  clave: string;
  etiqueta: string;
  usado: number | null;
  limite: number | null;
  unidad: string | null;
  ilimitado: boolean;
  medible: boolean;
  excedido: boolean;
  porcentaje: number | null;
};

type EstadoPlan = {
  plan: string;
  plan_nombre: string;
  en_prueba: boolean;
  prueba_termina: string | null;
  dias_restantes_prueba: number;
  limites_aplicados: boolean;
  uso: ItemUso[];
  excedidos: string[];
};

/** Avisar que faltan 25 días de prueba es ruido; a una semana ya es útil. */
const DIAS_AVISO_PRUEBA = 7;

/** Formatea el consumo con su unidad, pasando a GB cuando la cifra lo pide. */
function formatear(valor: number | null, unidad: string | null): string {
  if (valor === null) return "—";
  if (unidad === "MB") {
    return valor >= 1024 ? `${(valor / 1024).toFixed(1)} GB` : `${valor} MB`;
  }
  return unidad ? `${valor} ${unidad}` : String(valor);
}

/**
 * Aviso de plan en el panel.
 *
 * Informa, no bloquea: pasarse de un tope nunca interrumpe una auditoría en
 * curso. Aparece cuando la prueba está por vencer o cuando, ya vencida, hay
 * algún tope superado.
 */
export default function PlanAviso() {
  const { data: session } = useSession();
  const [estado, setEstado] = useState<EstadoPlan | null>(null);
  const [oculto, setOculto] = useState(false);

  // Se lee en un efecto y no en el estado inicial: sessionStorage no existe en
  // el render del servidor y leerlo ahí rompería la hidratación.
  useEffect(() => {
    try {
      if (sessionStorage.getItem("plan-aviso-oculto") === "1") setOculto(true);
    } catch {
      /* modo privado o almacenamiento bloqueado */
    }
  }, []);

  useEffect(() => {
    const token = (session as any)?.accessToken;
    if (!token) return;

    let cancelado = false;
    (async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/tenant/uso`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) return;
        const data: EstadoPlan = await res.json();
        if (!cancelado) setEstado(data);
      } catch {
        /* el aviso de plan nunca debe romper el panel */
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [session]);

  if (!estado || oculto) return null;

  const excedidos = estado.uso.filter((i) => i.excedido);
  const hayExceso = estado.limites_aplicados && excedidos.length > 0;
  const pruebaPorVencer =
    estado.en_prueba && estado.dias_restantes_prueba <= DIAS_AVISO_PRUEBA;

  if (!hayExceso && !pruebaPorVencer) return null;

  // Se oculta por sesión, no para siempre: si el exceso sigue al día siguiente,
  // el aviso vuelve. Una baja permanente convertiría el tope en letra muerta.
  const cerrar = () => {
    setOculto(true);
    try {
      sessionStorage.setItem("plan-aviso-oculto", "1");
    } catch {
      /* modo privado o almacenamiento bloqueado */
    }
  };

  if (hayExceso) {
    return (
      <div
        role="status"
        className="mb-6 rounded-xl border border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 p-5"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-amber-900 dark:text-amber-200 text-sm">
              Superaste los límites del plan {estado.plan_nombre}
            </h3>
            <p className="text-sm text-amber-800 dark:text-amber-300/90 mt-1">
              Podés seguir trabajando con normalidad — no bloqueamos nada. Cuando puedas,
              conversemos para ajustar el plan a lo que estás usando.
            </p>

            <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5">
              {excedidos.map((item) => (
                <li
                  key={item.clave}
                  className="text-sm text-amber-900 dark:text-amber-200 tabular-nums"
                >
                  <span className="font-semibold">{item.etiqueta}:</span>{" "}
                  {formatear(item.usado, item.unidad)}
                  <span className="text-amber-700 dark:text-amber-400/80">
                    {" "}
                    de {formatear(item.limite, item.unidad)}
                  </span>
                </li>
              ))}
            </ul>

            <a
              href={`mailto:ventas@auditoriasenlinea.com.ar?subject=${encodeURIComponent(
                `Ampliación de plan ${estado.plan_nombre}`
              )}`}
              className="inline-block mt-3 text-sm font-semibold text-amber-900 dark:text-amber-200 underline underline-offset-2 hover:no-underline"
            >
              Solicitar ampliación
            </a>
          </div>
          <button
            onClick={cerrar}
            aria-label="Ocultar aviso"
            className="text-amber-600 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      role="status"
      className="mb-6 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4"
    >
      <div className="flex items-center gap-3">
        <Clock className="w-5 h-5 text-primary shrink-0" />
        <p className="text-sm text-slate-700 dark:text-slate-300 flex-1">
          Tu período de prueba termina en{" "}
          <strong>
            {estado.dias_restantes_prueba}{" "}
            {estado.dias_restantes_prueba === 1 ? "día" : "días"}
          </strong>
          . A partir de ahí aplican los límites del plan {estado.plan_nombre}.
        </p>
        <button
          onClick={cerrar}
          aria-label="Ocultar aviso"
          className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
