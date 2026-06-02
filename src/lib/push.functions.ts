// Helpers client-side para o sistema de push.
// Este projeto é SPA estático — não há servidor Node próprio.
// Agendamento: insert direto na tabela `scheduled_pushes` (RLS permite anon).
// Envio: Edge Function `send-push` (modo cron + modo teste).

import { supabase } from "@/integrations/supabase/client";

type Reminder = { title: string; body: string; sendAt: string };

export async function schedulePushesForMarca(args: {
  deviceId: string;
  marcaId: string;
  reminders: Reminder[];
}): Promise<{ ok: boolean; inserted?: number; error?: string }> {
  // Limpa pendentes antigos da mesma marca
  await supabase
    .from("scheduled_pushes")
    .delete()
    .eq("device_id", args.deviceId)
    .eq("marca_id", args.marcaId)
    .is("sent_at", null);

  if (args.reminders.length === 0) return { ok: true, inserted: 0 };

  const rows = args.reminders.map((r) => ({
    device_id: args.deviceId,
    marca_id: args.marcaId,
    title: r.title,
    body: r.body,
    send_at: new Date(r.sendAt).toISOString(),
    payload: { url: "/calendario" },
  }));

  const { error } = await supabase.from("scheduled_pushes").insert(rows);
  if (error) return { ok: false, error: error.message };
  return { ok: true, inserted: rows.length };
}

export async function cancelScheduledPushesForMarca(args: {
  deviceId: string;
  marcaId: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from("scheduled_pushes")
    .delete()
    .eq("device_id", args.deviceId)
    .eq("marca_id", args.marcaId)
    .is("sent_at", null);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function sendTestPush(args: {
  deviceId: string;
}): Promise<{ ok: boolean; sent?: number; error?: string; errors?: string[] }> {
  const { data, error } = await supabase.functions.invoke("send-push", {
    body: { mode: "test", deviceId: args.deviceId },
  });
  if (error) return { ok: false, error: error.message };
  return data ?? { ok: false, error: "Sem resposta" };
}
