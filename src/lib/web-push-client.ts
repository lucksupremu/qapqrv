// Client helper for Web Push (Service Worker + VAPID subscribe)
// Funciona apenas no browser (não nativo). Não registra SW em iframe/preview.

import { supabase } from "@/integrations/supabase/client";
import { getDeviceId } from "./device-id";
import { VAPID_PUBLIC_KEY } from "./push-config";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const arr = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; i++) arr[i] = rawData.charCodeAt(i);
  return arr;
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

export async function isWebPushSupported(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;
  if (!("Notification" in window)) return false;
  return true;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!(await isWebPushSupported())) return null;
  if (isPreviewOrIframe()) return null; // não registra no preview Lovable
  try {
    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    await navigator.serviceWorker.ready;
    return reg;
  } catch (e) {
    console.error("[web-push] SW register failed", e);
    return null;
  }
}

export async function subscribeWebPush(): Promise<{ ok: boolean; reason?: string }> {
  if (!(await isWebPushSupported())) return { ok: false, reason: "Não suportado neste navegador" };

  const perm = await Notification.requestPermission();
  if (perm !== "granted") return { ok: false, reason: "Permissão negada" };

  const reg = await registerServiceWorker();
  if (!reg) return { ok: false, reason: "Service Worker indisponível neste ambiente" };

  try {
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }
    const json = sub.toJSON();
    const deviceId = getDeviceId();
    const deviceUA = navigator.userAgent;
    // Tenta atualizar a inscrição existente; se não houver, insere.
    const { data: updated, error: updErr } = await supabase
      .from("push_subscriptions")
      .update({
        endpoint: json.endpoint,
        p256dh: json.keys?.p256dh ?? null,
        auth: json.keys?.auth ?? null,
        user_agent: deviceUA,
        updated_at: new Date().toISOString(),
      })
      .eq("device_id", deviceId)
      .eq("platform", "web");
    let error = updErr;
    if (!error && (updated == null || (Array.isArray(updated) && updated.length === 0))) {
      const { error: insErr } = await supabase.from("push_subscriptions").insert({
        device_id: deviceId,
        platform: "web",
        endpoint: json.endpoint,
        p256dh: json.keys?.p256dh ?? null,
        auth: json.keys?.auth ?? null,
        user_agent: deviceUA,
      });
      // Conflito de unicidade significa que já existe (e o UPDATE acima já atualizou em outra corrida) → ok
      if (insErr && !/duplicate key|unique/i.test(insErr.message)) error = insErr;
    }
    if (error) {
      console.error("[web-push] upsert failed", error);
      return { ok: false, reason: error.message };
    }
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[web-push] subscribe failed", e);
    return { ok: false, reason: msg };
  }
}

export async function unsubscribeWebPush(): Promise<void> {
  if (!(await isWebPushSupported())) return;
  try {
    const reg = await navigator.serviceWorker.getRegistration("/");
    const sub = await reg?.pushManager.getSubscription();
    if (sub) await sub.unsubscribe();
    const deviceId = getDeviceId();
    await supabase.from("push_subscriptions").delete().eq("device_id", deviceId).eq("platform", "web");
  } catch (e) {
    console.error("[web-push] unsubscribe failed", e);
  }
}

export async function isSubscribedWebPush(): Promise<boolean> {
  if (!(await isWebPushSupported())) return false;
  try {
    const reg = await navigator.serviceWorker.getRegistration("/");
    const sub = await reg?.pushManager.getSubscription();
    return !!sub;
  } catch {
    return false;
  }
}
