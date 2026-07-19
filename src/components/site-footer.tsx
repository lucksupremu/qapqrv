import { Link } from "@tanstack/react-router";
import * as React from "react";
import { ChevronDown } from "lucide-react";

export function SiteFooter() {
  const year = new Date().getFullYear();
  const [expanded, setExpanded] = React.useState(false);
  const id = React.useId();
  const contentId = `${id}-footer-about`;

  return (
    <footer className="mt-12 border-t border-border/60 bg-muted/30 px-5 py-6 text-sm text-muted-foreground">
      <div className="mx-auto max-w-3xl">
        <p className="text-base font-bold text-foreground">QAP, QRV!</p>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-controls={contentId}
          className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-foreground/80 hover:text-foreground transition-colors"
        >
          {expanded ? "Ver menos" : "Ver mais"}
          <ChevronDown
            size={14}
            className={`transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
          />
        </button>

        <div
          id={contentId}
          className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out ${
            expanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="pt-4 space-y-6">
            <p className="text-xs">
              Aplicativo independente com ferramentas para o dia a dia do policial militar do Estado de São Paulo.
              Não é sistema oficial da PMESP.
            </p>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground">Conteúdo</p>
                <ul className="space-y-1.5 text-xs">
                  <li><Link to="/conteudos" className="hover:text-foreground hover:underline">Central de Conteúdo</Link></li>
                  <li><Link to="/blog" className="hover:text-foreground hover:underline">Blog</Link></li>
                  <li><Link to="/manual" className="hover:text-foreground hover:underline">Manual</Link></li>
                  <li><Link to="/faq" className="hover:text-foreground hover:underline">Perguntas frequentes</Link></li>
                </ul>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground">Suporte</p>
                <ul className="space-y-1.5 text-xs">
                  <li><Link to="/ajuda" className="hover:text-foreground hover:underline">Central de ajuda</Link></li>
                  <li><Link to="/contato" className="hover:text-foreground hover:underline">Contato</Link></li>
                  <li><Link to="/mapa-do-site" className="hover:text-foreground hover:underline">Mapa do site</Link></li>
                </ul>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground">Institucional</p>
                <ul className="space-y-1.5 text-xs">
                  <li><Link to="/sobre" className="hover:text-foreground hover:underline">Sobre</Link></li>
                  <li><Link to="/privacidade" className="hover:text-foreground hover:underline">Privacidade</Link></li>
                  <li><Link to="/termos" className="hover:text-foreground hover:underline">Termos de uso</Link></li>
                  <li><Link to="/cookies" className="hover:text-foreground hover:underline">Cookies</Link></li>
                  <li><Link to="/aviso-legal" className="hover:text-foreground hover:underline">Aviso legal</Link></li>
                </ul>
              </div>
            </div>

            <p className="pt-2 text-[11px] text-muted-foreground/80">
              © {year} QAP, QRV! · Todos os direitos reservados · v3.0
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
