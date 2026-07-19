import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, HelpCircle } from "lucide-react";
import type { FerramentaInfo } from "@/content/ferramentas-info";

export function ComoFuncionaBox({ info }: { info: FerramentaInfo }) {
  return (
    <Collapsible className="rounded-2xl border border-border bg-card/60">
      <CollapsibleTrigger className="group flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <HelpCircle size={16} className="text-primary" />
          Como funciona
        </span>
        <ChevronDown
          size={16}
          className="text-muted-foreground transition-transform group-data-[state=open]:rotate-180"
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 border-t border-border/60 px-4 py-4 text-[13.5px] leading-relaxed text-foreground/85">
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">O que é</p>
          <p>{info.oQueE}</p>
        </div>
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Quando usar</p>
          <p>{info.quandoUsar}</p>
        </div>
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Benefícios</p>
          <ul className="list-disc space-y-0.5 pl-5">
            {info.beneficios.map((b) => <li key={b}>{b}</li>)}
          </ul>
        </div>
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Boas práticas</p>
          <ul className="list-disc space-y-0.5 pl-5">
            {info.boasPraticas.map((b) => <li key={b}>{b}</li>)}
          </ul>
        </div>
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Erros comuns</p>
          <ul className="list-disc space-y-0.5 pl-5">
            {info.errosComuns.map((b) => <li key={b}>{b}</li>)}
          </ul>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
