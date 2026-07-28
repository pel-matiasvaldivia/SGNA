"use client";

import { useEffect, useState, useCallback } from "react";
import { SYNC_EVENT, getPending, flushOutbox } from "./offline-sync";

/**
 * Hook de estado de conexión + cola de sincronización para el Auditor en Campo.
 * Devuelve si hay conexión, cuántas respuestas quedan pendientes y el estado de
 * la sincronización. Al recuperar la conexión dispara el vaciado del outbox.
 */
export function useConnection(token?: string) {
  const api = process.env.NEXT_PUBLIC_API_URL || "";
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);
  const [syncState, setSyncState] = useState<"idle" | "syncing" | "done">("idle");

  const refresh = useCallback(async () => {
    setPending(await getPending());
  }, []);

  const sync = useCallback(() => {
    if (token) flushOutbox(api, token);
  }, [api, token]);

  useEffect(() => {
    setOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    refresh();

    const onOnline = () => {
      setOnline(true);
      sync();
    };
    const onOffline = () => setOnline(false);
    const onSync = (e: Event) => {
      const detail = (e as CustomEvent).detail as { state: string; pending: number };
      if (detail) {
        setPending(detail.pending);
        if (detail.state === "syncing") setSyncState("syncing");
        else if (detail.state === "done") setSyncState("done");
        else setSyncState("idle");
      }
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener(SYNC_EVENT, onSync);

    // Intento inicial de sincronización por si quedaron pendientes de una sesión previa.
    if (typeof navigator === "undefined" || navigator.onLine) sync();

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener(SYNC_EVENT, onSync);
    };
  }, [refresh, sync]);

  return { online, pending, syncState, sync, refresh };
}
