// Service Worker do QAP, QRV!
// 1) Mantém notificações locais via showNotification (Chrome Android exige SW).
// 2) Cache app-shell para abrir offline (NetworkFirst HTML, CacheFirst assets hashados).
// Não interfere com a intranet PMESP (URLs externas passam direto pela rede).

const CACHE_VERSION = "qapqrv-v3";
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const ASSET_CACHE = `${CACHE_VERSION}-assets`;
const SHELL_URLS = [
  "/",
  "/escalas-baixadas",
  "/calendario",
  "/historico",
  "/favoritos",
  "/configuracoes",
  "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(SHELL_CACHE);
        await cache.addAll(SHELL_URLS).catch(() => {});
      } catch {}
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Limpa caches antigos de versões anteriores.
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((n) => !n.startsWith(CACHE_VERSION))
          .map((n) => caches.delete(n)),
      );
      await self.clients.claim();
    })(),
  );
});

// Estratégia de fetch.
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Mesma origem apenas — não interfere com intranet PMESP, ads, etc.
  if (url.origin !== self.location.origin) return;

  // Skip APIs/SSR endpoints.
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_serverFn")) return;

  // Assets hashados (Vite) → CacheFirst.
  if (url.pathname.startsWith("/assets/") || /\.(js|css|woff2?|ttf|png|jpe?g|svg|webp|ico)$/i.test(url.pathname)) {
    event.respondWith(
      caches.open(ASSET_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        if (cached) return cached;
        try {
          const resp = await fetch(req);
          if (resp.ok) cache.put(req, resp.clone());
          return resp;
        } catch {
          return cached || Response.error();
        }
      }),
    );
    return;
  }

  // Navegação HTML → NetworkFirst com fallback ao shell em offline.
  if (req.mode === "navigate" || req.destination === "document") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(SHELL_CACHE);
        try {
          const resp = await fetch(req);
          if (resp.ok) cache.put(req, resp.clone());
          return resp;
        } catch {
          const cached = await cache.match(req);
          if (cached) return cached;
          const fallback = await cache.match("/");
          if (fallback) return fallback;
          return new Response("Offline", { status: 503, statusText: "Offline" });
        }
      })(),
    );
  }
});

// === Notificações locais (mantido do original) ===
self.addEventListener("message", (event) => {
  const data = event.data || {};
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
