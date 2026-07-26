// Broadcast único: envia push com imagem para todas as subscriptions ativas.
// Protegido por um token simples (BROADCAST_TOKEN) — o cliente admin envia via header.
// Payload aceita { title, body, url, image, tag } e retorna quantos foram enviados.

import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-broadcast-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:noreply@qapqrv.app";
webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

type Sub = { id: string; endpoint: string; p256dh: string; auth: string };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const expected = Deno.env.get("BROADCAST_TOKEN");
    const provided = req.headers.get("x-broadcast-token");
    if (!expected || provided !== expected) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const payload = {
      title: body.title ?? "MIKE TOOLS",
      body: body.body ?? "",
      url: body.url ?? "/",
      image: body.image ?? undefined,
      tag: body.tag ?? `broadcast-${Date.now()}`,
    };

    let sent = 0;
    let gone = 0;
    let failed = 0;
    let from = 0;
    const pageSize = 1000;

    while (true) {
      const { data: subs, error } = await supabase
        .from("push_subscriptions")
        .select("id, endpoint, p256dh, auth")
        .is("unsubscribed_at", null)
        .range(from, from + pageSize - 1);
      if (error) throw error;
      if (!subs || subs.length === 0) break;

      for (const s of subs as Sub[]) {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            JSON.stringify(payload),
            { TTL: 60 * 60 * 24 },
          );
          sent++;
        } catch (e: unknown) {
          const err = e as { statusCode?: number };
          if (err.statusCode === 404 || err.statusCode === 410) {
            gone++;
            await supabase
              .from("push_subscriptions")
              .update({ unsubscribed_at: new Date().toISOString() })
              .eq("id", s.id);
          } else {
            failed++;
          }
        }
      }
      if (subs.length < pageSize) break;
      from += pageSize;
    }

    return new Response(JSON.stringify({ ok: true, sent, gone, failed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
