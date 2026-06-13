// Cliente de push remoto (Web Push).
// - Gera/lê device_id estável no localStorage.
// - Pede permissão, inscreve no pushManager e envia a subscription pro backend.
// - Heartbeat: atualiza last_seen no backend a cada abertura (no máx. 1x/h).

import { supabase } from "@/integrations/supabase/client";
import { ensureServiceWorker } from "@/lib/notifications-adapter";
import { isNativeApp } from "@/lib/in-app-browser";

const DEVICE_ID_KEY = "qapqrv_device_id";
const HEARTBEAT_KEY = "qapqrv_push_heartbeat_at";
const HEARTBEAT_INTERVAL = 60 * 60 * 1000; // 1h

function getDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return "anon-" + Math.random().toString(36).slice(2);
  }
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

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function getVapidPublicKey(): Promise<string | null> {
  const cached = sessionStorage.getItem("vapid_pub");
  if (cached) return cached;
  try {
    const { data, error } = await supabase.functions.invoke("register-push", {
      method: "GET",
    });
    if (error) throw error;
    const key = (data as { vapidPublicKey?: string })?.vapidPublicKey;
    if (key) {
      sessionStorage.setItem("vapid_pub", key);
      return key;
    }
  } catch (e) {
    console.warn("[push] vapid key fetch failed", e);
  }
  return null;
}

/** Inscreve no Web Push e envia ao backend. Retorna true se conseguiu. */
export async function subscribeToPush(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (isNativeApp() || isPreviewOrIframe()) return false;
  if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    return false;
  }

  if (Notification.permission === "default") {
    const p = await Notification.requestPermission();
    if (p !== "granted") return false;
  } else if (Notification.permission !== "granted") {
    return false;
  }

  const reg = await ensureServiceWorker();
  if (!reg) return false;

  const vapidKey = await getVapidPublicKey();
  if (!vapidKey) return false;

  let sub: PushSubscription | null = null;
  try {
    sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey).buffer as ArrayBuffer,
      });
    }
  } catch (e) {
    console.error("[push] subscribe failed", e);
    return false;
  }

  const json = sub.toJSON() as {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  };
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return false;

  try {
    await supabase.functions.invoke("register-push", {
      method: "POST",
      body: {
        device_id: getDeviceId(),
        subscription: {
          endpoint: json.endpoint,
          keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
        },
        user_agent: navigator.userAgent,
        locale: navigator.language,
        tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    });
    return true;
  } catch (e) {
    console.error("[push] register backend failed", e);
    return false;
  }
}

export async function unsubscribeFromPush(): Promise<void> {
  try {
    await supabase.functions.invoke("unsubscribe-push", {
      method: "POST",
      body: { device_id: getDeviceId() },
    });
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.getRegistration("/");
      const sub = await reg?.pushManager.getSubscription();
      await sub?.unsubscribe();
    }
  } catch (e) {
    console.warn("[push] unsubscribe failed", e);
  }
}

/** Heartbeat — chama o backend pra dizer "tô vivo". Limitado a 1x/h. */
export async function sendHeartbeat(): Promise<void> {
  if (typeof window === "undefined") return;
  if (isNativeApp() || isPreviewOrIframe()) return;
  try {
    const last = Number(localStorage.getItem(HEARTBEAT_KEY) ?? "0");
    if (Date.now() - last < HEARTBEAT_INTERVAL) return;
    localStorage.setItem(HEARTBEAT_KEY, String(Date.now()));
    await supabase.functions.invoke("register-push", {
      method: "POST",
      body: { device_id: getDeviceId(), heartbeat: true },
    });
  } catch {
    /* ignore */
  }
}

export async function isPushSubscribed(): Promise<boolean> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return false;
  try {
    const reg = await navigator.serviceWorker.getRegistration("/");
    const sub = await reg?.pushManager.getSubscription();
    return !!sub;
  } catch {
    return false;
  }
}
