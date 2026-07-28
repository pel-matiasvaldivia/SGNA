/*
 * Service Worker — Auditorías en Línea (módulo Auditor en Campo / PWA offline)
 *
 * Estrategias:
 *  - Navegaciones (documentos HTML): network-first con fallback a la última copia
 *    en caché, para que la app abra estando sin conexión.
 *  - Assets estáticos de Next (_next/static, íconos, imágenes): stale-while-revalidate.
 *  - GET del API (v1): network-first con fallback a caché (datos vistos con señal).
 *  - Las escrituras (POST/PUT/DELETE) NUNCA se cachean: las maneja el "outbox" de la
 *    app (IndexedDB) y se sincronizan al reconectar.
 */
const VERSION = "sgna-campo-v1";
const SHELL_CACHE = `${VERSION}-shell`;
const STATIC_CACHE = `${VERSION}-static`;
const API_CACHE = `${VERSION}-api`;

const CORE = ["/dashboard/mis-auditorias", "/offline.html", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((c) => c.addAll(CORE).catch(() => {})).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static") ||
    url.pathname.startsWith("/icons/") ||
    /\.(png|jpg|jpeg|svg|webp|ico|woff2?|css|js)$/.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Solo GET del mismo origen se cachea.
  if (req.method !== "GET" || url.origin !== self.location.origin) return;

  // API GET (datos v1) y la sesión de NextAuth: network-first con fallback a caché,
  // para que la app siga autenticada y con datos aunque no haya conexión.
  if (url.pathname.startsWith("/api/v1/") || url.pathname === "/api/auth/session") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(API_CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Assets estáticos: stale-while-revalidate.
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const network = fetch(req)
          .then((res) => {
            const copy = res.clone();
            caches.open(STATIC_CACHE).then((c) => c.put(req, copy));
            return res;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  // Navegaciones: network-first, fallback a caché y luego a /offline.html.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL_CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((c) => c || caches.match("/offline.html")))
    );
    return;
  }
});

// Permite que la app pida activar el SW nuevo de inmediato.
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
