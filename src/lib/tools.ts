import { CalendarClock, type LucideIcon } from "lucide-react";

export type Tool = {
  slug: string;
  name: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  available?: boolean;
};

export const tools: Tool[] = [
  {
    slug: "consulta-escala",
    name: "Consulta de Escala",
    description: "Consulta DEJEM / Delegada por ID da escala",
    icon: CalendarClock,
    gradient: "from-blue-400 to-indigo-600",
    available: true,
  },
];

export function getTool(slug: string): Tool | undefined {
  return tools.find((t) => t.slug === slug);
}
