// Server functions de push (subscribe/agendamento/teste).
// IMPORTANTE: `supabaseAdmin` e `web-push` são SOMENTE server.
// Importamos dinamicamente DENTRO dos handlers para não vazar pro bundle client.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ReminderInput = z.object({
  deviceId: z.string().min(8).max(128),
  marcaId: z.string().min(1).max(128),
  reminders: z
    .array(
      z.object({
        title: z.string().min(1).max(140),
        body: z.string().min(1).max(500),
        sendAt: z.string(), // ISO
      }),
    )
    .max(20),
});

/**
 * Espelha os lembretes locais no servidor (redundância — push remoto programado).
 * Apaga agendamentos antigos da mesma marca antes de inserir os novos.
 */
export const schedulePushesForMarca = createServerFn({ method: "POST" })
  .inputValidator((input) => ReminderInput.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("scheduled_pushes")
      .delete()
      .eq("device_id", data.deviceId)
      .eq("marca_id", data.marcaId)
      .is("sent_at", null);

    if (data.reminders.length === 0) return { ok: true, inserted: 0 };

    const rows = data.reminders.map((r) => ({
      device_id: data.deviceId,
      marca_id: data.marcaId,
      title: r.title,
      body: r.body,
      send_at: new Date(r.sendAt).toISOString(),
      payload: { url: "/calendario" },
    }));

    const { error } = await supabaseAdmin.from("scheduled_pushes").insert(rows);
    if (error) {
      console.error("[push] schedule insert failed", error);
      return { ok: false, error: error.message };
    }
    return { ok: true, inserted: rows.length };
  });

/** Cancela agendamentos pendentes de uma marca (ex.: marca excluída). */
export const cancelScheduledPushesForMarca = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({ deviceId: z.string().min(8).max(128), marcaId: z.string().min(1).max(128) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("scheduled_pushes")
      .delete()
      .eq("device_id", data.deviceId)
      .eq("marca_id", data.marcaId)
      .is("sent_at", null);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  });

/** Envia push de teste imediato para todas as inscrições de um device. */
export const sendTestPush = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ deviceId: z.string().min(8).max(128) }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { sendWebPush } = await import("./push.server");

    const { data: subs, error } = await supabaseAdmin
      .from("push_subscriptions")
      .select("*")
      .eq("device_id", data.deviceId);
    if (error) return { ok: false, error: error.message };
    if (!subs || subs.length === 0) {
      return { ok: false, error: "Nenhuma inscrição encontrada para este dispositivo" };
    }

    const payload = {
      title: "Teste de push remoto",
      body: "Funcionando! Você receberá avisos das escalas mesmo com o app fechado.",
      icon: "/notif-icon-192.png",
      badge: "/notif-badge-72.png",
      url: "/calendario",
      tag: "test-push",
    };

    let sent = 0;
    const errors: string[] = [];
    for (const sub of subs) {
      if (sub.platform !== "web" || !sub.endpoint || !sub.p256dh || !sub.auth) continue;
      const res = await sendWebPush(
        { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
        payload,
      );
      if (res.ok) {
        sent += 1;
      } else {
        errors.push(`${res.status}: ${res.error}`);
        if (res.status === 404 || res.status === 410) {
          await supabaseAdmin.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
    }
    return { ok: sent > 0, sent, errors };
  });
