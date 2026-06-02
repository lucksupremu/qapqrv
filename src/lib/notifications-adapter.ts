// Adapter de notificações locais.
// - APK Android (Capacitor): usa @capacitor/local-notifications (persiste com app fechado, AlarmManager)
// - Web/PWA: setTimeout + ServiceWorkerRegistration.showNotification, com fila em localStorage e rehydrate

const NOTIF_ICON_192 = "/notif-icon-192.png";
const NOTIF_BADGE_72 = "/notif-badge-72.png";

export type ScheduledReminder = {
  id: string; // `${marcaId}:${index}`
  marcaId: string;
  whenISO: string;
  title: string;
  body: string;
};

const QUEUE_KEY = "reminders_queue";
const NATIVE_ID_MAP_KEY = "reminders_native_id_map";
const timers = new Map<string, ReturnType<typeof setTimeout>>();

function isNative(): boolean {
  if (typeof window === "undefined") return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cap = (window as any).Capacitor;
  return !!cap?.isNativePlatform?.();
}

function isPreviewOrIframe(): boolean {
  if (typeof window === "undefined") return true;
  try {
    if (window.self !== window.top) return true;
  } catch {
    return true;
  }
  const host = window.location.hostname;
  return host.includes("id-preview--") || host.includes("lovableproject.com");
}

function loadQueue(): ScheduledReminder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as ScheduledReminder[]) : [];
  } catch {
    return [];
  }
}

function saveQueue(q: ScheduledReminder[]) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
  } catch {
    /* ignore */
  }
}

function loadNativeIdMap(): Record<string, number> {
  try {
    const raw = localStorage.getItem(NATIVE_ID_MAP_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveNativeIdMap(map: Record<string, number>) {
  try {
    localStorage.setItem(NATIVE_ID_MAP_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

// Hash determinístico string → int (32 bits, positivo)
function stringToInt(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h | 0) || 1;
}

// Registra o Service Worker uma vez (web only, fora de iframe/preview).
let swReadyPromise: Promise<ServiceWorkerRegistration | null> | null = null;
export function ensureServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (swReadyPromise) return swReadyPromise;
  swReadyPromise = (async () => {
    if (typeof window === "undefined") return null;
    if (isNative()) return null;
    if (isPreviewOrIframe()) return null;
    if (!("serviceWorker" in navigator)) return null;
    try {
      const existing = await navigator.serviceWorker.getRegistration("/");
      const reg = existing ?? (await navigator.serviceWorker.register("/sw.js", { scope: "/" }));
      await navigator.serviceWorker.ready;
      return reg;
    } catch (e) {
      console.error("[notif] SW register failed", e);
      return null;
    }
  })();
  return swReadyPromise;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (isNative()) {
    try {
      const mod = await (async () => { throw new Error("APK descontinuado: @capacitor/local-notifications indisponível"); })();
      const res = await mod.LocalNotifications.requestPermissions();
      return res.display === "granted" ? "granted" : "denied";
    } catch {
      return "denied";
    }
  }
  if (typeof window === "undefined" || !("Notification" in window)) return "denied";
  if (Notification.permission === "default") {
    try {
      const p = await Notification.requestPermission();
      if (p === "granted") void ensureServiceWorker();
      return p;
    } catch {
      return "denied";
    }
  }
  if (Notification.permission === "granted") void ensureServiceWorker();
  return Notification.permission;
}

export function getPermission(): NotificationPermission {
  if (isNative()) return "granted";
  if (typeof window === "undefined" || !("Notification" in window)) return "denied";
  return Notification.permission;
}

// Mostra notificação imediata na web — preferindo o Service Worker
// (obrigatório no Chrome Android; o construtor `new Notification` é bloqueado lá).
async function showNotificationWeb(opts: {
  title: string;
  body: string;
  tag?: string;
  url?: string;
}): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission !== "granted") return false;
  const reg = await ensureServiceWorker();
  const payload = {
    body: opts.body,
    icon: NOTIF_ICON_192,
    badge: NOTIF_BADGE_72,
    tag: opts.tag ?? `notif-${Date.now()}`,
    data: { url: opts.url ?? "/calendario" },
    requireInteraction: false,
  };
  if (reg) {
    try {
      await reg.showNotification(opts.title, payload);
      return true;
    } catch (e) {
      console.warn("[notif] reg.showNotification falhou, tentando fallback", e);
    }
  }
  // Fallback desktop quando SW indisponível
  try {
    new Notification(opts.title, payload);
    return true;
  } catch (e) {
    console.error("[notif] new Notification falhou", e);
    return false;
  }
}

function fireNow(r: ScheduledReminder) {
  void showNotificationWeb({ title: r.title, body: r.body, tag: r.id });
}

const MAX_TIMEOUT = 24 * 60 * 60 * 1000;

function scheduleOneWeb(r: ScheduledReminder) {
  const existing = timers.get(r.id);
  if (existing) clearTimeout(existing);

  const when = new Date(r.whenISO).getTime();
  const delay = when - Date.now();

  if (delay <= 0) return;
  if (delay > MAX_TIMEOUT) return;

  const t = setTimeout(() => {
    fireNow(r);
    timers.delete(r.id);
    const q = loadQueue().filter((x) => x.id !== r.id);
    saveQueue(q);
  }, delay);
  timers.set(r.id, t);
}

async function scheduleNative(reminders: ScheduledReminder[]) {
  try {
    const mod = await (async () => { throw new Error("APK descontinuado: @capacitor/local-notifications indisponível"); })();
    const map = loadNativeIdMap();
    const toSchedule = reminders
      .map((r) => {
        const at = new Date(r.whenISO);
        if (at.getTime() <= Date.now()) return null;
        const nid = stringToInt(r.id);
        map[r.id] = nid;
        return {
          id: nid,
          title: r.title,
          body: r.body,
          schedule: { at, allowWhileIdle: true },
          smallIcon: "ic_stat_notification",
          iconColor: "#0c2340",
          extra: { marcaId: r.marcaId, reminderId: r.id },
        };
      })
      .filter(Boolean);
    if (toSchedule.length === 0) return;
    saveNativeIdMap(map);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await mod.LocalNotifications.schedule({ notifications: toSchedule as any });
  } catch (e) {
    console.error("[notif] native schedule failed", e);
  }
}

async function cancelNativeForMarca(marcaId: string) {
  try {
    const mod = await (async () => { throw new Error("APK descontinuado: @capacitor/local-notifications indisponível"); })();
    const map = loadNativeIdMap();
    const ids = Object.entries(map)
      .filter(([key]) => key.startsWith(`${marcaId}:`))
      .map(([, id]) => ({ id }));
    if (ids.length > 0) {
      await mod.LocalNotifications.cancel({ notifications: ids });
      for (const key of Object.keys(map)) {
        if (key.startsWith(`${marcaId}:`)) delete map[key];
      }
      saveNativeIdMap(map);
    }
  } catch (e) {
    console.error("[notif] native cancel failed", e);
  }
}

export function scheduleRemindersForMarca(
  marcaId: string,
  whenISOs: string[],
  buildContent: (whenISO: string, index: number) => { title: string; body: string },
) {
  cancelForMarca(marcaId);
  const q = loadQueue();
  const now = Date.now();
  const reminders: ScheduledReminder[] = [];

  whenISOs.forEach((whenISO, index) => {
    const when = new Date(whenISO).getTime();
    if (Number.isNaN(when) || when <= now) return;
    const { title, body } = buildContent(whenISO, index);
    const r: ScheduledReminder = {
      id: `${marcaId}:${index}`,
      marcaId,
      whenISO,
      title,
      body,
    };
    reminders.push(r);
    q.push(r);
  });

  saveQueue(q);

  if (isNative()) {
    void scheduleNative(reminders);
  } else {
    for (const r of reminders) scheduleOneWeb(r);
  }
}

export function cancelForMarca(marcaId: string) {
  const q = loadQueue().filter((r) => {
    if (r.marcaId !== marcaId) return true;
    const t = timers.get(r.id);
    if (t) {
      clearTimeout(t);
      timers.delete(r.id);
    }
    return false;
  });
  saveQueue(q);
  if (isNative()) void cancelNativeForMarca(marcaId);
}

/** Re-arma timers no boot e periodicamente. No nativo, o plugin já persiste. */
export function rehydrateReminders() {
  if (typeof window === "undefined") return;
  if (isNative()) return;

  const now = Date.now();
  const fresh = loadQueue().filter((r) => {
    const when = new Date(r.whenISO).getTime();
    if (Number.isNaN(when)) return false;
    if (when <= now) {
      // Catch-up: dispara o aviso atrasado agora.
      fireNow(r);
      return false;
    }
    scheduleOneWeb(r);
    return true;
  });
  saveQueue(fresh);
}

/** Dispara uma notificação local de teste imediatamente. */
export async function fireTestNotification(): Promise<boolean> {
  const perm = await requestNotificationPermission();
  if (perm !== "granted") return false;

  if (isNative()) {
    try {
      const mod = await (async () => { throw new Error("APK descontinuado: @capacitor/local-notifications indisponível"); })();
      await mod.LocalNotifications.schedule({
        notifications: [
          {
            id: stringToInt(`test:${Date.now()}`),
            title: "Teste de notificação",
            body: "Tudo funcionando! Você receberá avisos das escalas.",
            schedule: { at: new Date(Date.now() + 1000) },
            smallIcon: "ic_stat_notification",
            iconColor: "#0c2340",
          },
        ],
      });
      return true;
    } catch {
      return false;
    }
  }

  return showNotificationWeb({
    title: "Teste de notificação",
    body: "Tudo funcionando! Você receberá avisos das escalas.",
    tag: "test-notification",
  });
}
