/*
 * Capa de almacenamiento offline (IndexedDB) para el módulo Auditor en Campo.
 * Sin dependencias externas. Dos stores:
 *   - kv:     datos cacheados para uso sin conexión (lista de asignaciones,
 *             detalle + checklist por asignación).
 *   - outbox: cola de escrituras pendientes de sincronizar (respuestas de control).
 *
 * El "outbox" implementa el patrón de idempotencia: cada respuesta lleva un
 * client_uuid generado en el cliente; el backend hace upsert por ese uuid, así
 * reenviar una acción tras una reconexión intermitente nunca duplica.
 */

const DB_NAME = "sgna-offline";
const DB_VERSION = 1;
const KV = "kv";
const OUTBOX = "outbox";

export interface OutboxItem {
  client_uuid: string;
  punto_id: string;
  asignacion_id: string;
  resultado: string;
  nota?: string | null;
  lat?: number | null;
  lng?: number | null;
  foto_blob?: Blob | null; // evidencia local, se sube al sincronizar
  created_at: number;
  status: "pending" | "uploading" | "error";
  attempts: number;
  label?: string;
}

function isAvailable(): boolean {
  return typeof window !== "undefined" && "indexedDB" in window;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(KV)) db.createObjectStore(KV, { keyPath: "key" });
      if (!db.objectStoreNames.contains(OUTBOX)) db.createObjectStore(OUTBOX, { keyPath: "client_uuid" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(store, mode);
        const s = t.objectStore(store);
        const r = fn(s);
        r.onsuccess = () => resolve(r.result as T);
        r.onerror = () => reject(r.error);
      })
  );
}

// ---- KV cache ----
export async function kvSet(key: string, value: any): Promise<void> {
  if (!isAvailable()) return;
  try {
    await tx(KV, "readwrite", (s) => s.put({ key, value, ts: Date.now() }));
  } catch {
    /* almacenamiento no disponible: se ignora */
  }
}

export async function kvGet<T = any>(key: string): Promise<T | null> {
  if (!isAvailable()) return null;
  try {
    const row: any = await tx(KV, "readonly", (s) => s.get(key));
    return row ? (row.value as T) : null;
  } catch {
    return null;
  }
}

// ---- Outbox ----
export async function outboxAdd(item: OutboxItem): Promise<void> {
  if (!isAvailable()) return;
  await tx(OUTBOX, "readwrite", (s) => s.put(item));
}

export async function outboxAll(): Promise<OutboxItem[]> {
  if (!isAvailable()) return [];
  try {
    const all: OutboxItem[] = await tx(OUTBOX, "readonly", (s) => s.getAll());
    return all.sort((a, b) => a.created_at - b.created_at);
  } catch {
    return [];
  }
}

export async function outboxPut(item: OutboxItem): Promise<void> {
  if (!isAvailable()) return;
  await tx(OUTBOX, "readwrite", (s) => s.put(item));
}

export async function outboxDelete(client_uuid: string): Promise<void> {
  if (!isAvailable()) return;
  await tx(OUTBOX, "readwrite", (s) => s.delete(client_uuid));
}

export async function outboxCount(): Promise<number> {
  if (!isAvailable()) return 0;
  try {
    return await tx<number>(OUTBOX, "readonly", (s) => s.count());
  } catch {
    return 0;
  }
}

export function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  // Fallback RFC4122 v4
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
