// Notification adapter: web now, Capacitor-ready later.
//
// Web: uses the Notification API + setTimeout for in-session firing,
// plus a localStorage queue + 1h interval rehydrate for longer horizons.
//
// Capacitor: when running natively, swap the implementation to
// @capacitor/local-notifications (LocalNotifications.schedule), which
// survives app close. Install with:
//   bun add @capacitor/local-notifications
//   npx cap sync
// then uncomment the native block in scheduleOne / cancelForMarca.

export type ScheduledReminder = {
  id: string; // `${marcaId}:${index}`
  marcaId: string;
  whenISO: string;
  title: string;
  body: string;
};

const QUEUE_KEY = "reminders_queue";
const timers = new Map<string, ReturnType<typeof setTimeout>>();

function isNative() {
  if (typeof window === "undefined") return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cap = (window as any).Capacitor;
  return !!cap?.isNativePlatform?.();
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

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) return "denied";
  if (Notification.permission === "default") {
    try {
      return await Notification.requestPermission();
    } catch {
      return "denied";
    }
  }
  return Notification.permission;
}

export function getPermission(): NotificationPermission {
  if (typeof window === "undefined" || !("Notification" in window)) return "denied";
  return Notification.permission;
}

function fireNow(r: ScheduledReminder) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(r.title, {
      body: r.body,
      icon: "/favicon.ico",
      tag: r.id,
    });
  } catch {
    /* ignore */
  }
}

const MAX_TIMEOUT = 24 * 60 * 60 * 1000; // 24h window for setTimeout scheduling

function scheduleOne(r: ScheduledReminder) {
  // Clear any existing timer for this id
  const existing = timers.get(r.id);
  if (existing) clearTimeout(existing);

  const when = new Date(r.whenISO).getTime();
  const delay = when - Date.now();

  if (delay <= 0) return; // past — caller decides whether to fire or drop
  if (delay > MAX_TIMEOUT) return; // too far — will be picked up later by rehydrate

  const t = setTimeout(() => {
    fireNow(r);
    timers.delete(r.id);
    // Remove from queue after firing
    const q = loadQueue().filter((x) => x.id !== r.id);
    saveQueue(q);
  }, delay);
  timers.set(r.id, t);

  // TODO (Capacitor): if (isNative()) {
  //   await LocalNotifications.schedule({
  //     notifications: [{
  //       id: hashToInt(r.id),
  //       title: r.title,
  //       body: r.body,
  //       schedule: { at: new Date(r.whenISO) },
  //     }],
  //   });
  // }
}

export function scheduleRemindersForMarca(
  marcaId: string,
  whenISOs: string[],
  buildContent: (whenISO: string, index: number) => { title: string; body: string },
) {
  // Replace existing scheduled reminders for this marca
  cancelForMarca(marcaId);
  const q = loadQueue();
  const now = Date.now();

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
    q.push(r);
    scheduleOne(r);
  });

  saveQueue(q);
  void isNative; // reserved
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

  // TODO (Capacitor): LocalNotifications.cancel({ notifications: [...] })
}

/** Re-arm timers from the persisted queue. Call on app boot and periodically. */
export function rehydrateReminders() {
  if (typeof window === "undefined") return;
  const now = Date.now();
  const fresh = loadQueue().filter((r) => {
    const when = new Date(r.whenISO).getTime();
    if (Number.isNaN(when)) return false;
    if (when <= now) {
      // Missed reminder — fire once if app is open, then drop
      fireNow(r);
      return false;
    }
    scheduleOne(r); // no-op if > 24h, will be retried next tick
    return true;
  });
  saveQueue(fresh);
}
