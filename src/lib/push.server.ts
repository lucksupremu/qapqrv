// Helpers server-only para envio de Web Push via web-push (VAPID).
// NUNCA importar este arquivo no client.

import webpush from "web-push";

let configured = false;
function ensureConfigured() {
  if (configured) return;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@miketools.top";
  if (!pub || !priv) {
    throw new Error("VAPID keys ausentes nas variáveis de ambiente do servidor");
  }
  webpush.setVapidDetails(subject, pub, priv);
  configured = true;
}

export type WebPushTarget = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export type PushPayload = {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
};

export async function sendWebPush(
  target: WebPushTarget,
  payload: PushPayload,
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  ensureConfigured();
  try {
    await webpush.sendNotification(
      {
        endpoint: target.endpoint,
        keys: { p256dh: target.p256dh, auth: target.auth },
      },
      JSON.stringify(payload),
      { TTL: 60 * 60 },
    );
    return { ok: true };
  } catch (e) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err = e as any;
    return {
      ok: false,
      status: err?.statusCode ?? 0,
      error: err?.body || err?.message || String(e),
    };
  }
}
