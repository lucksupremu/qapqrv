// Agenda lembretes no servidor (Edge Function schedule-reminders).
// O cron horário `send-push-tick` entrega via Web Push mesmo com o app fechado.
import { supabase } from "@/integrations/supabase/client";
import { getOrCreateDeviceId } from "@/lib/push-client";

export type ServerReminder = {
  when_at: string;
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

export async function scheduleServerReminders(
  marcaKey: string,
  reminders: ServerReminder[],
): Promise<boolean> {
  try {
    const device_id = getOrCreateDeviceId();
    if (!device_id) return false;
    const { error } = await supabase.functions.invoke("schedule-reminders", {
      body: { device_id, marca_key: marcaKey, reminders },
    });
    if (error) {
      console.warn("[server-reminders] invoke error", error);
      return false;
    }
    return true;
  } catch (e) {
    console.warn("[server-reminders] failed", e);
    return false;
  }
}

export function cancelServerReminders(marcaKey: string): Promise<boolean> {
  return scheduleServerReminders(marcaKey, []);
}
