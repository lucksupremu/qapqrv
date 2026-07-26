import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { FAQ } from "@/content";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "Perguntas frequentes — MIKE TOOLS" },
      { name: "description", content: "Respostas para as dúvidas mais comuns sobre DEJEM, Delegada, calendário, VPN, instalação e uso do MIKE TOOLS." },
      { property: "og:title", content: "Perguntas frequentes — MIKE TOOLS" },
      { property: "og:url", content: "https://miketools.top/faq" },
    ],
    links: [{ rel: "canonical", href: "https://miketools.top/faq" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),
  component: FaqScreen,
});

function FaqScreen() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader showBrand={false} title="Perguntas frequentes" subtitle="FAQ" />
      <Breadcrumbs items={[{ label: "Início", to: "/" }, { label: "FAQ" }]} />
      <main className="mx-auto max-w-3xl px-5 py-5">
        <p className="mb-4 text-sm text-muted-foreground">
          Se sua dúvida não estiver aqui, escreva pelo Contato.
        </p>
        <Accordion type="single" collapsible className="rounded-xl border border-border bg-card">
          {FAQ.map((f, i) => (
            <AccordionItem key={i} value={`q-${i}`} className="border-b border-border/60 last:border-b-0">
              <AccordionTrigger className="px-4 text-left text-sm font-semibold">{f.q}</AccordionTrigger>
              <AccordionContent className="px-4 text-sm text-foreground/85">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </main>
    </div>
  );
}
