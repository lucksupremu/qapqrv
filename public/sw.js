// Service Worker — offline-first cache + notificações locais.
// Estratégia:
//  - Navegação (HTML)       : NetworkFirst com timeout de 2s → cache → fallback offline
//  - /assets/* (hash imutável): CacheFirst
//  - Outros GET same-origin : StaleWhileRevalidate
//  - Mantém showNotification para o app Web

// IMPORTANTE: bump a versão a cada deploy crítico para invalidar caches antigos.
const VERSION = "v3-2026-06-02";
const STATIC_CACHE = `mike-static-${VERSION}`;
const RUNTIME_CACHE = `mike-runtime-${VERSION}`;
const HTML_CACHE = `mike-html-${VERSION}`;

const PRECACHE_URLS = [
  "/",
  "/manifest.webmanifest",
  "/notif-icon-192.png",
  "/notif-badge-72.png",
];

// ============= Lifecycle =============
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      // Cache tolerante a falhas individuais
      await Promise.all(
        PRECACHE_URLS.map((url) =>
          cache.add(new Request(url, { cache: "reload" })).catch(() => null),
        ),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Remove caches de versões antigas
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith("mike-") && !k.endsWith(VERSION))
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

// ============= Fetch strategies =============
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Só intercepta same-origin
  if (url.origin !== self.location.origin) return;

  // Ignora rotas internas / APIs / sw / service-worker
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname === "/sw.js" ||
    url.pathname === "/service-worker.js"
  ) {
    return;
  }

  // Navegação (HTML) → NetworkFirst com timeout
  if (req.mode === "navigate") {
    event.respondWith(networkFirstHTML(req));
    return;
  }

  // Assets hashados (Vite/Tanstack) → CacheFirst
  if (url.pathname.startsWith("/assets/") || url.pathname.startsWith("/_build/")) {
    event.respondWith(cacheFirst(req, RUNTIME_CACHE));
    return;
  }

  // Ícones, manifest, imagens, fontes → StaleWhileRevalidate
  if (
    /\.(png|jpg|jpeg|svg|webp|ico|gif|woff2?|ttf|otf|webmanifest|json|css|js)$/i.test(
      url.pathname,
    )
  ) {
    event.respondWith(staleWhileRevalidate(req, RUNTIME_CACHE));
    return;
  }
});

async function networkFirstHTML(req) {
  const cache = await caches.open(HTML_CACHE);
  try {
    const networkPromise = fetch(req);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), 2000),
    );
    const res = await Promise.race([networkPromise, timeoutPromise]);
    if (res && res.ok) {
      cache.put(req, res.clone()).catch(() => {});
      // Também guarda como "/" para servir como app-shell offline
      cache.put("/", res.clone()).catch(() => {});
    }
    return res;
  } catch {
    const cached =
      (await cache.match(req)) ||
      (await cache.match("/")) ||
      (await caches.match("/"));
    if (cached) return cached;
    return new Response(
      "<!doctype html><meta charset=utf-8><title>Offline</title><h1>Sem conexão</h1><p>Abra novamente quando estiver online.</p>",
      { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 503 },
    );
  }
}

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res && res.ok) cache.put(req, res.clone()).catch(() => {});
    return res;
  } catch (err) {
    if (cached) return cached;
    throw err;
  }
}

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  const networkPromise = fetch(req)
    .then((res) => {
      if (res && res.ok) cache.put(req, res.clone()).catch(() => {});
      return res;
    })
    .catch(() => null);
  return cached || (await networkPromise) || Response.error();
}

// ============= Notificações locais (mantido) =============
self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }
  if (data.type !== "show-notification") return;
  const title = data.title || "Aviso";
  const options = {
    body: data.body || "",
    icon: data.icon || "/notif-icon-192.png",
    badge: data.badge || "/notif-badge-72.png",
    tag: data.tag || `notif-${Date.now()}`,
    data: { url: data.url || "/calendario" },
    requireInteraction: false,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/calendario";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    }),
  );
});
