"use client";

import { useSession } from "next-auth/react";
import { useConnection } from "@/lib/use-connection";
import { WifiOff, RefreshCw, CheckCircle2 } from "lucide-react";

/**
 * Indicador global de conexión y sincronización para el Auditor en Campo.
 * Cuando hay respuestas pendientes o falta conexión, muestra una píldora fija
 * abajo a la derecha. Además, al recuperar la conexión, vacía el outbox.
 */
export default function OfflineSync() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken;
  const { online, pending, syncState } = useConnection(token);

  // Nada que mostrar: en línea y sin pendientes.
  if (online && pending === 0 && syncState !== "syncing") return null;

  let cls = "bg-primary text-white";
  let icon = <RefreshCw className="w-4 h-4 animate-spin" />;
  let text = "Sincronizando…";

  if (!online) {
    cls = "bg-amber-500 text-amber-950";
    icon = <WifiOff className="w-4 h-4" />;
    text = pending > 0 ? `Sin conexión · ${pending} sin enviar` : "Sin conexión";
  } else if (syncState === "syncing") {
    text = `Sincronizando · ${pending} en cola`;
  } else if (pending > 0) {
    cls = "bg-primary text-white";
    icon = <RefreshCw className="w-4 h-4" />;
    text = `${pending} pendiente${pending === 1 ? "" : "s"} de sincronizar`;
  } else {
    cls = "bg-green-600 text-white";
    icon = <CheckCircle2 className="w-4 h-4" />;
    text = "Todo sincronizado";
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 print:hidden">
      <div className={`flex items-center gap-2 rounded-full pl-3 pr-4 py-2 shadow-lg text-xs font-semibold ${cls}`}>
        {icon}
        <span>{text}</span>
      </div>
    </div>
  );
}
