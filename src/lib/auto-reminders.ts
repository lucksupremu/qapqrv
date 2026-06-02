// Regras de lembretes automáticos para uma escala (dejem/delegada).
// Gera 2 avisos por padrão: 1 dia antes às 09:00 e 2 horas antes do início.

export function buildAutoReminders(dataISO: string): string[] {
  const start = new Date(dataISO);
  if (Number.isNaN(start.getTime())) return [];
  const reminders: Date[] = [];

  // 1 dia antes às 09:00 (local)
  const dayBefore = new Date(start);
  dayBefore.setDate(dayBefore.getDate() - 1);
  dayBefore.setHours(9, 0, 0, 0);
  reminders.push(dayBefore);

  // 2 horas antes do início
  const twoHoursBefore = new Date(start.getTime() - 2 * 60 * 60 * 1000);
  reminders.push(twoHoursBefore);

  const now = Date.now();
  return reminders
    .filter((d) => d.getTime() > now)
    .map((d) => d.toISOString());
}

export function isoToLocalInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
