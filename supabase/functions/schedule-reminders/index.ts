// Recebe do cliente a lista de lembretes para um marca_key.
// Substitui (delete + insert) os lembretes existentes daquele device_id + marca_key.
// Se `reminders` vier vazio, apenas cancela.
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const ReminderSchema = z.object({
  when_at: z.string().datetime(),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(500),
  url: z.string().max(500).optional(),
  tag: z.string().max(120).optional(),
});

const BodySchema = z.object({
  device_id: z.string().min(4).max(128),
  marca_key: z.string().min(1).max(200),
  reminders: z.array(ReminderSchema).max(20),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const raw = await req.json();
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { device_id, marca_key, reminders } = parsed.data;

    // Sempre remove antes (cancela quaisquer lembretes anteriores desse marca_key).
    const { error: delErr } = await supabase
      .from("push_reminders")
      .delete()
      .eq("device_id", device_id)
      .eq("marca_key", marca_key);
    if (delErr) throw delErr;

    const now = Date.now();
    const rows = reminders
      .map((r, index) => ({
        device_id,
        marca_key,
        reminder_index: index,
        when_at: r.when_at,
        title: r.title,
        body: r.body,
        url: r.url ?? "/calendario",
        tag: r.tag ?? `reminder-${marca_key}`,
      }))
      .filter((r) => new Date(r.when_at).getTime() > now);

    if (rows.length > 0) {
      const { error: insErr } = await supabase.from("push_reminders").insert(rows);
      if (insErr) throw insErr;
    }

    return new Response(JSON.stringify({ ok: true, scheduled: rows.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[schedule-reminders]", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
