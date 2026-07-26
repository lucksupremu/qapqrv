import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { CATEGORIAS, ARTIGOS } from "@/content";
import { Breadcrumbs } from "@/components/breadcrumbs";

export const Route = createFileRoute("/conteudos/")({
  head: () => ({
    meta: [
      { title: "Central de Conteúdo — MIKE TOOLS" },
      { name: "description", content: "Guias, tutoriais e artigos sobre DEJEM, Operação Delegada, escalas, VPN AnyConnect, produtividade e ferramentas do MIKE TOOLS." },
      { property: "og:title", content: "Central de Conteúdo — MIKE TOOLS" },
      { property: "og:url", content: "https://miketools.top/conteudos" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://miketools.top/conteudos" }],
  }),
  component: ConteudosIndex,
});

function ConteudosIndex() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader showBrand={false} title="Central de Conteúdo" subtitle="Guias e tutoriais" />
      <Breadcrumbs items={[{ label: "Início", to: "/" }, { label: "Conteúdos" }]} />
      <main className="mx-auto max-w-3xl px-5 py-5">
        <p className="mb-5 text-sm text-muted-foreground">
          Reunimos aqui tudo o que você precisa saber para aproveitar o MIKE TOOLS e o cotidiano operacional na PMESP. Escolha uma categoria abaixo.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {CATEGORIAS.map((c) => {
            const count = ARTIGOS.filter((a) => a.category === c.slug).length;
            return (
              <Link
                key={c.slug}
                to="/conteudos/$categoria"
                params={{ categoria: c.slug }}
                className="rounded-2xl border border-border bg-card p-4 transition hover:border-primary/60 hover:shadow-sm"
              >
                <h2 className="text-base font-bold text-foreground">{c.title}</h2>
                <p className="mt-1 text-xs text-muted-foreground">{c.description}</p>
                <p className="mt-2 text-[11px] font-semibold uppercase text-primary">
                  {count} {count === 1 ? "artigo" : "artigos"}
                </p>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
