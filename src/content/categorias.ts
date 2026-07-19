import type { Categoria } from "./tipos";

export const CATEGORIAS: Categoria[] = [
  { slug: "dejem", title: "DEJEM", description: "Detalhe de Jornada Extra Militar — regras, inscrição, cuidados.", icon: "ShieldCheck" },
  { slug: "delegada", title: "Delegada", description: "Operação Delegada — como funciona, quem paga, como se organizar.", icon: "Landmark" },
  { slug: "escalas", title: "Escalas", description: "Modelos de escala, 12x24, 12x48, planejamento e descanso.", icon: "CalendarClock" },
  { slug: "procedimentos", title: "Procedimentos", description: "Rotinas administrativas, apresentação, comunicação e etiqueta.", icon: "ClipboardList" },
  { slug: "produtividade", title: "Produtividade", description: "Rotinas para o dia a dia do policial: agenda, foco, descanso.", icon: "Sparkles" },
  { slug: "ferramentas", title: "Ferramentas", description: "Guias das ferramentas do QAP, QRV! e integrações úteis.", icon: "Wrench" },
  { slug: "tecnologia", title: "Tecnologia", description: "Aplicativos, PWA, offline, notificações e boas práticas.", icon: "Cpu" },
  { slug: "pmesp", title: "PMESP", description: "Instituição, unidades, canais oficiais e informações públicas.", icon: "Shield" },
  { slug: "seguranca-digital", title: "Segurança Digital", description: "VPN, senhas, phishing, proteção de dados pessoais.", icon: "Lock" },
];

export function getCategoria(slug: string) {
  return CATEGORIAS.find((c) => c.slug === slug);
}
