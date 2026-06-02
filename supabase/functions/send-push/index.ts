// Edge Function: send-push
// Modos:
//  - Default (POST sem body / body vazio): drena scheduled_pushes pendentes (chamada pelo pg_cron).
//  - { mode: "test", deviceId }: envia push imediato pra todas as inscrições de um device.
//
// Requer secrets: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT,
// SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (todos já configurados).

// deno-lint-ignore-file no-explicit-any
import webpush from "npm:web-push@3.6.7";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:admin@miketools.top";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

type Sub = {
  id: string;
  endpoint: string | null;
  p256dh: string | null;
  auth: string | null;
  platform: string;
};

type Payload = {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
};

async function sendToSub(sub: Sub, payload: Payload): Promise<{ ok: boolean; gone?: boolean; error?: string }> {
  if (sub.platform !== "web" || !sub.endpoint || !sub.p256dh || !sub.auth) {
    return { ok: false, error: "subscription incompleta" };
  }
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload),
      { TTL: 60 * 60 * 12 },
    );
    return { ok: true };
  } catch (e: any) {
    const status = e?.statusCode ?? 0;
    return { ok: false, gone: status === 404 || status === 410, error: `${status}: ${e?.message ?? e}` };
  }
}

async function deleteSub(id: string) {
  await supabase.from("push_subscriptions").delete().eq("id", id);
}

async function drainPending(): Promise<{ processed: number; sent: number; failed: number }> {
  const nowIso = new Date().toISOString();
  const { data: pending, error } = await supabase
    .from("scheduled_pushes")
    .select("*")
    .lte("send_at", nowIso)
    .is("sent_at", null)
    .order("send_at", { ascending: true })
    .limit(200);
  if (error) throw error;
  if (!pending || pending.length === 0) return { processed: 0, sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;
  for (const row of pending) {
    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("device_id", row.device_id);

    const payload: Payload = {
      title: row.title,
      body: row.body,
      icon: "/notif-icon-192.png",
      badge: "/notif-badge-72.png",
      ...(row.payload as Record<string, unknown>),
    };

    let anySent = false;
    let lastError: string | undefined;
    for (const s of subs ?? []) {
      const res = await sendToSub(s as Sub, payload);
      if (res.ok) {
        anySent = true;
      } else {
        lastError = res.error;
        if (res.gone) await deleteSub((s as Sub).id);
      }
    }

    if (anySent) {
      sent++;
      await supabase
        .from("scheduled_pushes")
        .update({ sent_at: new Date().toISOString(), attempts: row.attempts + 1 })
        .eq("id", row.id);
    } else {
      failed++;
      const nextAttempts = row.attempts + 1;
      const patch: Record<string, unknown> = {
        attempts: nextAttempts,
        last_error: lastError ?? "sem inscrições",
      };
      // Após 5 tentativas, marca como enviado pra parar de tentar
      if (nextAttempts >= 5) patch.sent_at = new Date().toISOString();
      await supabase.from("scheduled_pushes").update(patch).eq("id", row.id);
    }
  }
  return { processed: pending.length, sent, failed };
}

async function sendTest(deviceId: string) {
  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("*")
    .eq("device_id", deviceId);
  if (error) return { ok: false, error: error.message };
  if (!subs || subs.length === 0) return { ok: false, error: "Nenhuma inscrição encontrada" };

  const payload: Payload = {
    title: "Teste de push remoto",
    body: "Funcionando! Você receberá avisos das escalas mesmo com o app fechado.",
    icon: "/notif-icon-192.png",
    badge: "/notif-badge-72.png",
    url: "/calendario",
    tag: "test-push",
  };

  let sent = 0;
  const errors: string[] = [];
  for (const s of subs) {
    const res = await sendToSub(s as Sub, payload);
    if (res.ok) sent++;
    else {
      errors.push(res.error ?? "erro");
      if (res.gone) await deleteSub((s as Sub).id);
    }
  }
  return { ok: sent > 0, sent, errors };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    let body: any = {};
    try {
      const text = await req.text();
      body = text ? JSON.parse(text) : {};
    } catch { /* body opcional */ }

    if (body?.mode === "test" && typeof body?.deviceId === "string") {
      const result = await sendTest(body.deviceId);
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const result = await drainPending();
    return new Response(JSON.stringify({ ok: true, ...result }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e: any) {
    console.error("[send-push] error", e);
    return new Response(JSON.stringify({ ok: false, error: e?.message ?? String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
