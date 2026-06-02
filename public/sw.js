// Service Worker — apenas para disparar notificações locais via showNotification
// (necessário no Chrome Android, que bloqueia `new Notification()`).
// NÃO faz cache de HTML. NÃO recebe push remoto.

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// A página envia { type: "show-notification", title, body, tag, icon, badge, url }
// e o SW dispara a notificação imediatamente.
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
