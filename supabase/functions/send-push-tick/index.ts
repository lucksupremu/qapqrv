// Tick a cada hora — chamado pelo cron.
// 1) Dispara reengajamento para usuários inativos (3d, 14d, 30d).
// 2) Envia campanhas regulares conforme o schedule_cron de cada uma.

import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";
import cronParser from "npm:cron-parser@4.9.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

type Sub = {
  id: string;
  device_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  last_seen_at: string;
  last_notified_at: string | null;
  inactivity_stage: number;
};

async function sendOne(
  sub: Sub,
  payload: { title: string; body: string; url?: string; tag?: string },
): Promise<{ ok: boolean; gone: boolean; error?: string }> {
  try {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      },
      JSON.stringify(payload),
      { TTL: 60 * 60 * 24 },
    );
    return { ok: true, gone: false };
  } catch (e: unknown) {
    const err = e as { statusCode?: number; body?: string; message?: string };
    const gone = err.statusCode === 404 || err.statusCode === 410;
    return { ok: false, gone, error: err.message ?? String(e) };
  }
}

async function runInactivity() {
  const now = Date.now();
  const stages = [
    { stage: 3, days: 30, title: "Faz tempo!", body: "Quer voltar a acompanhar suas escalas no QAP, QRV!?" },
    { stage: 2, days: 14, title: "Sentimos sua falta", body: "Tem novidade no QAP, QRV! Bora dar uma olhada." },
    { stage: 1, days: 3,  title: "Já conferiu sua escala hoje?", body: "Abra o app e veja seus próximos turnos." },
  ];

  let sent = 0;
  for (const s of stages) {
    const cutoff = new Date(now - s.days * 86400000).toISOString();
    const { data: subs, error } = await supabase
      .from("push_subscriptions")
      .select("id, device_id, endpoint, p256dh, auth, last_seen_at, last_notified_at, inactivity_stage")
      .is("unsubscribed_at", null)
      .lt("inactivity_stage", s.stage)
      .lt("last_seen_at", cutoff)
      .or(`last_notified_at.is.null,last_notified_at.lt.${new Date(now - 3 * 86400000).toISOString()}`)
      .limit(500);
    if (error) {
      console.error("[tick] inactivity query", s.stage, error);
      continue;
    }
    for (const sub of subs ?? []) {
      const res = await sendOne(sub as Sub, {
        title: s.title,
        body: s.body,
        url: "/",
        tag: `inactivity-${s.stage}`,
      });
      if (res.gone) {
        await supabase
          .from("push_subscriptions")
          .update({ unsubscribed_at: new Date().toISOString() })
          .eq("id", (sub as Sub).id);
      } else if (res.ok) {
        sent++;
        await supabase
          .from("push_subscriptions")
          .update({
            last_notified_at: new Date().toISOString(),
            inactivity_stage: s.stage,
          })
          .eq("id", (sub as Sub).id);
      }
    }
  }
  return sent;
}

async function runCampaigns() {
  const { data: campaigns, error } = await supabase
    .from("push_campaigns")
    .select("*")
    .eq("active", true);
  if (error) {
    console.error("[tick] campaigns query", error);
    return 0;
  }

  let sent = 0;
  const now = new Date();

  for (const c of campaigns ?? []) {
    let dueAt: Date | null = null;
    try {
      const it = cronParser.parseExpression(c.schedule_cron, {
        currentDate: now,
        tz: "UTC",
      });
      const prev = it.prev().toDate();
      // Janela: só dispara se a execução anterior do cron foi nas últimas 65 min
      if (now.getTime() - prev.getTime() <= 65 * 60 * 1000) {
        dueAt = prev;
      }
    } catch (e) {
      console.error("[tick] cron parse", c.slug, e);
      continue;
    }
    if (!dueAt) continue;

    if (c.last_run_at && new Date(c.last_run_at).getTime() >= dueAt.getTime()) continue;

    const { data: subs, error: e2 } = await supabase
      .from("push_subscriptions")
      .select("id, device_id, endpoint, p256dh, auth, last_seen_at, last_notified_at, inactivity_stage")
      .is("unsubscribed_at", null)
      .limit(2000);
    if (e2) {
      console.error("[tick] subs query", e2);
      continue;
    }

    const bucket = dueAt.toISOString();
    for (const sub of subs ?? []) {
      // dedupe: já enviou nessa janela?
      const { data: existing } = await supabase
        .from("push_campaign_sends")
        .select("id")
        .eq("campaign_id", c.id)
        .eq("device_id", (sub as Sub).device_id)
        .eq("run_bucket", bucket)
        .maybeSingle();
      if (existing) continue;

      const res = await sendOne(sub as Sub, {
        title: c.title,
        body: c.body,
        url: c.url ?? "/",
        tag: `campaign-${c.slug}`,
      });

      await supabase.from("push_campaign_sends").insert({
        campaign_id: c.id,
        device_id: (sub as Sub).device_id,
        run_bucket: bucket,
        success: res.ok,
        error: res.error ?? null,
      });

      if (res.gone) {
        await supabase
          .from("push_subscriptions")
          .update({ unsubscribed_at: new Date().toISOString() })
          .eq("id", (sub as Sub).id);
      } else if (res.ok) {
        sent++;
      }
    }

    await supabase
      .from("push_campaigns")
      .update({ last_run_at: new Date().toISOString() })
      .eq("id", c.id);
  }
  return sent;
}

async function runInstallNudge() {
  const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("id, device_id, endpoint, p256dh, auth, last_seen_at, last_notified_at, inactivity_stage")
    .eq("wants_install_push", true)
    .is("install_push_sent_at", null)
    .is("unsubscribed_at", null)
    .eq("platform", "web")
    .lt("created_at", cutoff)
    .limit(500);
  if (error) {
    console.error("[tick] install nudge query", error);
    return 0;
  }
  let sent = 0;
  for (const sub of subs ?? []) {
    const res = await sendOne(sub as Sub, {
      title: "Instale o QAP, QRV! na tela inicial",
      body: "Acesso rápido, sem abrir o navegador. Toque para instalar.",
      url: "/?install=1",
      tag: "install-nudge",
    });
    if (res.gone) {
      await supabase
        .from("push_subscriptions")
        .update({ unsubscribed_at: new Date().toISOString() })
        .eq("id", (sub as Sub).id);
    } else if (res.ok) {
      sent++;
      await supabase
        .from("push_subscriptions")
        .update({ install_push_sent_at: new Date().toISOString() })
        .eq("id", (sub as Sub).id);
    }
  }
  return sent;
}

const BURST_WINDOW_MIN = 30;
const BURST_THRESHOLD = 3;
const BURST_RECENT_MARK_DAYS = 3;
const AUDIENCE_WINDOW_DAYS = 30;

async function runBurstAlerts() {
  const now = Date.now();
  const windowStart = new Date(now - BURST_WINDOW_MIN * 60_000).toISOString();
  const recentMarkCutoff = new Date(now - BURST_RECENT_MARK_DAYS * 86_400_000).toISOString();
  const audienceCutoff = new Date(now - AUDIENCE_WINDOW_DAYS * 86_400_000).toISOString();
  const today = new Date().toISOString().slice(0, 10);

  let totalSent = 0;

  for (const tipo of ["dejem", "delegada"] as const) {
    // 1) Conta dispositivos distintos com marca desse tipo na janela.
    const { data: recent, error: eRecent } = await supabase
      .from("marca_events")
      .select("device_id")
      .eq("tipo", tipo)
      .gte("created_at", windowStart);
    if (eRecent) {
      console.error("[burst] recent query", tipo, eRecent);
      continue;
    }
    const distinctDevices = new Set((recent ?? []).map((r) => r.device_id));
    if (distinctDevices.size < BURST_THRESHOLD) continue;

    // 2) Público-alvo: quem marcou nos últimos 30d (qualquer tipo).
    const { data: audience, error: eAud } = await supabase
      .from("marca_events")
      .select("device_id")
      .gte("created_at", audienceCutoff);
    if (eAud) {
      console.error("[burst] audience query", tipo, eAud);
      continue;
    }
    const audienceSet = new Set((audience ?? []).map((r) => r.device_id));
    if (audienceSet.size === 0) continue;

    // 3) Exclui quem marcou o MESMO tipo nos últimos 3d.
    const { data: recentMarks, error: eRM } = await supabase
      .from("marca_events")
      .select("device_id")
      .eq("tipo", tipo)
      .gte("created_at", recentMarkCutoff);
    if (eRM) {
      console.error("[burst] recent marks query", tipo, eRM);
      continue;
    }
    for (const r of recentMarks ?? []) audienceSet.delete(r.device_id);

    // 4) Exclui quem já recebeu alerta desse tipo hoje.
    const { data: sentToday, error: eST } = await supabase
      .from("push_burst_sends")
      .select("device_id")
      .eq("tipo", tipo)
      .eq("sent_on", today);
    if (eST) {
      console.error("[burst] sent today query", tipo, eST);
      continue;
    }
    for (const r of sentToday ?? []) audienceSet.delete(r.device_id);

    if (audienceSet.size === 0) continue;

    // 5) Carrega subscriptions elegíveis.
    const deviceIds = Array.from(audienceSet);
    const { data: subs, error: eSubs } = await supabase
      .from("push_subscriptions")
      .select("id, device_id, endpoint, p256dh, auth, last_seen_at, last_notified_at, inactivity_stage")
      .is("unsubscribed_at", null)
      .in("device_id", deviceIds)
      .limit(2000);
    if (eSubs) {
      console.error("[burst] subs query", tipo, eSubs);
      continue;
    }

    const tipoLabel = tipo === "dejem" ? "Dejem" : "Delegada";
    for (const sub of subs ?? []) {
      const res = await sendOne(sub as Sub, {
        title: "Escalas abrindo agora?",
        body: `Outros policiais estão marcando ${tipoLabel}. Já conferiu se há escalas abertas para inscrição?`,
        url: "/calendario",
        tag: `burst-${tipo}`,
      });
      if (res.gone) {
        await supabase
          .from("push_subscriptions")
          .update({ unsubscribed_at: new Date().toISOString() })
          .eq("id", (sub as Sub).id);
      } else if (res.ok) {
        totalSent++;
        await supabase.from("push_burst_sends").upsert(
          { device_id: (sub as Sub).device_id, tipo, sent_on: today },
          { onConflict: "device_id,tipo,sent_on" },
        );
      }
    }
  }

  return totalSent;
}

async function cleanupOldMarcaEvents() {
  const cutoff = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const { error } = await supabase.from("marca_events").delete().lt("created_at", cutoff);
  if (error) console.error("[cleanup] marca_events", error);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const burst = await runBurstAlerts();
    const inactivity = await runInactivity();
    const campaigns = await runCampaigns();
    const installNudge = await runInstallNudge();
    await cleanupOldMarcaEvents();
    return new Response(
      JSON.stringify({
        ok: true,
        burst_sent: burst,
        inactivity_sent: inactivity,
        campaign_sent: campaigns,
        install_nudge_sent: installNudge,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[send-push-tick] fatal", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
