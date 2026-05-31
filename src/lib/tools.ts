import {
  MapPin,
  CalendarClock,
  ShieldCheck,
  ListChecks,
  FileSearch,
  Users,
  CalendarDays,
  FileText,
  BarChart3,
  Settings,
  NotebookPen,
  Navigation,
  type LucideIcon,
} from "lucide-react";

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
    slug: "mapa",
    name: "Mapa",
    description: "Visualize áreas e endereços no mapa interativo",
    icon: MapPin,
    gradient: "from-sky-400 to-blue-600",
  },
  {
    slug: "agenda-ligada",
    name: "ID de Agenda Ligada",
    description: "Gerencie e visualize agendas conectadas",
    icon: CalendarClock,
    gradient: "from-emerald-400 to-green-600",
  },
  {
    slug: "bopm-token",
    name: "BOPM Token",
    description: "Gere e gerencie seu token de segurança",
    icon: ShieldCheck,
    gradient: "from-violet-400 to-purple-600",
  },
  {
    slug: "checklist",
    name: "Checklist",
    description: "Acompanhe suas tarefas e atividades",
    icon: ListChecks,
    gradient: "from-amber-400 to-orange-600",
  },
  {
    slug: "consultas",
    name: "Consultas",
    description: "Realize consultas rápidas e práticas",
    icon: FileSearch,
    gradient: "from-blue-400 to-indigo-600",
  },
  {
    slug: "pessoas",
    name: "Pessoas",
    description: "Informações e contatos",
    icon: Users,
    gradient: "from-teal-400 to-cyan-600",
  },
  {
    slug: "escalas",
    name: "Escalas",
    description: "Consulte escalas e plantões",
    icon: CalendarDays,
    gradient: "from-yellow-400 to-amber-600",
  },
  {
    slug: "documentos",
    name: "Documentos",
    description: "Acesse modelos e documentos úteis",
    icon: FileText,
    gradient: "from-rose-400 to-red-600",
  },
  {
    slug: "relatorios",
    name: "Relatórios",
    description: "Gere e visualize relatórios",
    icon: BarChart3,
    gradient: "from-indigo-400 to-violet-600",
  },
  {
    slug: "bloco-notas",
    name: "Bloco de Notas",
    description: "Anote rapidamente durante o serviço",
    icon: NotebookPen,
    gradient: "from-fuchsia-400 to-pink-600",
  },
  {
    slug: "minha-localizacao",
    name: "Minha Localização",
    description: "Compartilhe sua localização via GPS",
    icon: Navigation,
    gradient: "from-cyan-400 to-sky-600",
  },
  {
    slug: "configuracoes",
    name: "Configurações",
    description: "Personalize sua experiência",
    icon: Settings,
    gradient: "from-slate-400 to-slate-600",
  },
];

export function getTool(slug: string): Tool | undefined {
  return tools.find((t) => t.slug === slug);
}
