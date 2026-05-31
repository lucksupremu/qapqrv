import {
  CalendarClock,
  Navigation,
  ShieldCheck,
  NotebookPen,
  PhoneCall,
  Radio,
  CalendarDays,
  ClipboardCheck,
  Car,
  Hospital,
  Building2,
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
    slug: "consulta-escala",
    name: "Consulta de Escala",
    description: "Consulta DEJEM / Delegada por ID da escala",
    icon: CalendarClock,
    gradient: "from-blue-400 to-indigo-600",
    available: true,
  },
  {
    slug: "minha-localizacao",
    name: "Minha Localização",
    description: "Compartilhe sua localização via GPS",
    icon: Navigation,
    gradient: "from-cyan-400 to-sky-600",
    available: true,
  },
  {
    slug: "bopm-token",
    name: "BOPM Token",
    description: "Gere e gerencie seu token de segurança",
    icon: ShieldCheck,
    gradient: "from-violet-400 to-purple-600",
  },
  {
    slug: "bloco-notas",
    name: "Bloco de Notas",
    description: "Anote rapidamente durante o serviço",
    icon: NotebookPen,
    gradient: "from-fuchsia-400 to-pink-600",
  },
  {
    slug: "telefones-uteis",
    name: "Telefones Úteis",
    description: "Contatos operacionais de emergência",
    icon: PhoneCall,
    gradient: "from-emerald-400 to-green-600",
  },
  {
    slug: "codigos-q",
    name: "Códigos Q",
    description: "Dicionário rápido de códigos Q",
    icon: Radio,
    gradient: "from-amber-400 to-orange-600",
  },
  {
    slug: "escalas",
    name: "Escalas",
    description: "Consulte escalas e plantões",
    icon: CalendarDays,
    gradient: "from-yellow-400 to-amber-600",
  },
  {
    slug: "checklist-operacional",
    name: "Checklist Operacional",
    description: "Confira itens antes do serviço",
    icon: ClipboardCheck,
    gradient: "from-teal-400 to-cyan-600",
  },
  {
    slug: "ctb-rapido",
    name: "CTB Rápido",
    description: "Código de Trânsito ao alcance",
    icon: Car,
    gradient: "from-rose-400 to-red-600",
  },
  {
    slug: "hospitais-proximos",
    name: "Hospitais Próximos",
    description: "Encontre o hospital mais próximo",
    icon: Hospital,
    gradient: "from-pink-400 to-rose-600",
  },
  {
    slug: "delegacias-proximas",
    name: "Delegacias Próximas",
    description: "Localize delegacias na sua área",
    icon: Building2,
    gradient: "from-slate-400 to-slate-600",
  },
];

export function getTool(slug: string): Tool | undefined {
  return tools.find((t) => t.slug === slug);
}
