import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  ShieldCheck,
  Landmark,
  CalendarClock,
  Wifi,
  Wallet,
  ClipboardList,
  HelpCircle,
  Sparkles,
} from "lucide-react";

const CARDS = [
  { to: "/conteudos/dejem/guia-dejem-completo", title: "Como funciona a DEJEM", icon: ShieldCheck },
  { to: "/conteudos/delegada/diferenca-dejem-delegada-2026", title: "Como funciona a Delegada", icon: Landmark },
  { to: "/conteudos/escalas/planejamento-plantao", title: "Como organizar escalas", icon: CalendarClock },
  { to: "/conteudos/seguranca-digital/seguranca-anyconnect", title: "Como utilizar a VPN", icon: Wifi },
  { to: "/conteudos/procedimentos/boas-praticas-intranet-pmesp", title: "Boas práticas na intranet", icon: ClipboardList },
  { to: "/conteudos/ferramentas/calendario-operacional-guia", title: "Guia do calendário", icon: BookOpen },
  { to: "/conteudos/produtividade/produtividade-policial", title: "Produtividade em plantão", icon: Sparkles },
  { to: "/faq", title: "Perguntas frequentes", icon: HelpCircle },
] as const;

export function CentralConteudoSection() {
  return (
    <section className="px-5 pt-10" aria-labelledby="central-conteudo-heading">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 id="central-conteudo-heading" className="text-[15px] font-bold text-foreground">
          Central de Conteúdo
        </h2>
        <Link to="/conteudos" className="text-xs font-medium text-primary hover:underline">
          Ver tudo
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {CARDS.map(({ to, title, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="group flex flex-col gap-2 rounded-xl border border-border bg-card p-3 transition hover:border-primary/60 hover:shadow-sm"
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Icon size={16} className="text-white" />
            </span>
            <span className="text-[12.5px] font-semibold leading-snug text-foreground">
              {title}
            </span>
          </Link>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground">
        Guias curtos, escritos por policiais para policiais. Atualizamos com frequência.
      </p>
    </section>
  );
}
