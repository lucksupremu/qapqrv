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
  { categoria: "dejem", slug: "guia-dejem-completo", title: "Como funciona a DEJEM", icon: ShieldCheck },
  { categoria: "delegada", slug: "diferenca-dejem-delegada-2026", title: "Como funciona a Delegada", icon: Landmark },
  { categoria: "escalas", slug: "planejamento-plantao", title: "Como organizar escalas", icon: CalendarClock },
  { categoria: "seguranca-digital", slug: "seguranca-anyconnect", title: "Como utilizar a VPN", icon: Wifi },
  { categoria: "procedimentos", slug: "boas-praticas-intranet-pmesp", title: "Boas práticas na intranet", icon: ClipboardList },
  { categoria: "ferramentas", slug: "calendario-operacional-guia", title: "Guia do calendário", icon: BookOpen },
  { categoria: "produtividade", slug: "produtividade-policial", title: "Produtividade em plantão", icon: Sparkles },
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
        {CARDS.map(({ categoria, slug, title, icon: Icon }) => (
          <Link
            key={slug}
            to="/conteudos/$categoria/$slug"
            params={{ categoria, slug }}
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
        <Link
          to="/faq"
          className="group flex flex-col gap-2 rounded-xl border border-border bg-card p-3 transition hover:border-primary/60 hover:shadow-sm"
        >
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: "var(--gradient-primary)" }}
          >
            <HelpCircle size={16} className="text-white" />
          </span>
          <span className="text-[12.5px] font-semibold leading-snug text-foreground">
            Perguntas frequentes
          </span>
        </Link>
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground">
        Guias curtos, escritos por policiais para policiais. Atualizamos com frequência.
      </p>
    </section>
  );
}
