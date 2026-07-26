import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { getCategoria, artigosPorCategoria } from "@/content";
import { Clock } from "lucide-react";

export const Route = createFileRoute("/conteudos/$categoria/")({
  loader: ({ params }) => {
    const cat = getCategoria(params.categoria);
    if (!cat) throw notFound();
    return { categoria: cat, artigos: artigosPorCategoria(cat.slug) };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [] };
    const { categoria } = loaderData;
    return {
      meta: [
        { title: `${categoria.title} — Central de Conteúdo MIKE TOOLS` },
        { name: "description", content: categoria.description },
        { property: "og:title", content: `${categoria.title} — MIKE TOOLS` },
        { property: "og:url", content: `https://miketools.top/conteudos/${categoria.slug}` },
      ],
      links: [{ rel: "canonical", href: `https://miketools.top/conteudos/${categoria.slug}` }],
    };
  },
  component: CategoriaScreen,
});

function CategoriaScreen() {
  const { categoria, artigos } = Route.useLoaderData();
  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader showBrand={false} title={categoria.title} subtitle="Categoria" />
      <Breadcrumbs
        items={[
          { label: "Início", to: "/" },
          { label: "Conteúdos", to: "/conteudos" },
          { label: categoria.title },
        ]}
      />
      <main className="mx-auto max-w-3xl px-5 py-5">
        <p className="mb-5 text-sm text-muted-foreground">{categoria.description}</p>
        {artigos.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
            Novos artigos em breve.
          </p>
        ) : (
          <div className="space-y-3">
            {artigos.map((a: any) => (
              <Link
                key={a.slug}
                to="/conteudos/$categoria/$slug"
                params={{ categoria: categoria.slug, slug: a.slug }}
                className="block rounded-2xl border border-border bg-card p-4 transition hover:border-primary/60 hover:shadow-sm"
              >
                <h2 className="text-base font-bold text-foreground">{a.title}</h2>
                <p className="mt-1 text-xs text-muted-foreground">{a.subtitle}</p>
                <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Clock size={11} /> {a.readingMinutes} min
                  </span>
                  <span>{new Date(a.date).toLocaleDateString("pt-BR")}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
