import type { PlantaoEntry } from "@/lib/escala-trabalho";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toIcsDate(d: Date): string {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
}

function esc(s: string): string {
  return s.replace(/[\\;,]/g, (m) => `\\${m}`).replace(/\n/g, "\\n");
}

/**
 * Gera um arquivo .ics (iCalendar) com todos os plantões passados.
 * Compatível com Google Calendar, Apple Calendar, Outlook.
 */
export function gerarIcs(entries: PlantaoEntry[], nome: string): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//QAP QRV//Escala//PT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${esc(nome)}`,
  ];
  const dtstamp = toIcsDate(new Date());
  entries.forEach((e, i) => {
    const uid = `${e.regra.id}-${e.inicio.getTime()}-${i}@qapqrv`;
    lines.push(
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${toIcsDate(e.inicio)}`,
      `DTEND:${toIcsDate(e.fim)}`,
      `SUMMARY:${esc(e.regra.local)}`,
      "END:VEVENT",
    );
  });
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function baixarIcs(conteudo: string, nomeArquivo: string): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([conteudo], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
