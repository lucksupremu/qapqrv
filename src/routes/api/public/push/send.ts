// Endpoint chamado por pg_cron (a cada minuto) para enviar pushes
// programados que chegaram no horário.

import { createFileRoute } from "@tanstack/react-router";

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendWebPush } from "@/lib/push.server";

export const Route = createFileRoute("/api/public/push/send")({
  server: {
    handlers: {
      POST: async () => {
        const nowISO = new Date().toISOString();
        const { data: pending, error } = await supabaseAdmin
          .from("scheduled_pushes")
          .select("*")
          .is("sent_at", null)
          .lte("send_at", nowISO)
          .lt("attempts", 5)
          .order("send_at", { ascending: true })
          .limit(100);

        if (error) {
          return Response.json({ ok: false, error: error.message }, { status: 500 });
        }
        if (!pending || pending.length === 0) {
          return Response.json({ ok: true, processed: 0 });
        }

        let sent = 0;
        let failed = 0;

        for (const row of pending) {
          const { data: subs } = await supabaseAdmin
            .from("push_subscriptions")
            .select("*")
            .eq("device_id", row.device_id);

          if (!subs || subs.length === 0) {
            await supabaseAdmin
              .from("scheduled_pushes")
              .update({ sent_at: nowISO, last_error: "no subscriptions" })
              .eq("id", row.id);
            continue;
          }

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const payloadExtra = (row.payload as any) || {};
          const payload = {
            title: row.title,
            body: row.body,
            icon: "/notif-icon-192.png",
            badge: "/notif-badge-72.png",
            url: payloadExtra.url || "/calendario",
            tag: row.marca_id || row.id,
          };

          let anyOk = false;
          const errors: string[] = [];
          for (const sub of subs) {
            if (sub.platform !== "web" || !sub.endpoint || !sub.p256dh || !sub.auth) continue;
            const res = await sendWebPush(
              { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
              payload,
            );
            if (res.ok) {
              anyOk = true;
            } else {
              errors.push(`${res.status}: ${res.error}`);
              if (res.status === 404 || res.status === 410) {
                await supabaseAdmin.from("push_subscriptions").delete().eq("id", sub.id);
              }
            }
          }

          if (anyOk) {
            await supabaseAdmin
              .from("scheduled_pushes")
              .update({ sent_at: nowISO, attempts: row.attempts + 1 })
              .eq("id", row.id);
            sent += 1;
          } else {
            await supabaseAdmin
              .from("scheduled_pushes")
              .update({
                attempts: row.attempts + 1,
                last_error: errors.join(" | ").slice(0, 1000),
              })
              .eq("id", row.id);
            failed += 1;
          }
        }

        return Response.json({ ok: true, processed: pending.length, sent, failed });
      },
    },
  },
});
