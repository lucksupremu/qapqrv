import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

type Body = {
  device_id: string;
  heartbeat?: boolean;
  subscription?: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  };
  user_agent?: string;
  locale?: string;
  tz?: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // GET: devolve a chave VAPID pública pra o cliente assinar o pushManager.
  if (req.method === "GET") {
    return new Response(
      JSON.stringify({ vapidPublicKey: Deno.env.get("VAPID_PUBLIC_KEY") ?? "" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }


  try {
    const body = (await req.json()) as Body;
    if (!body?.device_id || typeof body.device_id !== "string") {
      return new Response(JSON.stringify({ error: "device_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date().toISOString();

    // Heartbeat only — atualiza last_seen e reseta estágio
    if (body.heartbeat || !body.subscription) {
      const { error } = await supabase
        .from("push_subscriptions")
        .update({
          last_seen_at: now,
          inactivity_stage: 0,
          unsubscribed_at: null,
        })
        .eq("device_id", body.device_id);
      if (error) console.warn("[register-push] heartbeat error", error.message);
      return new Response(JSON.stringify({ ok: true, mode: "heartbeat" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sub = body.subscription;
    if (!sub.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
      return new Response(JSON.stringify({ error: "invalid subscription" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const row = {
      device_id: body.device_id,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      user_agent: body.user_agent ?? null,
      locale: body.locale ?? null,
      tz: body.tz ?? null,
      last_seen_at: now,
      inactivity_stage: 0,
      unsubscribed_at: null,
    };

    const { error } = await supabase
      .from("push_subscriptions")
      .upsert(row, { onConflict: "device_id" });

    if (error) {
      console.error("[register-push] upsert error", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, mode: "subscribe" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[register-push] fatal", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
