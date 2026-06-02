// Stub server-only. Este projeto é SPA estático (Capacitor APK) — sem servidor Node.
// Para push remoto real, mover esta lógica para uma Supabase Edge Function.
// Mantido apenas para satisfazer imports legados; nunca deve rodar no client.

export type WebPushSubscription = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export type WebPushPayload = {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
};

export async function sendWebPush(
  _sub: WebPushSubscription,
  _payload: WebPushPayload,
): Promise<{ ok: false; status: number; error: string }> {
  return {
    ok: false,
    status: 501,
    error: "Envio remoto não implementado neste build (SPA estático).",
  };
}
