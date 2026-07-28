/*
 * Motor de sincronización del outbox (Auditor en Campo).
 *
 * Vacía la cola de respuestas pendientes cuando hay conexión: por cada ítem,
 * sube la foto de evidencia (si hay) y luego hace PUT de la respuesta con su
 * client_uuid. El backend concilia por client_uuid (upsert idempotente), de modo
 * que reintentos o reconexiones intermitentes nunca duplican.
 *
 * La UI escucha el evento "sgna-sync-change" para refrescar el contador de
 * pendientes y el estado (idle | syncing | done).
 */
import { OutboxItem, outboxAll, outboxDelete, outboxPut, outboxCount } from "./offline-db";

export const SYNC_EVENT = "sgna-sync-change";

let flushing = false;

function emit(detail: { state: string; pending: number }) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail }));
  }
}

export async function getPending(): Promise<number> {
  return outboxCount();
}

async function uploadFoto(api: string, token: string, item: OutboxItem): Promise<string | null> {
  if (!item.foto_blob) return null;
  const fd = new FormData();
  const filename = `${item.client_uuid}.jpg`;
  fd.append("file", item.foto_blob, filename);
  const res = await fetch(`${api}/api/v1/auditorias/puntos/${item.punto_id}/foto`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });
  if (!res.ok) throw new Error("foto upload failed");
  const data = await res.json();
  return data.key || null;
}

async function pushOne(api: string, token: string, item: OutboxItem): Promise<boolean> {
  let foto_url: string | null = null;
  try {
    foto_url = await uploadFoto(api, token, item);
  } catch {
    // Si la subida de la foto falla, reintentamos todo el ítem más tarde.
    return false;
  }

  const res = await fetch(`${api}/api/v1/auditorias/puntos/${item.punto_id}/respuesta`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      resultado: item.resultado,
      nota: item.nota ?? null,
      lat: item.lat ?? null,
      lng: item.lng ?? null,
      foto_url,
      client_uuid: item.client_uuid,
    }),
  });

  // 2xx = aceptado (o ya existía por idempotencia). 4xx de validación también se
  // considera "resuelto" para no bloquear la cola para siempre; 5xx se reintenta.
  if (res.ok) return true;
  if (res.status >= 400 && res.status < 500) return true;
  return false;
}

export async function flushOutbox(api: string, token: string): Promise<void> {
  if (flushing) return;
  if (typeof navigator !== "undefined" && !navigator.onLine) return;
  if (!token) return;

  flushing = true;
  try {
    const items = await outboxAll();
    if (items.length === 0) {
      emit({ state: "idle", pending: 0 });
      return;
    }
    emit({ state: "syncing", pending: items.length });

    for (const item of items) {
      if (typeof navigator !== "undefined" && !navigator.onLine) break;
      try {
        item.status = "uploading";
        await outboxPut(item);
        const ok = await pushOne(api, token, item);
        if (ok) {
          await outboxDelete(item.client_uuid);
        } else {
          item.status = "error";
          item.attempts = (item.attempts || 0) + 1;
          await outboxPut(item);
        }
      } catch {
        item.status = "error";
        item.attempts = (item.attempts || 0) + 1;
        await outboxPut(item);
      }
      emit({ state: "syncing", pending: await outboxCount() });
    }

    const pending = await outboxCount();
    emit({ state: pending === 0 ? "done" : "idle", pending });
  } finally {
    flushing = false;
  }
}
