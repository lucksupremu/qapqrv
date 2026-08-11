// Service Worker do MIKE TOOLS
// 1) Mantém notificações locais via showNotification (Chrome Android exige SW).
// 2) Cache de assets hashados; páginas SSR nunca são persistidas neste worker.
// 3) Stale-while-revalidate para PDFs de escala (rede primeiro em background,
//    cache servido imediato se já houver).
// Não interfere com a intranet PMESP (URLs externas passam direto pela rede).

// v7 remove definitivamente qualquer app-shell SPA/HTML antigo. Isso evita que
// um cache legado restaure /src/main.tsx após a migração para SSR.
const CACHE_VERSION = "qapqrv-v7";
const ASSET_CACHE = `${CACHE_VERSION}-assets`;
const PDF_CACHE = `${CACHE_VERSION}-pdf`;
const PDF_MAX_ENTRIES = 20;

// Detecta ambientes de preview Lovable — nestes domínios o SW deve se
// auto-desregistrar e limpar caches.
const host = self.location.hostname;
const IS_PREVIEW =
  host.startsWith("id-preview--") ||
  host.startsWith("preview--") ||
  host === "lovableproject.com" ||
  host.endsWith(".lovableproject.com") ||
  host === "lovableproject-dev.com" ||
  host.endsWith(".lovableproject-dev.com") ||
  host === "beta.lovable.dev" ||
  host.endsWith(".beta.lovable.dev");

async function trimCache(cacheName, maxEntries) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length <= maxEntries) return;
    const toDelete = keys.slice(0, keys.length - maxEntries);
    await Promise.all(toDelete.map((k) => cache.delete(k)));
  } catch {}
}

if (IS_PREVIEW) {
  self.addEventListener("install", () => self.skipWaiting());
  self.addEventListener("activate", (event) => {
    event.waitUntil(
      (async () => {
        try {
          const names = await caches.keys();
          await Promise.all(
            names
              .filter((n) => n.startsWith("qapqrv-"))
              .map((n) => caches.delete(n)),
          );
          await self.clients.claim();
          const clientsList = await self.clients.matchAll({ type: "window" });
          await Promise.allSettled(clientsList.map((c) => c.navigate(c.url)));
        } finally {
          await self.registration.unregister();
        }
      })(),
    );
  });
} else {
  self.addEventListener("install", (event) => {
    event.waitUntil(self.skipWaiting());
  });

  self.addEventListener("activate", (event) => {
    event.waitUntil(
      (async () => {
        const names = await caches.keys();
        await Promise.all(
          names
            .filter((n) => n.startsWith("qapqrv-") && !n.startsWith(CACHE_VERSION))
            .map((n) => caches.delete(n)),
        );
        await self.clients.claim();
        // Recarrega abas controladas para que recebam imediatamente o HTML SSR
        // atual, em vez de continuarem executando o shell SPA antigo em memória.
        const clientsList = await self.clients.matchAll({ type: "window" });
        await Promise.allSettled(clientsList.map((client) => client.navigate(client.url)));
      })(),
    );
  });

  self.addEventListener("fetch", (event) => {
    const req = event.request;
    if (req.method !== "GET") return;
    const url = new URL(req.url);

    // === Stale-while-revalidate para PDFs (mesma origem ou intranet) ===
    const isPdf = /\.pdf(\?|$)/i.test(url.pathname) || req.destination === "document" && /pdf/i.test(req.headers.get("accept") || "");
    if (isPdf) {
      event.respondWith(
        (async () => {
          const cache = await caches.open(PDF_CACHE);
          const cached = await cache.match(req);
          const network = fetch(req)
            .then((resp) => {
              if (resp && resp.ok) {
                cache.put(req, resp.clone()).then(() => trimCache(PDF_CACHE, PDF_MAX_ENTRIES));
              }
              return resp;
            })
            .catch(() => null);
          return cached || (await network) || Response.error();
        })(),
      );
      return;
    }

    if (url.origin !== self.location.origin) return;
    if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_serverFn")) return;

    if (
      url.pathname.startsWith("/assets/") ||
      /\.(js|css|woff2?|ttf|png|jpe?g|svg|webp|ico)$/i.test(url.pathname)
    ) {
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

    if (req.mode === "navigate" || req.destination === "document") {
      // O HTML precisa vir sempre do servidor para manter SSR, metadados por
      // rota e releases atuais. Não há fallback para o antigo shell SPA.
      event.respondWith(fetch(req));
    }
  });
}

// === Notificações locais (sempre ativo, inclusive preview) ===
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

// === Push remoto (Web Push do backend) ===
self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: "MIKE TOOLS", body: event.data ? event.data.text() : "" };
  }
  const title = payload.title || "MIKE TOOLS";
  const options = {
    body: payload.body || "",
    icon: payload.icon || "/notif-icon-192.png",
    badge: payload.badge || "/notif-badge-72.png",
    image: payload.image || undefined,
    tag: payload.tag || `push-${Date.now()}`,
    data: { url: payload.url || "/" },
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
