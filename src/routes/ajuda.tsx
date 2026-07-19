import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { AJUDA } from "@/content";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/ajuda")({
  head: () => ({
    meta: [
      { title: "Central de Ajuda — QAP, QRV!" },
      { name: "description", content: "Tudo o que você precisa para configurar escalas, DEJEM, Delegada, calendário, VPN AnyConnect, folha de pagamento, backup e instalação no QAP, QRV!." },
      { property: "og:title", content: "Central de Ajuda — QAP, QRV!" },
      { property: "og:url", content: "https://miketools.top/ajuda" },
    ],
    links: [{ rel: "canonical", href: "https://miketools.top/ajuda" }],
  }),
  component: AjudaScreen,
});

function AjudaScreen() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader showBrand={false} title="Central de Ajuda" subtitle="Guia rápido" />
      <Breadcrumbs items={[{ label: "Início", to: "/" }, { label: "Ajuda" }]} />
      <main className="mx-auto max-w-3xl px-5 py-5 space-y-6">
        <p className="text-sm text-muted-foreground">
          Escolha um tema e expanda para ver as instruções. Se não encontrar o que procura, escreva para nós pela página de contato.
        </p>
        {AJUDA.map((sec) => (
          <section key={sec.slug}>
            <h2 className="mb-2 text-base font-bold text-foreground">{sec.titulo}</h2>
            <Accordion type="single" collapsible className="rounded-xl border border-border bg-card">
              {sec.itens.map((it, i) => (
                <AccordionItem key={i} value={`${sec.slug}-${i}`} className="border-b border-border/60 last:border-b-0">
                  <AccordionTrigger className="px-4 text-left text-sm font-semibold">{it.titulo}</AccordionTrigger>
                  <AccordionContent className="px-4 text-sm text-foreground/85">{it.conteudo}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        ))}
      </main>
    </div>
  );
}
